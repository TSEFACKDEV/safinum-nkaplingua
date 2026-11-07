"""Tests rapides du backend, sans télécharger le modèle.

Le CI et le mode maquette utilisent NK_MOCK=1 : le pipeline complet
(validation, découpage, routes) est testé, mais la traduction est simulée.
"""

import os
import sys

os.environ.setdefault("NK_MOCK", "1")
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient  # noqa: E402

import app as app_module  # noqa: E402
from app import (  # noqa: E402
    app,
    detect_language,
    protect_terms,
    quality_check,
    restore_terms,
    roundtrip_similarity,
    split_sentences,
    validate,
)

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["mock"] is True
    assert data["loaded"] is True


def test_languages():
    response = client.get("/languages")
    assert response.status_code == 200
    data = response.json()
    codes = [item["code"] for item in data["targets"]]
    assert "fub" in codes
    assert "ybb" in codes
    assert "byv" in codes
    assert len(codes) == 7
    assert data["target"][0]["model_code"] == "fuv_Latn"


def test_detect_french_and_english():
    french = detect_language("Le solde de votre compte est disponible.")
    assert french["code"] == "fr"
    assert french["confidence"] > 0

    english = detect_language("The balance of your account is available.")
    assert english["code"] == "en"
    assert english["confidence"] > 0


def test_detect_endpoint_uses_hint_for_short_text():
    response = client.post(
        "/detect",
        json={"text": "Solde", "hint": "en-US"},
    )
    assert response.status_code == 200
    assert response.json()["code"] == "en"


def test_demo_page():
    response = client.get("/demo")
    assert response.status_code == 200
    assert "FINAKA" in response.text


def test_translate_preserves_placeholders():
    response = client.post(
        "/translate",
        json={
            "target": "fub",
            "segments": [
                {
                    "id": "s1",
                    "text": "Le solde est de [[NUM_0]] FCFA. Les frais sont de [[NUM_1]] FCFA.",
                    "context": "mobile money",
                }
            ],
        },
    )
    assert response.status_code == 200
    translation = response.json()["translations"][0]
    assert translation["ok"] is True
    assert "[[NUM_0]]" in translation["text"]
    assert "[[NUM_1]]" in translation["text"]
    assert "FCFA" in translation["text"]


def test_protect_and_restore_dnt_terms():
    protected, terms = protect_terms(
        "Le solde est de 125 000 FCFA. Ne partagez jamais votre code PIN."
    )
    assert "[[0]]" in protected
    assert "[[1]]" in protected
    assert "FCFA" not in protected
    restored = restore_terms(protected, terms)
    assert restored == "Le solde est de 125 000 FCFA. Ne partagez jamais votre code PIN."


def test_glossary_term_is_protected_and_restored():
    protected, terms = protect_terms(
        "Les frais de transfert sont de 1 000 FCFA.",
        glossary=(("frais de transfert", "Njoɓdi jolngo"),),
    )
    assert "[[0]]" in protected
    assert "frais de transfert" not in protected
    restored = restore_terms(protected, terms)
    assert "Njoɓdi jolngo" in restored
    assert "FCFA" in restored
    assert "1 000" in restored


def test_translate_uses_validated_glossary(monkeypatch):
    monkeypatch.setattr(
        app_module,
        "load_glossary",
        lambda: (("frais de transfert", "Njoɓdi jolngo"),),
    )
    response = client.post(
        "/translate",
        json={
            "target": "fub",
            "segments": [
                {
                    "id": "s1",
                    "text": "Les frais de transfert sont de 1 000 FCFA.",
                    "context": "mobile money",
                }
            ],
        },
    )
    assert response.status_code == 200
    translation = response.json()["translations"][0]
    assert translation["ok"] is True
    assert "Njoɓdi jolngo" in translation["text"]
    assert "1 000" in translation["text"]
    assert "FCFA" in translation["text"]


def test_translate_protects_dnt_terms_with_mock():
    response = client.post(
        "/translate",
        json={
            "target": "fub",
            "segments": [
                {
                    "id": "s1",
                    "text": "Ne partagez jamais votre code PIN. Les frais sont de 1 000 FCFA.",
                    "context": "security",
                }
            ],
        },
    )
    assert response.status_code == 200
    translation = response.json()["translations"][0]
    assert translation["ok"] is True
    assert "PIN" in translation["text"]
    assert "FCFA" in translation["text"]
    assert "[[TERM_" not in translation["text"]
    assert "[[0]]" not in translation["text"]


