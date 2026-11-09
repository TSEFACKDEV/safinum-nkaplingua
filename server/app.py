"""
NkapLingua — backend local de traduction.

Deux moteurs sont possibles :

- **flagship-ai** (MarianMT/CTranslate2, brouillon) pour le fulfulde (`fub`)
  et l'ewondo (`ewo`). Les poids ne sont pas versionnés : voir
  `NK_FLAGSHIP_MODEL_DIR`.
- **NLLB-200** (CC BY-NC 4.0) pour le fulfulde, en secours si le modèle
  flagship est absent. NLLB utilise `fuv_Latn` (fulfulde nigérian), très proche
  du fulfulde adamawa.

Le duala reste en pack communautaire : aucun modèle de traduction validé.

Le backend écoute uniquement sur 127.0.0.1 et ne journalise pas le texte.
Le niveau A (solde, frais, PIN/OTP, etc.) ne doit jamais passer par la MT :
l'extension bloque ces phrases si le pack n'a pas d'entrée validée, et le
backend refuse aussi un segment marqué `critical`.

Lancement :
    pip install -r requirements.txt
    NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000

Mode maquette (sans modèle, pour tester l'extension) :
    NK_MOCK=1 uvicorn app:app --host 127.0.0.1 --port 8000

Note licence : NLLB est CC BY-NC 4.0 ; le bundle flagship `cameroon-int8`
est CC BY-NC 4.0 (la sous-fiche `francais-ewondo` indique CC BY 4.0, conflit
à clarifier). Les modèles fp32 `francais-fufulde` et `francais-bulu` sont
CC BY 4.0. Usage hackathon non commercial, avec attribution.
"""

from __future__ import annotations

import csv
import difflib
import os
import re
import sys
import threading
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Permettre `python server/app.py` depuis la racine du dépôt.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from flagship_mt import (  # noqa: E402
    FlagshipTranslator,
    FlagshipUnavailable,
    PAIR_BY_TARGET,
    is_model_available,
)

ROOT = Path(__file__).resolve().parent.parent
MODEL_NAME = os.getenv("NK_MODEL", "facebook/nllb-200-distilled-600M")
MAX_INPUT_TOKENS = int(os.getenv("NK_MAX_INPUT_TOKENS", "256"))
MAX_NEW_TOKENS = int(os.getenv("NK_MAX_NEW_TOKENS", "128"))
BATCH_SIZE = int(os.getenv("NK_BATCH_SIZE", "8"))
NUM_BEAMS = int(os.getenv("NK_NUM_BEAMS", "2"))
REPETITION_PENALTY = float(os.getenv("NK_REPETITION_PENALTY", "1.2"))
NO_REPEAT_NGRAM = int(os.getenv("NK_NO_REPEAT_NGRAM", "4"))
DEVICE_PREFERENCE = os.getenv("NK_DEVICE", "auto").lower()
MOCK_MODE = os.getenv("NK_MOCK", "0") == "1"
QUANTIZE_MODEL = os.getenv("NK_QUANTIZE", "0") == "1"

# --- Moteur flagship-ai (brouillon MT) -------------------------------
# "auto" : utilise le modèle s'il est présent ; "0" le désactive.
FLAGSHIP_MODE = os.getenv("NK_FLAGSHIP_MT", "auto").strip().lower()
FLAGSHIP_MODEL_DIR = Path(
    os.getenv(
        "NK_FLAGSHIP_MODEL_DIR",
        str(ROOT / "dist" / "models" / "flagship-int8"),
    )
).expanduser()
FLAGSHIP_DEVICE = os.getenv("NK_FLAGSHIP_DEVICE", "cpu")
FLAGSHIP_COMPUTE_TYPE = os.getenv("NK_FLAGSHIP_COMPUTE_TYPE", "int8")
FLAGSHIP_BEAM_SIZE = int(os.getenv("NK_FLAGSHIP_BEAM_SIZE", "5"))
FLAGSHIP_NO_REPEAT = int(os.getenv("NK_FLAGSHIP_NO_REPEAT", "3"))
FLAGSHIP_REPETITION_PENALTY = float(
    os.getenv("NK_FLAGSHIP_REPETITION_PENALTY", "1.15")
)
FLAGSHIP_TARGETS = {"fub", "ewo"}
FLAGSHIP_DISABLED = FLAGSHIP_MODE in {"0", "false", "off", "no", "none"}

# Le tokenizer NLLB est partagé : `src_lang` est un état mutable. Un verrou
# sérialise la section tokenize → generate → decode pour éviter qu'une requête
# FR et une requête EN se mélangent (M13).
_MODEL_LOCK = threading.Lock()

