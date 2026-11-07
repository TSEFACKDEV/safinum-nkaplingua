#!/usr/bin/env python3
"""Importe une fiche d'arbitrage TRAPD remplie vers les fichiers canoniques.

Usage :
    python3 scripts/import-native-reviews.py --lang fub
    python3 scripts/import-native-reviews.py --lang ewo --dry-run

Garde-fous :
- une ligne `valide` exige deux traductions T1/T2, deux relecteurs distincts,
  un arbitre distinct, une date ISO et une licence CC0-1.0 ou CC-BY-4.0 ;
- les jetons et termes critiques sont contrôlés ;
- les items P0 doivent être tranchés (valide ou rejete) sauf --allow-partial ;
- aucune provenance autre que `human` n'est acceptée pour une entrée validée.

Ensuite, les packs JSON sont reconstruits avec scripts/import-language-pack.py.
"""

from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0"}
STATUSES = {"valide", "rejete", ""}
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ("FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA")


def read_csv(path: Path) -> tuple[list[str], list[dict]]:
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=fields, lineterminator="\n"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})


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


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text)
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text, flags=re.I)
    )


def check_text(source: str, target: str, label: str) -> list[str]:
    errors: list[str] = []
    for token in tokens(source):
        if target.count(token) != 1:
            errors.append(f"{label}: jeton {token} absent ou dupliqué")
    for term in DNT_TERMS:
        if has_term(source, term) and not has_term(target, term):
            errors.append(f"{label}: terme critique {term} manquant")
    return errors


