#!/usr/bin/env python3
"""Contrôle les données linguistiques de Klein (K2, K5, K6, K7, K11).

Le script ne valide pas la qualité linguistique : il vérifie que les fichiers
sont complets, cohérents, que les jetons et termes critiques sont préservés,
et qu'aucune entrée « validée » ne manque de relecteur, de licence ou de
provenance humaine.
"""

from __future__ import annotations

import csv
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = ("fub", "ewo", "dua")
ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0"}
GLOSSARY_STATUSES = {"a_traduire", "en_cours", "partiel", "validated", "rejete"}
MESSAGE_STATUSES = {"a_traduire", "en_cours", "partiel", "valide", "rejete"}
UNSEEN_VERDICTS = {"acceptable", "trompeur", "faux"}
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ("FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA")


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def numbers(text: str) -> list[str]:
    cleaned = TOKEN_RE.sub(" ", text or "")
    cleaned = re.sub(r"(?<=\d)[\s\u00A0]+(?=\d)", "", cleaned)
    return re.findall(r"\d+(?:[.,]\d+)?", cleaned)


def normalize_license(value: str) -> str:
    cleaned = value.strip().upper().replace("_", "-")
    cleaned = re.sub(r"\s+", "-", cleaned)
    return {
        "CC0": "CC0-1.0",
        "CC0-1": "CC0-1.0",
        "CC-BY": "CC-BY-4.0",
        "CC-BY-4": "CC-BY-4.0",
    }.get(cleaned, value.strip())


def iso_date(value: str) -> bool:
    try:
        date.fromisoformat(value)
        return True
    except (TypeError, ValueError):
        return False


def check_terms(source: str, target: str, label: str) -> list[str]:
    errors: list[str] = []
    for token in tokens(source):
        if target.count(token) != 1:
            errors.append(f"{label}: jeton {token} absent ou dupliqué")
    for term in DNT_TERMS:
        if has_term(source, term) and not has_term(target, term):
            errors.append(f"{label}: terme critique {term} manquant")
    target_flat = re.sub(
        r"(?<=\d)[\s\u00A0]+(?=\d)", "", target
    )
    for number in numbers(source):
        if number not in target_flat:
            errors.append(f"{label}: nombre {number} modifié")
    return errors


def check_glossary() -> tuple[list[str], dict]:
    errors: list[str] = []
    path = ROOT / "data" / "glossary.template.csv"
    rows = read_csv(path)
    if len(rows) != 40:
        errors.append(f"glossaire : {len(rows)} lignes, 40 attendues")
    seen: set[str] = set()
    counts = {lang: 0 for lang in LANGS}
    for index, row in enumerate(rows, start=2):
        source = (row.get("source_fr") or "").strip()
        status = (row.get("status") or "").strip()
        if not source:
            errors.append(f"glossaire#{index}: source_fr vide")
            continue
        if source in seen:
            errors.append(f"glossaire#{index}: terme dupliqué {source!r}")
        seen.add(source)
        if status not in GLOSSARY_STATUSES:
            errors.append(f"glossaire#{index}: statut inconnu {status!r}")
        for lang in LANGS:
            target = (row.get(f"target_{lang}") or "").strip()
            reviewer = (row.get(f"reviewer_{lang}") or "").strip()
            if target:
                errors.extend(
                    check_terms(source, target, f"glossaire#{index}/{lang}")
                )
            if target and not reviewer:
                errors.append(
                    f"glossaire#{index}/{lang}: relecteur manquant"
                )
            if status == "validated" and target and reviewer:
                counts[lang] += 1
        if status == "validated":
            missing = [
                lang
                for lang in LANGS
                if not (row.get(f"target_{lang}") or "").strip()
                or not (row.get(f"reviewer_{lang}") or "").strip()
            ]
            if missing:
                errors.append(
                    f"glossaire#{index}: validation incomplète pour "
                    f"{', '.join(missing)}"
                )
        if status == "partiel":
            if not any(
                (row.get(f"target_{lang}") or "").strip() for lang in LANGS
            ):
                errors.append(
                    f"glossaire#{index}: statut partiel sans aucune cible"
                )
    return errors, counts