# Contrôle de cohérence par rétro-traduction : NLLB traduit la sortie
# fulfulde vers le français, puis on compare avec la source. Un score trop
# bas signale une hallucination probable et l'original est conservé.
ROUNDTRIP_ENABLED = os.getenv("NK_ROUNDTRIP", "1") == "1"
ROUNDTRIP_MIN_SIMILARITY = float(os.getenv("NK_ROUNDTRIP_MIN", "0.45"))
ROUNDTRIP_MAX_CHARS = int(os.getenv("NK_ROUNDTRIP_MAX_CHARS", "220"))
QUALITY_ENABLED = os.getenv("NK_QUALITY", "1") == "1"
FRENCH_LEAK_MAX = float(os.getenv("NK_QUALITY_FRENCH_LEAK", "0.25"))
GLOSSARY_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "glossary.template.csv"
)

# NLLB utilise des codes de type "fra_Latn" / "fuv_Latn".
SOURCE_ALIASES = {
    "fr": "fra_Latn",
    "fra": "fra_Latn",
    "en": "eng_Latn",
    "eng": "eng_Latn",
}

TARGET_ALIASES = {
    "fub": "fuv_Latn",
    "fuv": "fuv_Latn",
    "ff": "fuv_Latn",
    "ful": "fuv_Latn",
}

# Langues sans modèle de traduction validé : l'extension applique uniquement
# une mémoire de traduction communautaire (phrases status=validated).
PACK_TARGETS = {
    "dua": "Duala",
}

LANGUAGE_REGISTRY = [
    {
        "code": "fub",
        "label": "Fulfulde (Adamawa)",
        "engine": "mt",
        "model_code": "flagship-francais-fufulde / fuv_Latn (secours)",
        "status": "mt-draft",
        "license": (
            "flagship-ai CC-BY-4.0 (brouillon) ; "
            "NLLB-200 CC BY-NC 4.0 en secours"
        ),
        "audio": "Common Voice ASR ; 1 303 enregistrements TTS à une voix",
    },
    {
        "code": "ewo",
        "label": "Ewondo",
        "engine": "mt",
        "model_code": "flagship-francais-ewondo",
        "status": "mt-draft",
        "license": (
            "flagship-ai CC-BY-NC-4.0 (bundle) / CC-BY-4.0 (sous-fiche) "
            "— brouillon, validation native requise"
        ),
        "audio": "Common Voice 27.0 : 14,36 h validées, 31 voix ; Ewondo-ASR ~3 h 11, 16 voix",
    },
    {
        "code": "dua",
        "label": "Duala",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
        "audio": "Common Voice 27.0 (heures à vérifier)",
    },
]

DNT_TERMS = [
    "FCFA",
    "XAF",
    "MTN",
    "MoMo",
    "Orange Money",
    "Wave",
    "Visa",
    "Mastercard",
    "WhatsApp",
    "PIN",
    "OTP",
    "KYC",
    "IBAN",
    "SWIFT",
    "FINAKA",
    "Aïcha",
]

TOKEN_RE = re.compile(
    r"\[\[\s*(NUM|URL|EMAIL|NAME|TERM)\s*_\s*(\d+)\s*\]\]",
    re.IGNORECASE,
)
NORMALIZED_TOKEN_RE = re.compile(
    r"\[\s*\[\s*(NUM|URL|EMAIL|NAME|TERM)\s*_\s*(\d+)\s*\]\s*\]",
    re.IGNORECASE,
)
BARE_TOKEN_RE = re.compile(r"\[\[\s*(\d+)\s*\]\]")
NORMALIZED_BARE_TOKEN_RE = re.compile(r"\[\s*\[\s*(\d+)\s*\]\s*\]")


class Segment(BaseModel):
    id: str
    text: str
    context: str = ""
    # Niveau A (solde, frais, PIN/OTP, etc.) : jamais de MT.
    critical: bool = False


class TranslateRequest(BaseModel):
    segments: List[Segment]
    target: str = "fub"
    source: str = "fr"


class DetectRequest(BaseModel):
    text: str = ""
    hint: str = ""


class Translation(BaseModel):
    id: str
    text: str
    ok: bool
    reason: Optional[str] = None
    roundtrip: Optional[float] = None


class TranslateResponse(BaseModel):
    translations: List[Translation]
    model: str
    provider: str = "nllb"
    target: str


app = FastAPI(title="NkapLingua API", version="0.4.0")

# Le backend est local ; on n'ouvre pas les origines à tout Internet.
# En production, remplacer par l'ID exact de l'extension et un jeton.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    # Chrome : chrome-extension://<id>
    # Firefox : moz-extension://<uuid>
    allow_origin_regex=r"(chrome|moz|safari-web)-extension://.*",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@lru_cache(maxsize=1)