def same_person(left: str, right: str) -> bool:
    return left.strip().casefold() == right.strip().casefold()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=sorted(LABELS), required=True)
    parser.add_argument("--arbitrage", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Ne pas exiger que tous les items P0 soient tranchés.",
    )
    args = parser.parse_args()

    label = LABELS[args.lang]
    arbitrage = args.arbitrage or REVIEW / f"{label}.arbitrage.csv"
    if not arbitrage.exists():
        print(f"Fiche d'arbitrage introuvable : {arbitrage}", file=sys.stderr)
        return 1

    _, rows = read_csv(arbitrage)
    errors: list[str] = []
    validated: list[dict] = []
    rejected: list[dict] = []

    for index, row in enumerate(rows, start=2):
        item_id = (row.get("item_id") or "").strip()
        status = (row.get("statut") or "").strip().lower()
        if status not in STATUSES:
            errors.append(f"ligne {index}: statut inconnu {status!r}")
            continue
        if status == "":
            if row.get("priorite") == "P0" and not args.allow_partial:
                errors.append(
                    f"ligne {index}: item P0 non tranché ({item_id})"
                )
            continue

        if status == "rejete":
            rejected.append(row)
            continue

        target = (row.get("decision") or "").strip()
        source = (row.get("source_fr") or "").strip()
        target_t1 = (row.get("target_t1") or "").strip()
        target_t2 = (row.get("target_t2") or "").strip()
        reviewer_t1 = (row.get("reviewer_t1") or "").strip()
        reviewer_t2 = (row.get("reviewer_t2") or "").strip()
        arbiter = (row.get("arbitre") or "").strip()
        reviewed_at = (row.get("date") or "").strip()
        license_id = normalize_license(row.get("license") or "")
        license_t1 = normalize_license(row.get("license_t1") or "")
        license_t2 = normalize_license(row.get("license_t2") or "")

        if not target:
            errors.append(f"ligne {index}: décision vide ({item_id})")
        if not target_t1 or not target_t2:
            errors.append(
                f"ligne {index}: deux traductions T1 et T2 sont requises "
                f"({item_id})"
            )
        if not reviewer_t1 or not reviewer_t2:
            errors.append(
                f"ligne {index}: reviewers T1 et T2 requis ({item_id})"
            )
        elif same_person(reviewer_t1, reviewer_t2):
            errors.append(
                f"ligne {index}: T1 et T2 doivent être deux personnes "
                f"distinctes ({item_id})"
            )
        if not arbiter:
            errors.append(f"ligne {index}: arbitre requis ({item_id})")
        elif same_person(arbiter, reviewer_t1) or same_person(
            arbiter, reviewer_t2
        ):
            errors.append(
                f"ligne {index}: l'arbitre doit être distinct de T1 et T2 "
                f"({item_id})"
            )
        if not iso_date(reviewed_at):
            errors.append(f"ligne {index}: date ISO requise ({item_id})")
        if license_id not in ALLOWED_LICENSES:
            errors.append(
                f"ligne {index}: licence finale invalide ({item_id})"
            )
        for reviewer_license, role in (
            (license_t1, "T1"),
            (license_t2, "T2"),
        ):
            if reviewer_license not in ALLOWED_LICENSES:
                errors.append(
                    f"ligne {index}: licence {role} invalide ({item_id})"
                )
        if target:
            errors.extend(
                check_text(source, target, f"ligne {index}/{item_id}")
            )
        validated.append(row)

    if errors:
        print("Import refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2

    if not validated and not rejected:
        print("Aucune ligne tranchée : rien à importer.")
        return 0

    # --- Mise à jour du glossaire -------------------------------------
    glossary_path = ROOT / "data" / "glossary.template.csv"
    glossary_fields, glossary_rows = read_csv(glossary_path)
    glossary_updates = 0
    for row in validated:
        item_id = (row.get("item_id") or "").strip()
        match = re.fullmatch(r"G(\d+)", item_id)
        if row.get("type") != "glossaire" or not match:
            continue
        position = int(match.group(1)) - 1
        if not 0 <= position < len(glossary_rows):
            errors.append(f"{item_id}: position hors glossaire")
            continue
        canonical = glossary_rows[position]
        if canonical["source_fr"] != row["source_fr"]:
            errors.append(f"{item_id}: source désynchronisée")
            continue
        canonical[f"target_{args.lang}"] = row["decision"].strip()
        canonical[f"reviewer_{args.lang}"] = row["arbitre"].strip()
        glossary_updates += 1

    for row in glossary_rows:
        targets = [
            (row.get(f"target_{lang}") or "").strip() for lang in LABELS
        ]
        reviewers = [
            (row.get(f"reviewer_{lang}") or "").strip() for lang in LABELS
        ]
        if all(targets) and all(reviewers):
            row["status"] = "validated"
        elif any(targets):
            row["status"] = "partiel"
        else:
            row["status"] = "a_traduire"

    # --- Mise à jour des messages du site -----------------------------
    messages_path = ROOT / "data" / "site-officiel" / "messages.fr-en.csv"
    message_fields, message_rows = read_csv(messages_path)
    messages_by_id = {row["id"]: row for row in message_rows}
    message_updates = 0
    for row in validated:
        item_id = (row.get("item_id") or "").strip()
        if row.get("type") != "message":
            continue
        canonical = messages_by_id.get(item_id)
        if canonical is None:
            errors.append(f"{item_id}: message inconnu")
            continue
        if canonical["source_fr"] != row["source_fr"]:
            errors.append(f"{item_id}: source désynchronisée")
            continue
        canonical[f"target_{args.lang}"] = row["decision"].strip()
        canonical[f"statut_{args.lang}"] = "valide"
        canonical[f"reviewer_{args.lang}"] = row["arbitre"].strip()
        canonical[f"reviewed_at_{args.lang}"] = row["date"].strip()
        canonical[f"license_{args.lang}"] = normalize_license(
            row["license"]
        )
        canonical[f"provenance_{args.lang}"] = "human"
        message_updates += 1

    for row in message_rows:
        statuses = [
            (row.get(f"statut_{lang}") or "").strip() for lang in LABELS
        ]
        if all(status == "valide" for status in statuses):
            row["statut"] = "valide"
        elif any(status == "valide" for status in statuses):
            row["statut"] = "partiel"
        elif any(status == "en_cours" for status in statuses):
            row["statut"] = "en_cours"
        else:
            row["statut"] = "a_traduire"

    # --- Mise à jour du pack de phrases -------------------------------
    pack_path = ROOT / "data" / "language-packs" / f"{args.lang}.csv"
    pack_fields, pack_rows = read_csv(pack_path)
    pack_updates = 0
    prefix = args.lang.upper()
    for row in validated:
        item_id = (row.get("item_id") or "").strip()
        match = re.fullmatch(rf"{prefix}-(\d+)", item_id)
        if row.get("type") != "phrase" or not match:
            continue
        position = int(match.group(1)) - 1
        if not 0 <= position < len(pack_rows):
            errors.append(f"{item_id}: position hors pack")
            continue
        canonical = pack_rows[position]
        if canonical["source"] != row["source_fr"]:
            errors.append(f"{item_id}: source désynchronisée")
            continue
        canonical["target"] = row["decision"].strip()
        canonical["status"] = "validated"
        canonical["reviewer"] = row["arbitre"].strip()
        canonical["reviewed_at"] = row["date"].strip()
        canonical["license"] = normalize_license(row["license"])
        canonical["provenance"] = "human"
        pack_updates += 1

    if errors:
        print("Import refusé :", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 2

    rejections_path = REVIEW / f"rejections.{label}.csv"
    if rejected:
        rejection_fields = [
            "item_id",
            "type",
            "source_fr",
            "target_t1",
            "target_t2",
            "commentaire_t1",
            "commentaire_t2",
            "arbitre",
            "date",
        ]
        write_csv(
            rejections_path,
            rejection_fields,
            [
                {
                    "item_id": row.get("item_id", ""),
                    "type": row.get("type", ""),
                    "source_fr": row.get("source_fr", ""),
                    "target_t1": row.get("target_t1", ""),
                    "target_t2": row.get("target_t2", ""),
                    "commentaire_t1": row.get("commentaire_t1", ""),
                    "commentaire_t2": row.get("commentaire_t2", ""),
                    "arbitre": row.get("arbitre", ""),
                    "date": row.get("date", ""),
                }
                for row in rejected
            ],
        )

    if args.dry_run:
        print(
            "Mode dry-run : "
            f"glossaire {glossary_updates}, messages {message_updates}, "
            f"phrases {pack_updates}, rejets {len(rejected)}."
        )
        return 0

    write_csv(glossary_path, glossary_fields, glossary_rows)
    write_csv(messages_path, message_fields, message_rows)
    write_csv(pack_path, pack_fields, pack_rows)

    result = subprocess.run(
        [
            sys.executable,
            str(ROOT / "scripts" / "import-language-pack.py"),
            str(ROOT / "data" / "language-packs" / f"{args.lang}.csv"),
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        print(
            f"Échec de l'import du pack {args.lang} :\n{result.stderr}",
            file=sys.stderr,
        )
        return 3
    print(result.stdout.strip())

    print(
        f"{label} : glossaire {glossary_updates}, messages "
        f"{message_updates}, phrases {pack_updates}, rejets {len(rejected)}."
    )
    if rejected:
        print(f"Rejets consignés : {rejections_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