def check_messages() -> tuple[list[str], dict]:
    errors: list[str] = []
    path = ROOT / "data" / "site-officiel" / "messages.fr-en.csv"
    rows = read_csv(path)
    if len(rows) != 70:
        errors.append(f"messages : {len(rows)} lignes, 70 attendues")
    levels = {"A": 0, "B": 0}
    seen: set[str] = set()
    counts = {lang: 0 for lang in LANGS}
    for index, row in enumerate(rows, start=2):
        message_id = (row.get("id") or "").strip()
        source_fr = (row.get("source_fr") or "").strip()
        source_en = (row.get("source_en") or "").strip()
        niveau = (row.get("niveau") or "").strip()
        status = (row.get("statut") or "").strip()
        if not message_id or message_id in seen:
            errors.append(f"messages#{index}: id vide ou dupliqué")
        seen.add(message_id)
        if not source_fr or not source_en:
            errors.append(f"messages#{index}: source FR ou EN vide")
        if niveau not in levels:
            errors.append(f"messages#{index}: niveau inconnu {niveau!r}")
        else:
            levels[niveau] += 1
        if status not in MESSAGE_STATUSES:
            errors.append(f"messages#{index}: statut global inconnu {status!r}")

        per_language = {}
        for lang in LANGS:
            target = (row.get(f"target_{lang}") or "").strip()
            lang_status = (row.get(f"statut_{lang}") or "").strip()
            reviewer = (row.get(f"reviewer_{lang}") or "").strip()
            reviewed_at = (row.get(f"reviewed_at_{lang}") or "").strip()
            license_id = normalize_license(
                row.get(f"license_{lang}") or ""
            )
            provenance = (row.get(f"provenance_{lang}") or "").strip().lower()
            per_language[lang] = lang_status

            if lang_status not in MESSAGE_STATUSES:
                errors.append(
                    f"messages#{index}/{lang}: statut inconnu {lang_status!r}"
                )
            if target:
                errors.extend(
                    check_terms(
                        source_fr, target, f"messages#{index}/{lang}"
                    )
                )
                if not reviewer:
                    errors.append(
                        f"messages#{index}/{lang}: relecteur manquant"
                    )
            if lang_status == "valide":
                counts[lang] += 1
                if not target:
                    errors.append(
                        f"messages#{index}/{lang}: cible vide mais valide"
                    )
                if not reviewer:
                    errors.append(
                        f"messages#{index}/{lang}: relecteur manquant"
                    )
                if not iso_date(reviewed_at):
                    errors.append(
                        f"messages#{index}/{lang}: reviewed_at non ISO"
                    )
                if license_id not in ALLOWED_LICENSES:
                    errors.append(
                        f"messages#{index}/{lang}: licence invalide"
                    )
                if provenance != "human":
                    errors.append(
                        f"messages#{index}/{lang}: provenance human attendue"
                    )

        if all(value == "valide" for value in per_language.values()):
            expected = "valide"
        elif any(value == "valide" for value in per_language.values()):
            expected = "partiel"
        else:
            expected = None
        if expected == "valide" and status != "valide":
            errors.append(
                f"messages#{index}: statut global devrait être valide"
            )
        if expected == "partiel" and status not in {"partiel", "en_cours"}:
            errors.append(
                f"messages#{index}: statut global devrait être partiel"
            )

    if levels != {"A": 35, "B": 35}:
        errors.append(
            f"messages : répartition A/B {levels}, attendu 35/35"
        )
    return errors, counts