def load_model():
    if MOCK_MODE:
        return None, None, "cpu"

    # Imports lourds uniquement quand le modèle réel est demandé.
    # Cela permet au CI et au mode maquette de tourner sans torch.
    import torch
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    device = "cpu"
    dtype = torch.float32

    # Certaines cartes NVIDIA anciennes (ex. GeForce 930MX, compute 5.0) sont
    # détectées par torch.cuda.is_available() mais ne sont pas supportées par
    # les roues CUDA récentes. On vérifie donc la capacité de calcul.
    use_cuda = False
    if DEVICE_PREFERENCE in {"auto", "cuda"} and torch.cuda.is_available():
        try:
            major, minor = torch.cuda.get_device_capability(0)
            use_cuda = (major, minor) >= (7, 5)
        except Exception:
            use_cuda = False

    if DEVICE_PREFERENCE == "cuda" and not use_cuda:
        raise RuntimeError(
            "NK_DEVICE=cuda demandé, mais ce GPU n'est pas supporté par "
            "la version de PyTorch installée. Utilisez NK_DEVICE=cpu."
        )

    if use_cuda:
        device = "cuda"
        dtype = torch.float16
    elif DEVICE_PREFERENCE in {"auto", "mps"} and getattr(
        torch.backends, "mps", None
    ) and torch.backends.mps.is_available():
        device = "mps"

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_NAME, src_lang="fra_Latn"
    )
    model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=dtype,
        low_cpu_mem_usage=True,
    )
    model.to(device)
    if QUANTIZE_MODEL and device == "cpu":
        # Quantification dynamique : moins de RAM, CPU plus rapide.
        # Optionnelle car certains noyaux NLLB ne la supportent pas.
        model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear},
            dtype=torch.qint8,
        )
    model.eval()
    return tokenizer, model, device


def flagship_available(target: str) -> bool:
    """Vérifie la présence du modèle sans le charger."""
    if FLAGSHIP_DISABLED or target not in FLAGSHIP_TARGETS:
        return False
    return is_model_available(FLAGSHIP_MODEL_DIR, target)


@lru_cache(maxsize=2)
def load_flagship_translator(target: str) -> FlagshipTranslator | None:
    """Charge un modèle flagship à la demande ; None s'il est absent."""
    if not flagship_available(target):
        return None
    try:
        return FlagshipTranslator(
            model_dir=FLAGSHIP_MODEL_DIR,
            target=target,
            device=FLAGSHIP_DEVICE,
            compute_type=FLAGSHIP_COMPUTE_TYPE,
            beam_size=FLAGSHIP_BEAM_SIZE,
            no_repeat_ngram_size=FLAGSHIP_NO_REPEAT,
            repetition_penalty=FLAGSHIP_REPETITION_PENALTY,
        )
    except FlagshipUnavailable:
        return None


def generate_flagship_batch(texts: List[str], target: str) -> List[str]:
    translator = load_flagship_translator(target)
    if translator is None:
        raise FlagshipUnavailable(
            f"Modèle flagship indisponible pour {target}."
        )
    return translator.translate(texts)


MOCK_PREFIX = {
    "fub": "[fulfulde]",
    "ewo": "[ewondo]",
}


def mock_translate(texts: List[str], target: str) -> List[str]:
    prefix = MOCK_PREFIX.get(target, "[mock]")
    return [f"{prefix} {text}" for text in texts]


@lru_cache(maxsize=1)
def load_glossary() -> tuple[tuple[str, str], ...]:
    """Charge les termes finance validés (target_fub non vide)."""
    if not GLOSSARY_PATH.exists():
        return ()

    entries = []
    with GLOSSARY_PATH.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            status = (row.get("status") or "").strip().lower()
            target = (row.get("target_fub") or "").strip()
            source = (row.get("source_fr") or "").strip()
            if status in {"validated", "validé", "valide"} and source and target:
                entries.append((source, target))

    return tuple(sorted(entries, key=lambda item: len(item[0]), reverse=True))


