"""
NkapLingua — backend local de traduction.

Modèle : facebook/nllb-200-distilled-600M (CC BY-NC 4.0).
Langue cible : fulfulde (NLLB utilise le code "fuv_Latn", fulfulde nigérian,
très proche du fulfulde adamawa parlé au Cameroun).

Le backend écoute uniquement sur 127.0.0.1 et ne journalise pas le texte.

Lancement :
    pip install -r requirements.txt
    NK_DEVICE=cpu uvicorn app:app --host 127.0.0.1 --port 8000

Mode maquette (sans modèle, pour tester l'extension) :
    NK_MOCK=1 uvicorn app:app --host 127.0.0.1 --port 8000

Langues cibles :
  - fub : traduction automatique NLLB-200 (fuv_Latn) ;
  - ybb, byv, ewo, dua, bas, bbj : packs communautaires gérés par
    l'extension (le backend ne produit pas de traduction automatique pour
    ces langues, faute de modèle validé).

Note licence : NLLB est CC BY-NC 4.0, donc autorisé pour ce hackathon
non commercial. Pour une exploitation commerciale, il faudra un accord ou
un autre modèle.
"""

from __future__ import annotations

import os
import re
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

MODEL_NAME = os.getenv("NK_MODEL", "facebook/nllb-200-distilled-600M")
MAX_INPUT_TOKENS = int(os.getenv("NK_MAX_INPUT_TOKENS", "256"))
MAX_NEW_TOKENS = int(os.getenv("NK_MAX_NEW_TOKENS", "96"))
BATCH_SIZE = int(os.getenv("NK_BATCH_SIZE", "8"))
NUM_BEAMS = int(os.getenv("NK_NUM_BEAMS", "1"))
REPETITION_PENALTY = float(os.getenv("NK_REPETITION_PENALTY", "1.2"))
NO_REPEAT_NGRAM = int(os.getenv("NK_NO_REPEAT_NGRAM", "4"))
DEVICE_PREFERENCE = os.getenv("NK_DEVICE", "auto").lower()
MOCK_MODE = os.getenv("NK_MOCK", "0") == "1"

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
    "ybb": "Yemba",
    "byv": "Medumba",
    "ewo": "Ewondo",
    "dua": "Douala",
    "bas": "Bassa",
    "bbj": "Ghomala'",
}

LANGUAGE_REGISTRY = [
    {
        "code": "fub",
        "label": "Fulfulde (Adamawa)",
        "engine": "mt",
        "model_code": "fuv_Latn",
        "status": "mt-baseline",
        "license": "NLLB-200: CC BY-NC 4.0 (non commercial)",
    },
    {
        "code": "ybb",
        "label": "Yemba",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
    },
    {
        "code": "byv",
        "label": "Medumba",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
    },
    {
        "code": "ewo",
        "label": "Ewondo",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
    },
    {
        "code": "dua",
        "label": "Douala",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
    },
    {
        "code": "bas",
        "label": "Bassa",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
    },
    {
        "code": "bbj",
        "label": "Ghomala'",
        "engine": "pack",
        "status": "community-pack",
        "license": "pack communautaire, validation native requise",
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
    r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]",
    re.IGNORECASE,
)
NORMALIZED_TOKEN_RE = re.compile(
    r"\[\s*\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\s*\]",
    re.IGNORECASE,
)


class Segment(BaseModel):
    id: str
    text: str
    context: str = ""


class TranslateRequest(BaseModel):
    segments: List[Segment] = Field(default_factory=list)
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


class TranslateResponse(BaseModel):
    translations: List[Translation]
    model: str
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
        MODEL_NAME, torch_dtype=dtype
    )
    model.to(device)
    model.eval()
    return tokenizer, model, device


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


def validate(source: str, translation: str) -> tuple[bool, Optional[str]]:
    if not translation.strip():
        return False, "empty_translation"

    # 1) Tous les jetons de données sensibles doivent être présents une fois.
    source_tokens = tokens_of(source)
    normalized = normalize_placeholders(translation)
    for token in source_tokens:
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

    return True, None


def split_sentences(text: str, max_chars: int = 260) -> List[str]:
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


def generate_batch(
    texts: List[str], source_lang: str, target_lang: str
) -> List[str]:
    tokenizer, model, device = load_model()

    if MOCK_MODE:
        return [f"[fulfulde] {text}" for text in texts]

    import torch

    if tokenizer is None or model is None:
        raise RuntimeError("Modèle non chargé.")

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
            early_stopping=True,
        )

    return tokenizer.batch_decode(generated, skip_special_tokens=True)


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
            translations=[], model=MODEL_NAME, target=request.target
        )

    if request.target in PACK_TARGETS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"La langue {PACK_TARGETS[request.target]} fonctionne en mode "
                "pack communautaire dans l'extension ; le backend NLLB ne "
                "produit pas de traduction automatique validée pour cette langue."
            ),
        )

    target_lang = TARGET_ALIASES.get(request.target)
    if not target_lang:
        raise HTTPException(
            status_code=400,
            detail=f"Langue cible non supportée par ce prototype : {request.target}",
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

    # On découpe chaque segment en phrases : NLLB est plus stable sur des
    # entrées courtes, et on évite les répétitions sur les paragraphes longs.
    expanded = []
    for segment in request.segments:
        parts = split_sentences(segment.text)
        if not parts:
            parts = [segment.text]
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
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        outputs.extend(
            safe_generate_batch(batch, source_lang, target_lang)
        )

    grouped: dict[str, List[str]] = {}
    for item, output in zip(expanded, outputs):
        grouped.setdefault(item["original_id"], []).append(output)

    translations: List[Translation] = []
    for segment in request.segments:
        parts = grouped.get(segment.id, [])
        joined = " ".join(part.strip() for part in parts if part.strip())
        normalized = normalize_placeholders(joined)
        ok, reason = validate(segment.text, normalized)
        translations.append(
            Translation(
                id=segment.id,
                text=normalized,
                ok=ok,
                reason=reason,
            )
        )

    return TranslateResponse(
        translations=translations,
        model=MODEL_NAME,
        target=request.target,
    )


if __name__ == "__main__":
    import uvicorn

    # Écoute locale uniquement : le texte ne quitte pas la machine.
    uvicorn.run(app, host="127.0.0.1", port=8000)