def check_variants() -> list[str]:
    errors: list[str] = []
    path = ROOT / "data" / "site-officiel" / "messages.variants.csv"
    rows = read_csv(path)
    if len(rows) < 10:
        errors.append(f"variantes : {len(rows)} lignes, 10 attendues")
    ids = {row.get("id") for row in rows}
    message_ids = {
        row.get("id")
        for row in read_csv(
            ROOT / "data" / "site-officiel" / "messages.fr-en.csv"
        )
    }
    for index, row in enumerate(rows, start=2):
        if row.get("id") not in message_ids:
            errors.append(f"variantes#{index}: id inconnu {row.get('id')!r}")
        for field in (
            "source_fr_v1",
            "source_fr_v2",
            "source_fr_v3",
            "source_en_v1",
            "source_en_v2",
            "source_en_v3",
        ):
            if not (row.get(field) or "").strip():
                errors.append(f"variantes#{index}: {field} vide")
    if len(ids) != len(rows):
        errors.append("variantes : ids dupliqués")
    return errors


def check_audio() -> list[str]:
    errors: list[str] = []
    path = ROOT / "data" / "audio" / "fub" / "phrases.csv"
    rows = read_csv(path)
    if len(rows) != 15:
        errors.append(f"audio : {len(rows)} phrases, 15 attendues")
    seen: set[str] = set()
    for index, row in enumerate(rows, start=2):
        audio_id = (row.get("id") or "").strip()
        if not audio_id or audio_id in seen:
            errors.append(f"audio#{index}: id vide ou dupliqué")
        seen.add(audio_id)
        if (row.get("has_amount") or "").strip() != "no":
            errors.append(f"audio#{index}: has_amount doit valoir no")
        if not (row.get("source_fr") or "").strip():
            errors.append(f"audio#{index}: source_fr vide")
    return errors


def check_reference_links() -> list[str]:
    errors: list[str] = []
    path = ROOT / "data" / "reference" / "glossary-links.csv"
    if not path.exists():
        return [f"références : {path.name} manquant"]
    rows = read_csv(path)
    glossary = read_csv(ROOT / "data" / "glossary.template.csv")
    if len(rows) != len(glossary):
        errors.append(
            f"références : {len(rows)} lignes, {len(glossary)} attendues"
        )
    for index, (row, term) in enumerate(zip(rows, glossary), start=1):
        if row.get("item_id") != f"G{index:02d}":
            errors.append(f"références#{index}: item_id incohérent")
        if row.get("source_fr") != term.get("source_fr"):
            errors.append(
                f"références#{index}: source désynchronisée du glossaire"
            )
        if not (row.get("glosbe_query") or "").strip():
            errors.append(f"références#{index}: glosbe_query vide")
        for field in (
            "glosbe_ewo",
            "glosbe_dua",
            "glosbe_fub",
            "webonary_search",
            "resulam_search",
            "silcam_ewo",
            "silcam_dua",
            "silcam_fub",
        ):
            if not (row.get(field) or "").startswith("https://"):
                errors.append(f"références#{index}: {field} invalide")
    return errors