def protect_terms(
    text: str,
    glossary: tuple[tuple[str, str], ...] | None = None,
) -> tuple[str, list[dict]]:
    """Tokenise les termes critiques et les termes validés avant le modèle.

    Cela évite que NLLB traduise FCFA, PIN ou FINAKA, puis que le contrôle
    rejette une traduction par ailleurs correcte. Les termes du glossaire sont
    restaurés avec leur traduction validée.
    """
    value = text
    terms: list[dict] = []
    entries = load_glossary() if glossary is None else glossary

    # Les jetons déjà présents (envoyés par l'extension) ne doivent pas être
    # réutilisés : sinon un FCFA brut et un [[0]] existant se confondent.
    existing = [
        int(match.group(1))
        for match in BARE_TOKEN_RE.finditer(value)
    ] + [
        int(match.group(1))
        for match in NORMALIZED_BARE_TOKEN_RE.finditer(value)
    ]
    next_index = max(existing, default=-1) + 1

    # Glossaire d'abord : « code PIN » doit être capturé avant « PIN ».
    for source, target in entries:
        pattern = re.compile(
            rf"(?<!\w){re.escape(source)}(?!\w)", re.IGNORECASE
        )
        while True:
            match = pattern.search(value)
            if not match:
                break
            token = f"[[{next_index}]]"
            next_index += 1
            terms.append(
                {
                    "token": token,
                    "original": match.group(0),
                    "target": target,
                    "term": source,
                }
            )
            value = f"{value[:match.start()]}{token}{value[match.end():]}"

    for term in sorted(DNT_TERMS, key=len, reverse=True):
        pattern = re.compile(
            rf"(?<!\w){re.escape(term)}(?!\w)", re.IGNORECASE
        )
        while True:
            match = pattern.search(value)
            if not match:
                break
            token = f"[[{next_index}]]"
            next_index += 1
            terms.append(
                {
                    "token": token,
                    "original": match.group(0),
                    "target": match.group(0),
                    "term": term,
                }
            )
            value = f"{value[:match.start()]}{token}{value[match.end():]}"

    return value, terms


def restore_terms(text: str, terms: list[dict]) -> Optional[str]:
    value = NORMALIZED_BARE_TOKEN_RE.sub(
        lambda match: f"[[{match.group(1)}]]",
        normalize_placeholders(text),
    )
    for item in terms:
        if value.count(item["token"]) != 1:
            return None
        value = value.replace(
            item["token"], item.get("target") or item["original"]
        )
    return value


def normalize_placeholders(text: str) -> str:
    return NORMALIZED_TOKEN_RE.sub(
        lambda match: f"[[{match.group(1).upper()}_{match.group(2)}]]",
        text,
    )


def tokens_of(text: str) -> set[str]:
    return {
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    }


def bare_tokens_of(text: str) -> list[str]:
    return [
        f"[[{match.group(1)}]]"
        for match in BARE_TOKEN_RE.finditer(text)
    ]




PLAIN_TOKEN_RE = re.compile(
    r"(?<!\w)\[?\s*\[?\s*(NUM|URL|EMAIL|NAME|TERM)\s*_\s*(\d+)"
    r"\s*\]?\s*\]?(?!\w)",
    re.IGNORECASE,
)


def repair_plain_tokens(source: str, translation: str) -> str:
    """Répare les jetons que NLLB dégrade en ``NAME_0`` ou ``[[0]]``.

    Le modèle perd parfois les crochets ou remplace ``[[NUM_0]]`` par
    ``[[0]]``. On ne devine pas un contenu : on réutilise uniquement les
    jetons présents dans la source.
    """
    value = normalize_placeholders(translation)
    for match in TOKEN_RE.finditer(source):
        kind = match.group(1).upper()
        number = match.group(2)
        canonical = f"[[{kind}_{number}]]"
        if canonical in value:
            continue
        pattern = re.compile(
            rf"(?<!\w)\[?\s*\[?\s*{kind}\s*_\s*{number}"
            rf"\s*\]?\s*\]?(?!\w)",
            re.IGNORECASE,
        )
        if pattern.search(value):
            value = pattern.sub(canonical, value, count=1)

    source_numbers = [
        f"[[{match.group(1)}]]" for match in BARE_TOKEN_RE.finditer(source)
    ]
    source_num_tokens = [
        f"[[NUM_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(source)
        if match.group(1).upper() == "NUM"
    ]
    for index, match in enumerate(BARE_TOKEN_RE.finditer(value)):
        bare = match.group(0)
        if bare in source_numbers:
            continue
        if index < len(source_num_tokens):
            value = value.replace(bare, source_num_tokens[index], 1)
    return value


def contains_term(text: str, term: str) -> bool:
    """Évite les faux positifs du type "PIN" dans "opinion"."""
    return (
        re.search(
            rf"(?<!\w){re.escape(term)}(?!\w)",
            text,
            flags=re.IGNORECASE,
        )
        is not None
    )


