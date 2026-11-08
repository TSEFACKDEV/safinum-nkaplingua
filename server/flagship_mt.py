"""Fournisseur MT optionnel pour les modèles `flagship-ai`.

Les modèles sont des MarianMT convertis en CTranslate2 int8. Ils sont
volontairement chargés à la demande : le CI et le mode maquette ne doivent pas
télécharger ni charger 80 Mo de poids.

Le module ne journalise jamais le texte traduit. Il expose aussi les fonctions
de découpage des jetons `[[NUM_0]]` / `[[0]]`, testables sans modèle.
"""

from __future__ import annotations

import re
import threading
from pathlib import Path
from typing import List, Optional

# Jetons produits par l'extension (`[[NUM_0]]`, `[[NAME_2]]`) et par le
# backend (`[[0]]`, `[[1]]`). On accepte les variantes avec espaces.
PLACEHOLDER_RE = re.compile(
    r"(\[\[\s*(?:NUM|URL|EMAIL|NAME|TERM)\s*_\s*\d+\s*\]\]|"
    r"\[\s*\[\s*\d+\s*\]\s*\])",
    re.IGNORECASE,
)
LETTER_RE = re.compile(r"[^\W\d_]", re.UNICODE)
SPACE_BEFORE_PUNCT_RE = re.compile(r"\s+([.,;:!?])")
OPEN_PAREN_RE = re.compile(r"\(\s+")
CLOSE_PAREN_RE = re.compile(r"\s+\)")

PAIR_BY_TARGET = {
    "fub": "francais-fufulde",
    "ewo": "francais-ewondo",
}

REVERSE_PAIR_BY_TARGET = {
    "fub": "fufulde-francais",
    "ewo": "ewondo-francais",
}


class FlagshipUnavailable(RuntimeError):
    """Le modèle demandé n'est pas installé ou ne peut pas être chargé."""


def model_path(model_dir: Path | str, pair: str) -> Path:
    return Path(model_dir).expanduser() / pair / "model.bin"


def is_model_available(model_dir: Path | str, target: str) -> bool:
    pair = PAIR_BY_TARGET.get(str(target))
    if not pair:
        return False
    return model_path(model_dir, pair).is_file()


def split_placeholders(text: str) -> List[str]:
    """Découpe un texte en morceaux texte / jetons, sans perdre l'ordre."""
    return [part for part in PLACEHOLDER_RE.split(str(text or "")) if part != ""]


def is_placeholder(part: str) -> bool:
    return bool(PLACEHOLDER_RE.fullmatch(part or ""))


def normalize_spacing(text: str) -> str:
    """Nettoie les espaces créés par la traduction séparée des morceaux."""
    value = re.sub(r"\s+", " ", str(text or "")).strip()
    value = SPACE_BEFORE_PUNCT_RE.sub(r"\1", value)
    value = OPEN_PAREN_RE.sub("(", value)
    value = CLOSE_PAREN_RE.sub(")", value)
    return value


