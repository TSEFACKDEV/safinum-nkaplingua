#!/usr/bin/env python3
"""Transforme les classeurs natifs en packs utilisables, sans mensonge.

Politique :

- on ne marque **jamais** une ligne `validated` sans deux traductions
  indépendantes et un arbitre distinct ;
- T1 est la base ; T2 ne sert que si T1 est mécaniquement inutilisable
  (copie du français, fuite d'anglais, jeton perdu…) ;
- une ligne dont la seule traduction est une copie du français est rejetée ;
- une ligne T1 sans T2 indépendant est importée comme `draft` ;
- une ligne sauvée par T2 est importée comme `reviewed` ;
- les phrases du site officiel (SO-xxx) sont ajoutées au pack pour que la
  démonstration SAFINUM n'ait plus besoin de MT.

Usage :
    python3 scripts/build-reviewed-packs.py            # simulation
    python3 scripts/build-reviewed-packs.py --write    # écrit les fichiers
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import re
import subprocess
import sys
import unicodedata
from collections import Counter, OrderedDict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
PACK_CSV = ROOT / "data" / "language-packs"
MESSAGES = ROOT / "data" / "site-officiel" / "messages.fr-en.csv"
MESSAGES_EXTRA = ROOT / "data" / "site-officiel" / "messages-extra.csv"
GLOSSARY = ROOT / "data" / "glossary.template.csv"
IMPORT_DIR = PACK_CSV / "import"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
# Collisions sémantiques tranchées à la main : on préfère retirer une entrée
# ambiguë plutôt que d'afficher un contresens. Ces décisions restent des
# brouillons, pas des validations natives.
FORCE_REJECT = {
    ("ewo", "G25"): (
        "collision avec « remboursement » : adzúmbí moní ne peut pas "
        "signifier à la fois remboursement et découvert"
    ),
}

spec = importlib.util.spec_from_file_location(
    "native_audit", ROOT / "scripts" / "audit-native-reviews.py"
)
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


@dataclass
class Candidate:
    target: str
    origin: str
    origin_item_id: str
    reviewer: str
    reviewed_at: str
    license: str
    issues: list[str]
    score: float
    source_item_id: str = ""


@dataclass
class ItemResult:
    code: str
    item_id: str
    item_type: str
    priority: str
    source_fr: str
    selected: Candidate | None
    candidates: list[Candidate] = field(default_factory=list)
    rejection: str = ""
    corrections: list[str] = field(default_factory=list)


def read_csv(path: Path) -> list[dict]:
    return audit.read_csv(path)


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle, fieldnames=fields, lineterminator="\n"
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})
    temporary.replace(path)


def score_candidate(
    origin: str, target: str, issues: list[str], code: str
) -> float:
    if any(issue in audit.HARD_ISSUES for issue in issues):
        return -1000.0 - sum(
            1 for issue in issues if issue in audit.HARD_ISSUES
        )
    score = 100.0
    if "too_short" in issues:
        score -= 15
    if "no_lang_char" in issues:
        score -= 4
    if origin == "crosswalk":
        score += 6
    elif origin == "t1":
        score += 4
    elif origin == "t2":
        score += 2
    if target.strip():
        score += 1
    if any(char in audit.LANG_CHARS.get(code, set()) for char in target):
        score += 1
    score -= min(len(target), 240) / 1000
    return score


def split_variants(target: str) -> list[str]:
    return audit.split_alternatives(target)


def evaluate_target(
    source: str,
    target: str,
    code: str,
    origin: str,
    row: dict,
    source_item_id: str = "",
) -> Candidate:
    issues = audit.check_target(source, target, code)
    return Candidate(
        target=target,
        origin=origin,
        origin_item_id=row.get("item_id", ""),
        reviewer=(row.get("reviewer") or "").strip(),
        reviewed_at=(row.get("reviewed_at") or "").strip(),
        license=(row.get("license") or "").strip(),
        issues=issues,
        score=score_candidate(origin, target, issues, code),
        source_item_id=source_item_id,
    )


def pick_best(candidates: list[Candidate]) -> Candidate | None:
    usable = [
        candidate
        for candidate in candidates
        if not any(
            issue in audit.HARD_ISSUES for issue in candidate.issues
        )
    ]
    if not usable:
        return None
    return sorted(usable, key=lambda candidate: -candidate.score)[0]


def correct_target(source: str, target: str, code: str) -> tuple[str, list[str]]:
    corrections: list[str] = []
    value = audit.nfc(target)
    value = re.sub(r"\s+", " ", value).strip()

    if code == "fub":
        if re.search(r"\bfgol\b", value, flags=re.I):
            value = re.sub(r"\bfgol\b", "fof", value, flags=re.I)
            corrections.append("fgol→fof")
        if re.search(r"\bNawgoljaawngol\b", value):
            value = re.sub(
                r"\bNawgoljaawngol\b", "Nawgol jaawngol", value
            )
            corrections.append("Nawgoljaawngol→Nawgol jaawngol")
        if re.search(
            r"bénéficiaire|beneficiaire|destinataire",
            source,
            flags=re.I,
        ):
            if re.search(r"\bMo nelaɗo\b", value):
                value = re.sub(r"\bMo nelaɗo\b", "Keɓoowo", value)
                corrections.append("Mo nelaɗo→Keɓoowo")
            if re.search(r"\bmo nelaɗo\b", value):
                value = re.sub(r"\bmo nelaɗo\b", "keɓoowo", value)
                corrections.append("mo nelaɗo→keɓoowo")
        if re.search(r"\bNjoɓdi naange eletrik\b", value, flags=re.I):
            value = re.sub(
                r"\bNjoɓdi naange eletrik\b",
                "Njoɓdi elektrik",
                value,
                flags=re.I,
            )
            corrections.append("Njoɓdi naange eletrik→Njoɓdi elektrik")

    return value, corrections


def load_rows(code: str) -> tuple[list[dict], list[dict]]:
    label = LABELS[code]
    return (
        read_csv(REVIEW / f"{label}.t1.csv"),
        read_csv(REVIEW / f"{label}.t2.csv"),
    )


def evaluate_language(code: str) -> list[ItemResult]:
    t1_rows, t2_rows = load_rows(code)
    t1 = {row["item_id"]: row for row in t1_rows}
    t2 = {row["item_id"]: row for row in t2_rows}
    results: list[ItemResult] = []

    for item_id in sorted(set(t1) | set(t2)):
        left = t1.get(item_id)
        right = t2.get(item_id)
        source = (left or right or {}).get("source_fr", "")
        item_type = (left or right or {}).get("type", "")
        priority = (left or right or {}).get("priorite", "")
        candidates: list[Candidate] = []

        for origin, row in (("t1", left), ("t2", right)):
            if not row:
                continue
            for variant in split_variants(row.get("target", "")):
                if not variant:
                    continue
                candidates.append(
                    evaluate_target(source, variant, code, origin, row)
                )

        selected = pick_best(candidates)
        rejection = ""
        if selected is None:
            rejection = "aucune cible mécaniquement acceptable"
        results.append(
            ItemResult(
                code=code,
                item_id=item_id,
                item_type=item_type,
                priority=priority,
                source_fr=source,
                selected=selected,
                candidates=candidates,
                rejection=rejection,
            )
        )

    # Réutilisation d'une traduction déjà propre pour la même source
    # (frais de transfert, bénéficiaire, confirmer le transfert…).
    by_source: dict[str, list[ItemResult]] = {}
    for result in results:
        if not result.selected:
            continue
        by_source.setdefault(audit.normalize(result.source_fr), []).append(
            result
        )

    for result in results:
        if result.selected:
            continue
        same_source = by_source.get(audit.normalize(result.source_fr), [])
        if not same_source:
            continue
        same_source = [
            candidate
            for candidate in same_source
            if candidate.item_id != result.item_id
        ]
        if not same_source:
            continue
        # Priorité aux messages du site, puis au glossaire.
        same_source.sort(
            key=lambda candidate: (
                0 if candidate.item_type == "message" else 1,
                0 if candidate.item_type == "glossaire" else 1,
                candidate.item_id,
            )
        )
        donor = same_source[0]
        donor_target = donor.selected.target
        issues = audit.check_target(
            result.source_fr, donor_target, code
        )
        candidate = Candidate(
            target=donor_target,
            origin="crosswalk",
            origin_item_id=donor.item_id,
            reviewer=donor.selected.reviewer,
            reviewed_at=donor.selected.reviewed_at,
            license=donor.selected.license,
            issues=issues,
            score=score_candidate("crosswalk", donor_target, issues, code),
            source_item_id=donor.item_id,
        )
        if not any(issue in audit.HARD_ISSUES for issue in issues):
            result.selected = candidate
            result.rejection = ""

    # Rejets sémantiques explicites.
    for result in results:
        reason = FORCE_REJECT.get((code, result.item_id))
        if reason and result.selected:
            result.selected = None
            result.rejection = reason

    # Corrections lexicales explicites, documentées dans le rapport.
    for result in results:
        if not result.selected:
            continue
        corrected, corrections = correct_target(
            result.source_fr, result.selected.target, code
        )
        if corrections:
            result.corrections = corrections
            result.selected.target = corrected
            result.selected.issues = audit.check_target(
                result.source_fr, corrected, code
            )

    return results


def status_for(result: ItemResult) -> str:
    if not result.selected:
        return ""
    if result.selected.origin == "t2":
        return "reviewed"
    return "draft"


def review_level_for(result: ItemResult) -> str:
    if not result.selected:
        return ""
    if result.selected.origin == "crosswalk":
        return "reused-message"
    if result.selected.origin == "t2":
        return "second-translator-fallback"
    return "single-translator"


def other_reviewer(result: ItemResult, code: str) -> str:
    if not result.selected:
        return ""
    t1_rows, t2_rows = load_rows(code)
    reviewers = {
        row["item_id"]: (row.get("reviewer") or "").strip()
        for row in t1_rows + t2_rows
    }
    selected = result.selected.reviewer
    candidates = [
        reviewer
        for item_id, reviewer in reviewers.items()
        if item_id == result.selected.origin_item_id
        and reviewer
        and reviewer != selected
    ]
    if candidates:
        return candidates[0]
    # Repli : l'autre reviewer du même item.
    for row in t1_rows + t2_rows:
        if row["item_id"] == result.item_id:
            reviewer = (row.get("reviewer") or "").strip()
            if reviewer and reviewer != selected:
                return reviewer
    return ""


def update_pack_csv(code: str, results: list[ItemResult]) -> list[dict]:
    path = PACK_CSV / f"{code}.csv"
    rows = read_csv(path)
    fields = list(rows[0].keys())
    for extra in ("review_level", "original_reviewer"):
        if extra not in fields:
            fields.append(extra)

    selected_by_id = {
        result.item_id: result for result in results if result.selected
    }
    prefix = code.upper()
    for index, row in enumerate(rows, start=1):
        item_id = f"{prefix}-{index:03d}"
        result = selected_by_id.get(item_id)
        if not result:
            row["target"] = ""
            row["status"] = "draft"
            row["reviewer"] = ""
            row["reviewed_at"] = ""
            row["license"] = ""
            row["provenance"] = ""
            row["review_level"] = ""
            row["original_reviewer"] = ""
            continue
        if audit.normalize(row.get("source", "")) != audit.normalize(
            result.source_fr
        ):
            raise SystemExit(
                f"{code}: source désynchronisée pour {item_id} : "
                f"{row.get('source')!r} != {result.source_fr!r}"
            )
        row["target"] = result.selected.target
        row["status"] = status_for(result)
        row["reviewer"] = result.selected.reviewer
        row["reviewed_at"] = result.selected.reviewed_at
        row["license"] = result.selected.license
        row["provenance"] = "human"
        row["review_level"] = review_level_for(result)
        row["original_reviewer"] = other_reviewer(result, code)
    write_csv(path, fields, rows)
    return rows


def update_glossary(code: str, results: list[ItemResult]) -> list[dict]:
    rows = read_csv(GLOSSARY)
    fields = list(rows[0].keys())
    selected = {
        result.item_id: result
        for result in results
        if result.selected and result.item_type == "glossaire"
    }
    for index, row in enumerate(rows, start=1):
        item_id = f"G{index:02d}"
        result = selected.get(item_id)
        if result:
            if audit.normalize(row.get("source_fr", "")) != audit.normalize(
                result.source_fr
            ):
                raise SystemExit(
                    f"{code}: glossaire désynchronisé pour {item_id}"
                )
            row[f"target_{code}"] = result.selected.target
            row[f"reviewer_{code}"] = result.selected.reviewer
        else:
            row[f"target_{code}"] = ""
            row[f"reviewer_{code}"] = ""

    for row in rows:
        targets = [
            (row.get(f"target_{lang}") or "").strip()
            for lang in LABELS
        ]
        reviewers = [
            (row.get(f"reviewer_{lang}") or "").strip()
            for lang in LABELS
        ]
        if all(targets) and all(reviewers):
            # On ne marque pas « validated » : l'indépendance TRAPD n'est
            # pas démontrée.
            row["status"] = "en_cours"
        elif any(targets):
            row["status"] = "en_cours"
        else:
            row["status"] = "a_traduire"
    write_csv(GLOSSARY, fields, rows)
    return rows


def update_messages(code: str, results: list[ItemResult]) -> list[dict]:
    rows = read_csv(MESSAGES)
    fields = list(rows[0].keys())
    selected = {
        result.item_id: result
        for result in results
        if result.selected and result.item_type == "message"
    }
    for row in rows:
        result = selected.get(row["id"])
        if result:
            if audit.normalize(row.get("source_fr", "")) != audit.normalize(
                result.source_fr
            ):
                raise SystemExit(
                    f"{code}: message désynchronisé pour {row['id']}"
                )
            row[f"target_{code}"] = result.selected.target
            row[f"statut_{code}"] = "en_cours"
            row[f"reviewer_{code}"] = result.selected.reviewer
            row[f"reviewed_at_{code}"] = result.selected.reviewed_at
            row[f"license_{code}"] = result.selected.license
            row[f"provenance_{code}"] = "human"
        else:
            row[f"target_{code}"] = ""
            row[f"statut_{code}"] = "a_traduire"
            row[f"reviewer_{code}"] = ""
            row[f"reviewed_at_{code}"] = ""
            row[f"license_{code}"] = ""
            row[f"provenance_{code}"] = ""

    for row in rows:
        statuses = [
            (row.get(f"statut_{lang}") or "").strip()
            for lang in LABELS
        ]
        if all(status == "valide" for status in statuses):
            row["statut"] = "valide"
        elif any(status == "valide" for status in statuses):
            row["statut"] = "partiel"
        elif any(status == "en_cours" for status in statuses):
            row["statut"] = "en_cours"
        else:
            row["statut"] = "a_traduire"
    write_csv(MESSAGES, fields, rows)
    return rows


def build_import_csv(
    code: str,
    pack_rows: list[dict],
    message_rows: list[dict],
    results: list[ItemResult],
) -> Path:
    selected = {result.item_id: result for result in results if result.selected}
    entries: OrderedDict[str, dict] = OrderedDict()

    # 1) Glossaire : couvre les libellés courts (Montant, Sécurité, Code PIN…).
    for result in results:
        if not result.selected or result.item_type != "glossaire":
            continue
        entries[audit.normalize(result.source_fr)] = {
            "source": result.source_fr,
            "target": result.selected.target,
            "status": status_for(result),
            "reviewer": result.selected.reviewer,
            "context": "glossaire",
            "reviewed_at": result.selected.reviewed_at,
            "license": result.selected.license,
            "provenance": "human",
            "review_level": review_level_for(result),
            "original_reviewer": other_reviewer(result, code),
        }

    # 2) Phrases du pack : plus spécifiques que le glossaire.
    for row in pack_rows:
        if not (row.get("target") or "").strip():
            continue
        entries[audit.normalize(row["source"])] = {
            "source": row["source"],
            "target": row["target"],
            "status": row.get("status") or "draft",
            "reviewer": row.get("reviewer") or "",
            "context": row.get("context") or "finance",
            "reviewed_at": row.get("reviewed_at") or "",
            "license": row.get("license") or "",
            "provenance": "human",
            "review_level": row.get("review_level") or "single-translator",
            "original_reviewer": row.get("original_reviewer") or "",
        }

    # 3) Messages du site : prioritaires pour le texte exact du site.
    for row in message_rows:
        target = (row.get(f"target_{code}") or "").strip()
        if not target:
            continue
        result = selected.get(row["id"])
        message_entry = {
            "source": row["source_fr"],
            "target": target,
            "status": status_for(result) if result else "draft",
            "reviewer": (row.get(f"reviewer_{code}") or "").strip(),
            "context": "site-officiel",
            "reviewed_at": (row.get(f"reviewed_at_{code}") or "").strip(),
            "license": (row.get(f"license_{code}") or "").strip(),
            "provenance": "human",
            "review_level": review_level_for(result) if result else "",
            "original_reviewer": other_reviewer(result, code) if result else "",
        }
        entries[audit.normalize(row["source_fr"])] = message_entry
        # Mémoire bilingue : la même cible couvre la version anglaise du site.
        source_en = (row.get("source_en") or "").strip()
        if (
            source_en
            and not re.search(r"\d", source_en)
            and audit.normalize(source_en) != audit.normalize(row["source_fr"])
        ):
            entries[audit.normalize(source_en)] = {
                **message_entry,
                "source": source_en,
                "context": "site-officiel-en",
            }

    # 4) Gabarits composés (titre, ligne de compte, variantes de ponctuation).
    if MESSAGES_EXTRA.exists():
        for row in read_csv(MESSAGES_EXTRA):
            target = (row.get(f"target_{code}") or "").strip()
            source = (row.get("source_fr") or "").strip()
            if not source or not target:
                continue
            provenance = (row.get("provenance") or "human").strip().lower()
            source_lang = (row.get("source_lang") or "fr").strip().lower()
            context = (
                "site-officiel-extra-en"
                if source_lang == "en"
                else "site-officiel-extra"
            )
            entries[audit.normalize(source)] = {
                "source": source,
                "target": target,
                "status": "draft",
                "reviewer": (row.get(f"reviewer_{code}") or "").strip(),
                "context": context,
                "reviewed_at": (row.get("reviewed_at") or "").strip(),
                "license": (row.get("license") or "").strip(),
                "provenance": provenance,
                "review_level": (
                    "lexicon-assisted"
                    if provenance == "editorial"
                    else "composed-template"
                ),
                "original_reviewer": "",
            }

    fields = [
        "source",
        "target",
        "status",
        "reviewer",
        "context",
        "reviewed_at",
        "license",
        "provenance",
        "review_level",
        "original_reviewer",
    ]
    path = IMPORT_DIR / f"{code}.csv"
    write_csv(path, fields, list(entries.values()))
    return path


def print_summary(code: str, results: list[ItemResult]) -> dict:
    selected = [result for result in results if result.selected]
    rejected = [result for result in results if not result.selected]
    by_type = Counter(result.item_type for result in selected)
    by_status = Counter(status_for(result) for result in selected)
    by_origin = Counter(result.selected.origin for result in selected)
    corrections = Counter(
        correction
        for result in results
        for correction in result.corrections
    )
    print(f"\n=== {code} ===")
    print(
        f"  {len(results)} lignes · {len(selected)} utilisables · "
        f"{len(rejected)} rejetées"
    )
    print(f"  types : {dict(by_type)}")
    print(f"  statuts : {dict(by_status)}")
    print(f"  origines : {dict(by_origin)}")
    if corrections:
        print(f"  corrections : {dict(corrections)}")
    if rejected:
        print("  rejets (10 premiers) :")
        for result in rejected[:10]:
            reasons = sorted(
                {
                    issue
                    for candidate in result.candidates
                    for issue in candidate.issues
                    if issue in audit.HARD_ISSUES
                }
            )
            print(
                f"    {result.item_id} | {result.source_fr[:55]} | "
                f"{', '.join(reasons) or result.rejection}"
            )
    return {
        "rows": len(results),
        "selected": len(selected),
        "rejected": len(rejected),
        "by_type": dict(by_type),
        "by_status": dict(by_status),
        "by_origin": dict(by_origin),
        "corrections": dict(corrections),
        "rejections": [
            {
                "item_id": result.item_id,
                "source_fr": result.source_fr,
                "reasons": sorted(
                    {
                        issue
                        for candidate in result.candidates
                        for issue in candidate.issues
                        if issue in audit.HARD_ISSUES
                    }
                ),
            }
            for result in rejected
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--no-import", action="store_true")
    args = parser.parse_args()

    all_results: dict[str, list[ItemResult]] = {
        code: evaluate_language(code) for code in LABELS
    }
    summaries = {
        code: print_summary(code, results)
        for code, results in all_results.items()
    }

    if not args.write:
        print(
            "\nSimulation. Relancez avec --write pour mettre à jour les "
            "fichiers canoniques et les packs."
        )
        return 0

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = ROOT / "dist" / "backups" / f"reviewed-packs-{timestamp}"
    backup.mkdir(parents=True, exist_ok=True)
    for path in [
        GLOSSARY,
        MESSAGES,
        *[PACK_CSV / f"{code}.csv" for code in LABELS],
        *[ROOT / "extension" / "language-packs" / f"{code}.json" for code in LABELS],
    ]:
        if path.exists():
            target = backup / path.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(path.read_bytes())

    pack_rows: dict[str, list[dict]] = {}
    for code, results in all_results.items():
        pack_rows[code] = update_pack_csv(code, results)
    for code, results in all_results.items():
        update_glossary(code, results)
        update_messages(code, results)

    # Recharge les messages après les trois langues pour construire les
    # CSV d'import avec les statuts globaux cohérents.
    message_rows = read_csv(MESSAGES)
    import_paths: dict[str, Path] = {}
    for code, results in all_results.items():
        import_paths[code] = build_import_csv(
            code, pack_rows[code], message_rows, results
        )

    if not args.no_import:
        for code, path in import_paths.items():
            output = ROOT / "extension" / "language-packs" / f"{code}.json"
            result = subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "scripts" / "import-language-pack.py"),
                    str(path),
                    "--allow-draft",
                    "--version",
                    "0.7.0",
                    "--output",
                    str(output),
                ],
                cwd=ROOT,
                text=True,
                capture_output=True,
            )
            if result.returncode != 0:
                print(
                    f"Échec de l'import {code} :\n{result.stderr}",
                    file=sys.stderr,
                )
                return result.returncode
            print(result.stdout.strip())

    report = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "policy": {
            "validated": "jamais sans T1/T2 indépendants + arbitre",
            "draft": "T1 seul, ou traduction réutilisée d'un message",
            "reviewed": "T1 rejeté mécaniquement, T2 utilisé",
        },
        "languages": summaries,
    }
    report_path = ROOT / "docs" / "test-results" / "reviewed-packs.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"\nSauvegarde : {backup.relative_to(ROOT)}")
    print(f"Rapport   : {report_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