FRENCH_WORDS = {
    "le", "la", "les", "un", "une", "des", "du", "de", "dans", "sur",
    "pour", "avec", "sans", "sous", "est", "sont", "ete", "être", "avoir",
    "votre", "vos", "notre", "nos", "vous", "nous", "je", "tu", "il",
    "elle", "ils", "elles", "ce", "cet", "cette", "ces", "qui", "que",
    "quoi", "compte", "solde", "frais", "transfert", "paiement", "montant",
    "beneficiaire", "bénéficiaire", "transaction", "confirmation",
    "securite", "sécurité", "code", "banque", "credit", "crédit", "debit",
    "débit", "taux", "interet", "intérêt", "echeance", "échéance",
    "retard", "penalite", "pénalité", "client", "service", "information",
    "donnee", "données",
}

ENGLISH_WORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for",
    "with", "without", "under", "is", "are", "was", "were", "be", "been",
    "your", "our", "you", "we", "i", "he", "she", "they", "it", "this",
    "that", "these", "those", "who", "what", "which", "account", "balance",
    "fee", "fees", "transfer", "payment", "amount", "beneficiary",
    "transaction", "confirmation", "security", "code", "bank", "credit",
    "debit", "rate", "interest", "due", "late", "penalty", "customer",
    "service", "information", "data",
}


def detect_language(text: str, hint: str = "") -> dict:
    """Détection FR/EN explicable, alignée sur extension/languages.js."""
    value = re.sub(r"\s+", " ", str(text or "")).strip().lower()
    words = re.findall(r"[a-zà-ÿ']+", value)
    french = sum(1 for word in words if word in FRENCH_WORDS)
    english = sum(1 for word in words if word in ENGLISH_WORDS)
    french += len(re.findall(r"[àâçéèêëîïôûùüÿœ]", value)) * 0.6
    english += len(re.findall(r"\b(?:th|wh|sh|ing|tion|ough)\b", value)) * 0.4

    total = french + english
    hinted = hint.lower()[:2] if hint else ""
    guessed = hinted if hinted in {"fr", "en"} else None

    if total == 0:
        return {
            "code": guessed or "unknown",
            "confidence": 0.3 if guessed else 0.0,
            "scores": {"fr": 0.0, "en": 0.0},
            "mixed": False,
        }

    confidence = min(0.99, round(abs(french - english) / total, 2))
    if french >= english * 1.25:
        code = "fr"
    elif english >= french * 1.25:
        code = "en"
    else:
        code = "mixed"

    if guessed and total < 2:
        return {
            "code": guessed,
            "confidence": 0.3,
            "scores": {
                "fr": round(french, 1),
                "en": round(english, 1),
            },
            "mixed": False,
        }

    return {
        "code": code,
        "confidence": confidence,
        "scores": {
            "fr": round(french, 1),
            "en": round(english, 1),
        },
        "mixed": code == "mixed",
    }


FRENCH_LEAK_WORDS = {
    "le", "la", "les", "des", "une", "et", "est", "sont", "pour",
    "avec", "votre", "vos", "vous", "nous", "du", "de", "dans", "sur",
    "ce", "cette", "ces", "qui", "que", "au", "aux", "par", "plus",
}

# Mots anglais qui trahissent une sortie non traduite sur l'ewondo/fulfulde.
ENGLISH_LEAK_WORDS = {
    "the", "and", "is", "are", "to", "of", "for", "with", "this",
    "that", "these", "those", "your", "our", "you", "we", "amount",
    "security", "summary", "transfer", "balance", "fee", "fees",
    "confirmation", "new", "view", "make", "name", "account",
    "current", "recent", "payment", "salary", "electricity", "bill",
    "success", "status", "reference", "phone", "operation", "modify",
    "continue", "back", "confirm", "send", "received", "merchant",
    "available", "total", "net",
}


def quality_check(
    source: str,
    translation: str,
    allow_source_leak: bool = False,
) -> tuple[bool, Optional[str]]:
    """Filtre les sorties manifestement dégénérées sur du contenu inédit."""
    source_clean = normalize_similarity_text(source)
    target_clean = normalize_similarity_text(translation)

    if not target_clean:
        return False, "empty_translation"
    if source_clean == target_clean:
        return False, "untranslated"

    source_words = source_clean.split()
    target_words = target_clean.split()

    # Une sortie majoritairement anglaise n'est pas une traduction vers
    # l'ewondo/le fulfulde : on préfère conserver la source.
    if target_words and not allow_source_leak:
        english_leak = sum(
            1 for word in target_words if word in ENGLISH_LEAK_WORDS
        )
        if english_leak / len(target_words) >= 0.5:
            return False, "english_leak"

    # Les phrases très courtes (libellés, boutons) sont peu comparables.
    if len(source_words) >= 4:
        if len(target_words) < max(2, int(len(source_words) * 0.35)):
            return False, "too_short"
        if len(target_words) > max(12, int(len(source_words) * 3.0)):
            return False, "too_long"

        if len(target_words) >= 8:
            unique_ratio = len(set(target_words)) / len(target_words)
            if unique_ratio < 0.30:
                return False, "repetitive"

        if not allow_source_leak and len(target_words) >= 6:
            leak = sum(
                1 for word in target_words if word in FRENCH_LEAK_WORDS
            )
            if leak / len(target_words) > FRENCH_LEAK_MAX:
                return False, "french_leak"

    return True, None