def test_translate_accepts_english_source():
    response = client.post(
        "/translate",
        json={
            "source": "en",
            "target": "fub",
            "segments": [
                {
                    "id": "s1",
                    "text": "The transfer fee is [[NUM_0]] FCFA.",
                    "context": "mobile money",
                }
            ],
        },
    )
    assert response.status_code == 200
    translation = response.json()["translations"][0]
    assert translation["ok"] is True
    assert "[[NUM_0]]" in translation["text"]


def test_translate_rejects_unknown_target():
    response = client.post(
        "/translate",
        json={
            "target": "xyz",
            "segments": [{"id": "s1", "text": "Bonjour", "context": ""}],
        },
    )
    assert response.status_code == 400


def test_translate_rejects_pack_target_in_backend():
    response = client.post(
        "/translate",
        json={
            "target": "dua",
            "segments": [{"id": "s1", "text": "Bonjour", "context": ""}],
        },
    )
    assert response.status_code == 400
    assert "pack communautaire" in response.json()["detail"]


def test_translate_auto_source():
    response = client.post(
        "/translate",
        json={
            "source": "auto",
            "target": "fub",
            "segments": [
                {
                    "id": "s1",
                    "text": "The transfer fee is [[NUM_0]] FCFA.",
                    "context": "mobile money",
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["translations"][0]["ok"] is True


def test_validate_rejects_missing_token():
    ok, reason = validate(
        "Le solde est de [[NUM_0]] FCFA.",
        "Le solde est de 125 000 FCFA.",
    )
    assert ok is False
    assert reason == "token_lost:[[NUM_0]]"


def test_validate_rejects_lost_pin():
    ok, reason = validate(
        "Ne partagez jamais votre code PIN.",
        "Ne partagez jamais votre code secret.",
    )
    assert ok is False
    assert reason == "dnt_missing:PIN"


def test_validate_accepts_name_token():
    ok, reason = validate(
        "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA.",
        "Nafoore [[NAME_0]] ina heɓa [[NUM_0]] FCFA.",
    )
    assert ok is True
    assert reason is None


def test_validate_rejects_modified_name_token():
    ok, reason = validate(
        "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA.",
        "Le bénéficiaire Aïcha reçoit [[NUM_0]] FCFA.",
    )
    assert ok is False
    assert reason == "token_lost:[[NAME_0]]"


def test_quality_rejects_identical_translation():
    ok, reason = quality_check(
        "Le solde est disponible.",
        "Le solde est disponible.",
    )
    assert ok is False
    assert reason == "untranslated"


def test_quality_rejects_repetitive_output():
    ok, reason = quality_check(
        "Le bénéficiaire reçoit le montant net après déduction des frais.",
        "frais frais frais frais frais frais frais frais frais frais",
    )
    assert ok is False
    assert reason in {"repetitive", "too_short"}


def test_quality_rejects_french_leak():
    ok, reason = quality_check(
        "Le bénéficiaire reçoit le montant net après déduction des frais.",
        "Le bénéficiaire reçoit le montant net sur votre compte.",
    )
    assert ok is False
    assert reason == "french_leak"


def test_quality_accepts_plausible_translation():
    ok, reason = quality_check(
        "Le solde est de 125 000 FCFA.",
        "Fedde jaɓande nden ko [[NUM_0]] FCFA.",
    )
    assert ok is True
    assert reason is None


def test_roundtrip_similarity():
    score = roundtrip_similarity(
        "Le solde est de 125 000 FCFA.",
        "Le solde est de 125 000 FCFA.",
    )
    assert score == 1.0
    low = roundtrip_similarity(
        "Le solde est de 125 000 FCFA.",
        "Bonjour, comment allez-vous ?",
    )
    assert low < 0.5


def test_split_sentences_keeps_finance_parts():
    parts = split_sentences(
        "Le solde est de 125 000 FCFA. Les frais sont de 1 000 FCFA."
    )
    assert len(parts) == 2
    assert parts[0].startswith("Le solde")
    assert parts[1].startswith("Les frais")