def check_unseen() -> list[str]:
    errors: list[str] = []
    source_path = ROOT / "data" / "unseen_finance.txt"
    lines = [
        line.strip()
        for line in source_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    if len(lines) != 20:
        errors.append(f"unseen : {len(lines)} phrases, 20 attendues")
    path = ROOT / "docs" / "UNSEEN_JUDGMENT.csv"
    rows = read_csv(path)
    if len(rows) != 20:
        errors.append(f"jugement unseen : {len(rows)} lignes, 20 attendues")
    seen: set[str] = set()
    for index, row in enumerate(rows, start=2):
        row_id = (row.get("id") or "").strip()
        if not row_id or row_id in seen:
            errors.append(f"unseen#{index}: id vide ou dupliqué")
        seen.add(row_id)
        source = (row.get("source_fr") or "").strip()
        if index - 2 < len(lines) and source != lines[index - 2]:
            errors.append(
                f"unseen#{index}: source désynchronisée avec unseen_finance.txt"
            )
        candidate_status = (row.get("candidate_status") or "").strip()
        candidate_fub = (row.get("candidate_fub") or "").strip()
        candidate_issue = (row.get("candidate_issue") or "").strip()
        if candidate_status not in {"", "mt_eval", "rejected_auto"}:
            errors.append(
                f"unseen#{index}: candidate_status inconnu "
                f"{candidate_status!r}"
            )
        if candidate_status == "mt_eval" and not candidate_fub:
            errors.append(
                f"unseen#{index}: mt_eval sans candidate_fub"
            )
        if candidate_status == "rejected_auto":
            if candidate_fub:
                errors.append(
                    f"unseen#{index}: rejected_auto avec candidate_fub"
                )
            if not candidate_issue:
                errors.append(
                    f"unseen#{index}: rejected_auto sans candidate_issue"
                )
        for lang in LANGS:
            verdict = (row.get(f"verdict_{lang}") or "").strip()
            if verdict and verdict not in UNSEEN_VERDICTS:
                errors.append(
                    f"unseen#{index}/{lang}: verdict inconnu {verdict!r}"
                )
            if verdict:
                if candidate_status != "mt_eval":
                    errors.append(
                        f"unseen#{index}/{lang}: verdict sans sortie mt_eval"
                    )
                if not (row.get(f"reviewer_{lang}") or "").strip():
                    errors.append(
                        f"unseen#{index}/{lang}: reviewer manquant"
                    )
                if not iso_date(
                    (row.get(f"date_{lang}") or "").strip()
                ):
                    errors.append(
                        f"unseen#{index}/{lang}: date non ISO"
                    )
    return errors



def check_extra_messages() -> tuple[list[str], dict]:
    """Contrôle les gabarits ajoutés au-delà des 70 messages du site."""
    errors: list[str] = []
    path = ROOT / "data" / "site-officiel" / "messages-extra.csv"
    if not path.exists():
        return [f"messages-extra : {path.name} manquant"], {}
    rows = read_csv(path)
    seen: set[str] = set()
    counts = {lang: 0 for lang in LANGS}
    for index, row in enumerate(rows, start=2):
        message_id = (row.get("id") or "").strip()
        source = (row.get("source_fr") or "").strip()
        if not message_id or message_id in seen:
            errors.append(f"messages-extra#{index}: id vide ou dupliqué")
        seen.add(message_id)
        if not source:
            errors.append(f"messages-extra#{index}: source_fr vide")
            continue
        for lang in LANGS:
            target = (row.get(f"target_{lang}") or "").strip()
            reviewer = (row.get(f"reviewer_{lang}") or "").strip()
            if not target:
                continue
            counts[lang] += 1
            errors.extend(
                check_terms(
                    source, target, f"messages-extra#{index}/{lang}"
                )
            )
            if not reviewer:
                errors.append(
                    f"messages-extra#{index}/{lang}: relecteur manquant"
                )
            if normalize_license(row.get("license") or "") not in ALLOWED_LICENSES:
                errors.append(
                    f"messages-extra#{index}/{lang}: licence invalide"
                )
            if not iso_date((row.get("reviewed_at") or "").strip()):
                errors.append(
                    f"messages-extra#{index}/{lang}: date non ISO"
                )
            if (row.get("provenance") or "").strip().lower() not in {
                "human",
                "editorial",
            }:
                errors.append(
                    f"messages-extra#{index}/{lang}: provenance human ou "
                    "editorial attendue"
                )
    return errors, counts

def main() -> int:
    errors: list[str] = []
    glossary_errors, glossary_counts = check_glossary()
    message_errors, message_counts = check_messages()
    errors.extend(glossary_errors)
    errors.extend(message_errors)
    extra_errors, extra_counts = check_extra_messages()
    errors.extend(extra_errors)
    errors.extend(check_variants())
    errors.extend(check_audio())
    errors.extend(check_unseen())
    errors.extend(check_reference_links())

    if errors:
        print("Données linguistiques invalides :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        "Données OK — glossaire 40 termes "
        f"(validés fub/ewo/dua : "
        f"{glossary_counts['fub']}/{glossary_counts['ewo']}/"
        f"{glossary_counts['dua']}) ; "
        f"messages 70 (validés fub/ewo/dua : "
        f"{message_counts['fub']}/{message_counts['ewo']}/"
        f"{message_counts['dua']}) ; "
        f"gabarits site {sum(extra_counts.values())} ; variantes 10 ; "
        "audio 15 ; unseen 20 ; références 40"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