def validate(source: str, translation: str) -> tuple[bool, Optional[str]]:
    if not translation.strip():
        return False, "empty_translation"

    # 1) Tous les jetons de données sensibles doivent être présents une fois.
    source_tokens = tokens_of(source)
    normalized = repair_plain_tokens(source, translation)
    for token in source_tokens:
        if normalized.count(token) != 1:
            return False, f"token_lost:{token}"

    for token in bare_tokens_of(source):
        if normalized.count(token) != 1:
            return False, f"token_lost:{token}"

    # 2) Les termes financiers critiques ne doivent pas être traduits.
    for term in DNT_TERMS:
        if contains_term(source, term) and not contains_term(normalized, term):
            # "F CFA" est une variante acceptable.
            if term == "FCFA" and re.search(
                r"(?<!\w)F\s*CFA(?!\w)", normalized, flags=re.IGNORECASE
            ):
                continue
            return False, f"dnt_missing:{term}"

    # 3) Filtre de qualité sur les sorties dégénérées.
    if not QUALITY_ENABLED:
        return True, None
    return quality_check(source, normalized, allow_source_leak=MOCK_MODE)


def normalize_similarity_text(text: str) -> str:
    value = re.sub(r"\[\[[^\]]+\]\]", " ", text.lower())
    value = re.sub(r"[^\wàâçéèêëîïôûùüÿœ']+", " ", value, flags=re.UNICODE)
    return " ".join(value.split())


def roundtrip_similarity(source: str, back_translation: str) -> float:
    """Similarité lexicale simple entre source et rétro-traduction."""
    left = normalize_similarity_text(source)
    right = normalize_similarity_text(back_translation)
    if not left or not right:
        return 0.0
    return difflib.SequenceMatcher(None, left, right).ratio()


def split_sentences(text: str, max_chars: int = 220) -> List[str]:
    """Découpe les longs paragraphes : NLLB répète sur les très longues entrées."""
    text = text.strip()
    if not text:
        return []

    # Découpe après un point, un point d'interrogation ou d'exclamation.
    parts = re.split(r"(?<=[.!?])\s+", text)
    result: List[str] = []

    for part in parts:
        part = part.strip()
        if not part:
            continue
        if len(part) <= max_chars:
            result.append(part)
            continue

        # Deuxième découpe sur les virgules / points-virgules.
        chunks = re.split(r"(?<=[,;:])\s+", part)
        current = ""
        for chunk in chunks:
            if not current:
                current = chunk
            elif len(current) + 1 + len(chunk) <= max_chars:
                current = f"{current} {chunk}"
            else:
                result.append(current)
                current = chunk
        if current:
            result.append(current)

    return result


def _generate_locked(
    tokenizer,
    model,
    device: str,
    texts: List[str],
    source_lang: str,
    target_lang: str,
) -> List[str]:
    """Section critique unique autour du tokenizer et du modèle partagés.

    `tokenizer.src_lang` est un état global : sans verrou, deux requêtes
    simultanées FR/EN peuvent se mélanger. Le verrou couvre l'encodage, la
    génération et le décodage ; les requêtes sont donc sérialisées.
    """
    import torch

    with _MODEL_LOCK:
        tokenizer.src_lang = source_lang
        encoded = tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=MAX_INPUT_TOKENS,
        ).to(device)

        target_token_id = tokenizer.convert_tokens_to_ids(target_lang)
        if target_token_id == tokenizer.unk_token_id:
            raise RuntimeError(f"Code de langue NLLB inconnu : {target_lang}")

        with torch.inference_mode():
            generated = model.generate(
                **encoded,
                forced_bos_token_id=target_token_id,
                max_new_tokens=MAX_NEW_TOKENS,
                num_beams=NUM_BEAMS,
                repetition_penalty=REPETITION_PENALTY,
                no_repeat_ngram_size=NO_REPEAT_NGRAM,
                length_penalty=1.0,
                early_stopping=True,
            )

        return tokenizer.batch_decode(generated, skip_special_tokens=True)


def generate_batch(
    texts: List[str], source_lang: str, target_lang: str
) -> List[str]:
    tokenizer, model, device = load_model()

    if MOCK_MODE:
        return [f"[fulfulde] {text}" for text in texts]

    if tokenizer is None or model is None:
        raise RuntimeError("Modèle non chargé.")

    return _generate_locked(
        tokenizer, model, device, texts, source_lang, target_lang
    )