class FlagshipTranslator:
    """Traducteur MarianMT/CTranslate2 avec préservation des jetons.

    Les jetons sont retirés avant l'appel au modèle, puis remis dans l'ordre.
    C'est moins fluide qu'une traduction globale, mais cela garantit qu'un
    montant, un nom ou un terme protégé ne disparaît pas.
    """

    def __init__(
        self,
        model_dir: Path | str,
        target: str,
        device: str = "cpu",
        compute_type: str = "int8",
        beam_size: int = 5,
        no_repeat_ngram_size: int = 3,
        repetition_penalty: float = 1.15,
        max_decoding_length: int = 256,
        pair: str | None = None,
    ) -> None:
        self.model_dir = Path(model_dir).expanduser()
        self.target = target
        self.pair = pair or PAIR_BY_TARGET.get(target)
        if not self.pair:
            raise FlagshipUnavailable(f"Pas de modèle flagship pour {target!r}.")
        self.path = self.model_dir / self.pair
        self.device = device
        self.compute_type = compute_type
        self.beam_size = beam_size
        self.no_repeat_ngram_size = no_repeat_ngram_size
        self.repetition_penalty = repetition_penalty
        self.max_decoding_length = max_decoding_length
        self._lock = threading.Lock()
        self._load_lock = threading.Lock()
        self._tokenizer = None
        self._translator = None

    @property
    def available(self) -> bool:
        return model_path(self.model_dir, self.pair).is_file()

    def _load(self) -> None:
        if self._translator is not None:
            return
        with self._load_lock:
            if self._translator is not None:
                return
            if not self.available:
                raise FlagshipUnavailable(f"Modèle absent : {self.path}")

            try:
                import ctranslate2
                from transformers import MarianTokenizer
            except Exception as exc:  # pragma: no cover
                raise FlagshipUnavailable(
                    "ctranslate2 et transformers sont requis pour le mode "
                    "flagship."
                ) from exc

            try:
                self._tokenizer = MarianTokenizer.from_pretrained(
                    str(self.path), local_files_only=True
                )
                self._translator = ctranslate2.Translator(
                    str(self.path),
                    device=self.device,
                    compute_type=self.compute_type,
                    inter_threads=1,
                )
            except Exception as exc:  # pragma: no cover - dépend des poids
                raise FlagshipUnavailable(
                    f"Chargement impossible du modèle {self.pair}: {exc}"
                ) from exc

    def _translate_chunk(self, chunk: str, config: dict | None = None) -> str:
        if not chunk.strip() or not LETTER_RE.search(chunk):
            return chunk

        assert self._tokenizer is not None
        assert self._translator is not None

        tokens = self._tokenizer.convert_ids_to_tokens(
            self._tokenizer.encode(chunk)
        )
        if not tokens:
            return chunk

        options = config or {}
        # Un libellé court (« Montant », « Sécurité ») ne doit pas devenir une
        # phrase entière. On plafonne la longueur de décodage selon la source.
        source_len = len(tokens)
        if "max_decoding_length" in options:
            max_decoding_length = int(options["max_decoding_length"])
        elif source_len <= 8:
            max_decoding_length = max(20, min(48, source_len * 4 + 12))
        else:
            max_decoding_length = max(24, min(128, source_len * 2 + 12))

        with self._lock:
            result = self._translator.translate_batch(
                [tokens],
                beam_size=int(options.get("beam_size", self.beam_size)),
                length_penalty=float(
                    options.get("length_penalty", 1.0)
                ),
                no_repeat_ngram_size=int(
                    options.get(
                        "no_repeat_ngram_size", self.no_repeat_ngram_size
                    )
                ),
                repetition_penalty=float(
                    options.get(
                        "repetition_penalty", self.repetition_penalty
                    )
                ),
                max_decoding_length=max_decoding_length,
            )

        if not result or not result[0].hypotheses:
            return chunk
        output = self._tokenizer.decode(
            self._tokenizer.convert_tokens_to_ids(result[0].hypotheses[0]),
            skip_special_tokens=True,
        )
        return output.strip() or chunk

    def translate(
        self, texts: List[str], config: dict | None = None
    ) -> List[str]:
        self._load()
        outputs: List[str] = []
        for text in texts:
            pieces = split_placeholders(text)
            translated_pieces: List[str] = []
            for piece in pieces:
                if is_placeholder(piece) or not LETTER_RE.search(piece):
                    translated_pieces.append(piece)
                else:
                    translated_pieces.append(
                        self._translate_chunk(piece, config=config)
                    )
            outputs.append(
                normalize_spacing(
                    " ".join(piece for piece in translated_pieces if piece)
                )
            )
        return outputs


def build_translator(
    model_dir: Path | str,
    target: str,
    device: str = "cpu",
    compute_type: str = "int8",
) -> Optional[FlagshipTranslator]:
    """Retourne un traducteur si le modèle est présent, sinon None."""
    if not is_model_available(model_dir, target):
        return None
    return FlagshipTranslator(
        model_dir=model_dir,
        target=target,
        device=device,
        compute_type=compute_type,
    )