def safe_generate_batch(
    texts: List[str], source_lang: str, target_lang: str
) -> List[str]:
    """Réessaie un par un si le batch dépasse la mémoire."""
    try:
        return generate_batch(texts, source_lang, target_lang)
    except RuntimeError as error:
        if "out of memory" not in str(error).lower():
            raise
        import torch

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        return [
            generate_batch([text], source_lang, target_lang)[0]
            for text in texts
        ]


@app.get("/health")
def health():
    # Ne pas déclencher le téléchargement du modèle sur un simple health check.
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "mock": MOCK_MODE,
        "loaded": MOCK_MODE or load_model.cache_info().currsize > 0,
        "roundtrip": ROUNDTRIP_ENABLED and not MOCK_MODE,
        "roundtrip_min": ROUNDTRIP_MIN_SIMILARITY,
        "quality": QUALITY_ENABLED,
        "french_leak_max": FRENCH_LEAK_MAX,
        "quantized": QUANTIZE_MODEL,
        "flagship": {
            "mode": FLAGSHIP_MODE,
            "dir": str(FLAGSHIP_MODEL_DIR),
            "models": {
                target: flagship_available(target)
                for target in sorted(FLAGSHIP_TARGETS)
            },
        },
    }


@app.get("/demo")
def demo():
    """Sert la page de démonstration depuis la même origine que l'API.

    Utile pour tester l'extension sans activer l'accès aux fichiers locaux.
    """
    demo_path = Path(__file__).resolve().parent.parent / "demo" / "index.html"
    if not demo_path.exists():
        raise HTTPException(status_code=404, detail="demo/index.html introuvable")
    return FileResponse(demo_path, media_type="text/html")


@app.get("/languages")
def languages():
    return {
        "source": ["fr", "en"],
        "targets": LANGUAGE_REGISTRY,
        # Ancien champ conservé pour les clients existants.
        "target": LANGUAGE_REGISTRY,
    }


@app.post("/detect")
def detect(request: DetectRequest):
    return detect_language(request.text, request.hint)


@app.post("/translate", response_model=TranslateResponse)
def translate(request: TranslateRequest):
    if not request.segments:
        return TranslateResponse(
            translations=[],
            model=MODEL_NAME,
            provider="none",
            target=request.target,
        )

    if request.target in PACK_TARGETS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"La langue {PACK_TARGETS[request.target]} fonctionne en mode "
                "pack communautaire dans l'extension ; le backend ne produit "
                "pas de traduction automatique validée pour cette langue."
            ),
        )

    source_code = request.source
    if source_code == "auto":
        source_code = detect_language(
            " ".join(segment.text for segment in request.segments)
        )["code"]
        if source_code not in {"fr", "en"}:
            source_code = "fr"

    source_lang = SOURCE_ALIASES.get(source_code)
    if not source_lang:
        raise HTTPException(
            status_code=400,
            detail=f"Langue source non supportée : {request.source}",
        )

    target_lang = TARGET_ALIASES.get(request.target)
    use_flagship = False
    needs_mt = any(not segment.critical for segment in request.segments)
    if not MOCK_MODE:
        # Les modèles flagship sont français -> langue : pas de source
        # anglaise pour l'ewondo, et le fulfulde anglais retombe sur NLLB.
        use_flagship = (
            source_code == "fr" and flagship_available(request.target)
        )
        if request.target == "ewo" and not use_flagship and needs_mt:
            if source_code != "fr":
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Le brouillon MT ewondo est disponible depuis le "
                        "français uniquement."
                    ),
                )
            raise HTTPException(
                status_code=503,
                detail=(
                    "Le modèle brouillon ewondo n'est pas installé. "
                    "Téléchargez flagship-ai/cameroon-int8 ou utilisez "
                    "le pack communautaire."
                ),
            )
        if (
            not use_flagship
            and not target_lang
            and request.target not in MOCK_PREFIX
            and (needs_mt or request.target != "ewo")
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Langue cible non supportée par ce prototype : "
                    f"{request.target}"
                ),
            )

    if (
        MOCK_MODE
        and request.target not in TARGET_ALIASES
        and request.target not in MOCK_PREFIX
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Langue cible non supportée par ce prototype : {request.target}",
        )

    # On protège les termes critiques, puis on découpe chaque segment en
    # phrases : NLLB est plus stable sur des entrées courtes.
    protected_by_id = {}
    expanded = []
    for segment in request.segments:
        # Niveau A : on ne protège même pas, on ne traduit pas.
        if segment.critical:
            continue
        protected, terms = protect_terms(segment.text)
        protected_by_id[segment.id] = {
            "source": protected,
            "terms": terms,
        }
        parts = split_sentences(protected)
        if not parts:
            parts = [protected]
        for index, part in enumerate(parts):
            expanded.append(
                {
                    "original_id": segment.id,
                    "sub_id": f"{segment.id}::{index}",
                    "text": part,
                }
            )

    outputs: List[str] = []
    texts = [item["text"] for item in expanded]
    provider = "none"
    model_used = "none"

    if not texts:
        # Tous les segments sont critiques : aucun appel au modèle.
        outputs = []
    elif MOCK_MODE:
        outputs = mock_translate(texts, request.target)
        provider = "mock"
        model_used = "mock"
    elif use_flagship:
        try:
            outputs = generate_flagship_batch(texts, request.target)
            provider = "flagship"
            model_used = (
                "flagship-ai/cameroon-int8:"
                f"{PAIR_BY_TARGET[request.target]}"
            )
        except Exception as exc:
            if request.target == "ewo":
                raise HTTPException(
                    status_code=503,
                    detail=f"Modèle brouillon ewondo indisponible : {exc}",
                ) from exc
            # Fulfulde : NLLB reste un secours si le modèle flagship échoue.
            for start in range(0, len(texts), BATCH_SIZE):
                batch = texts[start : start + BATCH_SIZE]
                outputs.extend(
                    safe_generate_batch(batch, source_lang, target_lang)
                )
            provider = "nllb"
            model_used = MODEL_NAME
    else:
        for start in range(0, len(texts), BATCH_SIZE):
            batch = texts[start : start + BATCH_SIZE]
            outputs.extend(
                safe_generate_batch(batch, source_lang, target_lang)
            )
        provider = "nllb"
        model_used = MODEL_NAME

    grouped: dict[str, List[str]] = {}
    for item, output in zip(expanded, outputs):
        grouped.setdefault(item["original_id"], []).append(output)

    drafts = []
    for segment in request.segments:
        if segment.critical:
            drafts.append(
                {
                    "segment": segment,
                    "text": segment.text,
                    "ok": False,
                    "reason": "critical_pack_only",
                    "roundtrip": None,
                }
            )
            continue
        parts = grouped.get(segment.id, [])
        joined = " ".join(part.strip() for part in parts if part.strip())
        normalized = repair_plain_tokens(
            protected_by_id.get(segment.id, {}).get("source", segment.text),
            joined,
        )
        protected = protected_by_id.get(
            segment.id, {"source": segment.text, "terms": []}
        )
        ok, reason = validate(protected["source"], normalized)
        restored = restore_terms(normalized, protected["terms"])
        if restored is None:
            ok = False
            reason = "token_lost:TERM"
        final_text = restored if restored is not None else normalized
        drafts.append(
            {
                "segment": segment,
                "text": final_text,
                "ok": ok,
                "reason": reason,
                "roundtrip": None,
            }
        )

    # Rétro-traduction : garde-fou contre les hallucinations sur contenu inédit.
    # Désactivable avec NK_ROUNDTRIP=0 si la latence CPU est trop élevée.
    if ROUNDTRIP_ENABLED and not MOCK_MODE and provider == "nllb":
        candidates = [
            draft
            for draft in drafts
            if draft["ok"]
            and len(draft["segment"].text) <= ROUNDTRIP_MAX_CHARS
        ]
        if candidates:
            try:
                texts = [draft["text"] for draft in candidates]
                backs: List[str] = []
                for start in range(0, len(texts), BATCH_SIZE):
                    backs.extend(
                        safe_generate_batch(
                            texts[start : start + BATCH_SIZE],
                            "fuv_Latn",
                            "fra_Latn",
                        )
                    )
                for draft, back in zip(candidates, backs):
                    score = roundtrip_similarity(
                        draft["segment"].text, back
                    )
                    draft["roundtrip"] = round(score, 3)
                    if score < ROUNDTRIP_MIN_SIMILARITY:
                        draft["ok"] = False
                        draft["reason"] = f"low_roundtrip:{score:.2f}"
            except Exception:
                # La rétro-traduction est un filtre de qualité, pas une
                # dépendance dure : on conserve la traduction validée.
                pass

    translations = [
        Translation(
            id=draft["segment"].id,
            text=draft["text"],
            ok=draft["ok"],
            reason=draft["reason"],
            roundtrip=draft["roundtrip"],
        )
        for draft in drafts
    ]

    return TranslateResponse(
        translations=translations,
        model=model_used,
        provider=provider,
        target=request.target,
    )


if __name__ == "__main__":
    import uvicorn

    # Écoute locale uniquement : le texte ne quitte pas la machine.
    uvicorn.run(app, host="127.0.0.1", port=8000)
