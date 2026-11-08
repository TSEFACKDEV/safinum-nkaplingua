#!/usr/bin/env python3
"""Audite les classeurs natifs T1/T2 avant tout import.

Le script ne juge pas la beauté littéraire : il détecte les signaux objectifs
qui interdisent d'utiliser une ligne comme traduction humaine :

- préfixe de machine (« Tafsiri: », « Traduction: », « Translation: »…) ;
- copie pure et simple du français, ou copie tronquée ;
- fuite de français ou d'anglais dans la cible ;
- jeton [[NUM_n]] / [[NAME_n]] perdu ou dupliqué ;
- terme critique FCFA/PIN/OTP/KYC/FINAKA perdu ;
- cible vide.

Il mesure aussi l'indépendance de T1 et T2. Un T2 identique à T1 à 99 %
n'est pas un second traducteur : c'est une copie, et TRAPD ne peut pas
valider la ligne.

Usage :
    python3 scripts/audit-native-reviews.py
    python3 scripts/audit-native-reviews.py --strict
    python3 scripts/audit-native-reviews.py --json-out /tmp/audit.json
"""

from __future__ import annotations

import argparse
import csv
import difflib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "data" / "review"
LABELS = {"fub": "fulfulde", "ewo": "ewondo", "dua": "duala"}
DEFAULT_JSON = ROOT / "docs" / "test-results" / "native-review-audit.json"
DEFAULT_CSV = ROOT / "docs" / "test-results" / "native-review-audit.csv"

PREFIX_RE = re.compile(
    r"^\s*(tafsiri|traduction|translation|traducci[oó]n|"
    r"[uü]bersetzung|traduzione|tradu[cç][aã]o)\s*[:\-–—]\s*",
    re.I,
)
TOKEN_RE = re.compile(r"\[\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\]", re.I)
DNT_TERMS = ("FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA")

# Termes qui peuvent rester tels quels : sigles, marques, noms propres.
TECH_ALLOW = {
    "code",
    "code pin",
    "code de confirmation",
    "code confirmation",
    "mobile money",
    "safinum",
    "safinum pay",
    "finaka",
    "fcfa",
    "xaf",
    "pin",
    "otp",
    "kyc",
    "live",
    "sms",
    "fr → ff",
    "fr -> ff",
    "amina ngo bell",
    "aïcha",
    "aicha",
    "mtn",
    "momo",
    "orange money",
    "wave",
    "visa",
    "mastercard",
    "whatsapp",
    "iban",
    "swift",
}

# Mots grammaticaux français : leur présence répétée trahit une phrase non
# traduite. On ne met pas les noms métier ici (banque, facture, téléphone…)
# car ce sont des emprunts fréquents dans les trois langues.
FRENCH_STOP = {
    "le", "la", "les", "un", "une", "des", "du", "de", "dans", "sur",
    "pour", "avec", "sans", "est", "sont", "votre", "vos", "vous", "nous",
    "ce", "cette", "ces", "qui", "que", "au", "aux", "par", "plus", "ne",
    "pas", "jamais", "il", "elle", "ils", "elles", "je", "tu", "mon", "ma",
    "mes", "son", "sa", "ses", "notre", "nos", "leur", "leurs", "à", "en",
    "y",
}

# Noms/verbes français fréquents dans une interface finance. Un seul de ces
# mots peut être un emprunt acceptable ; deux ou plus dans une phrase sont
# un signal fort de non-traduction.
FRENCH_CONTENT = {
    "erreur", "réseau", "reseau", "service", "client", "temporairement",
    "indisponible", "réessayez", "reessayez", "facture", "électricité",
    "electricite", "référence", "reference", "statut", "découvert",
    "decouvert", "agence", "guichet", "confirmation", "sécurité",
    "securite", "montant", "frais", "solde", "transfert", "compte",
    "bénéficiaire", "beneficiaire", "destinataire", "opération", "operation",
    "succès", "succes", "message", "important", "environnement",
    "démonstration", "demonstration", "données", "donnees", "fictives",
    "aucune", "transaction", "réelle", "reelle", "conditions", "crédit",
    "credit", "taux", "mensuel", "dossier", "délai", "delai", "pénalité",
    "penalite", "retard", "épargne", "epargne", "objectif", "remboursement",
    "échéance", "echeance", "litige", "échec", "echec", "annulation",
    "solde", "disponible", "total", "débité", "debite", "envoyé", "envoye",
    "reçu", "recu", "modifier", "valider", "confirmer", "enregistrer",
    "continuer", "transférer", "transferer", "payer", "envoyer", "recevoir",
    "vérifier", "verifier", "renseigner", "choisir", "consulter",
    "effectuer", "préparer", "preparer",
}

# Verbes français à l'infinitif : peu probables comme emprunts dans une
# interface entièrement traduite.
FRENCH_VERBS = {
    "modifier", "valider", "confirmer", "enregistrer", "continuer",
    "transférer", "transferer", "payer", "envoyer", "recevoir", "vérifier",
    "verifier", "renseigner", "choisir", "consulter", "effectuer",
    "préparer", "preparer", "remplacer", "fermer", "retourner",
}

# Mots anglais qui ne sont pas des marques ni des sigles.
ENGLISH_LEAK = {
    "amount", "security", "summary", "transfer", "balance", "fees", "fee",
    "confirmation", "new", "view", "make", "name", "account", "current",
    "recent", "payment", "salary", "electricity", "bill", "success",
    "status", "reference", "phone", "operation", "modify", "continue",
    "back", "confirm", "send", "received", "merchant", "available",
    "total", "net", "automatic", "automatically", "service", "client",
    "bank", "validate", "enter", "choose", "review", "summary",
}

LANG_CHARS = {
    "fub": set("ɓɗŋƴ"),
    "ewo": set("ɔɛəŋɓ"),
    "dua": set("ɔɛəŋɓ"),
}

HARD_ISSUES = {
    "empty",
    "mt_prefix",
    "source_copy_truncated",
    "source_copy",
    "french_leak",
    "english_leak",
    "french_verb",
    "missing_token",
    "dnt_missing",
}


def read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text or "")


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", nfc(text).strip()).casefold()


def words(text: str) -> list[str]:
    return re.findall(
        r"[A-Za-zÀ-ÖØ-öø-ÿɓɗŋƴɔɛə']+", nfc(text).lower()
    )


def tokens(text: str) -> list[str]:
    return [
        f"[[{match.group(1).upper()}_{match.group(2)}]]"
        for match in TOKEN_RE.finditer(text or "")
    ]


def has_term(text: str, term: str) -> bool:
    return bool(
        re.search(rf"(?<!\w){re.escape(term)}(?!\w)", text or "", flags=re.I)
    )


def strip_prefix(text: str) -> str:
    return PREFIX_RE.sub("", text or "").strip()


def is_technical(source: str, target: str) -> bool:
    """True si la cible peut légitimement rester identique à la source."""
    normalized_source = normalize(source)
    normalized_target = normalize(target)

    if normalized_source in TECH_ALLOW or normalized_target in TECH_ALLOW:
        return True

    # Chaîne sans lettres après retrait des jetons, des sigles et de la
    # ponctuation (« [[NUM_0]] FCFA », « -[[NUM_0]] [[NUM_1]] FCFA »).
    residue = TOKEN_RE.sub("", target or "")
    for term in DNT_TERMS:
        residue = re.sub(
            rf"(?<!\w){re.escape(term)}(?!\w)", " ", residue, flags=re.I
        )
    if not re.search(r"[A-Za-zÀ-ÖØ-öø-ÿɓɗŋƴɔɛə]", residue):
        return True

    return False


def french_leak(source: str, target: str) -> list[str]:
    target_words = words(target)
    if not target_words:
        return []

    stop_count = sum(1 for word in target_words if word in FRENCH_STOP)
    content_count = sum(1 for word in target_words if word in FRENCH_CONTENT)
    verb_count = sum(1 for word in target_words if word in FRENCH_VERBS)

    issues: list[str] = []
    if verb_count:
        issues.append("french_verb")
    if content_count >= 2:
        issues.append("french_leak")
    elif len(target_words) >= 4 and stop_count >= 3:
        issues.append("french_leak")
    elif len(target_words) >= 4 and (stop_count + content_count) / len(
        target_words
    ) >= 0.5:
        issues.append("french_leak")
    return issues


def english_leak(target: str) -> list[str]:
    target_words = words(target)
    if not target_words:
        return []
    hits = [word for word in target_words if word in ENGLISH_LEAK]
    if hits:
        return ["english_leak"]
    return []


def check_target(source: str, target: str, code: str) -> list[str]:
    issues: list[str] = []
    if not (target or "").strip():
        return ["empty"]

    prefix = PREFIX_RE.match(target)
    if prefix:
        stripped = strip_prefix(target)
        issues.append("mt_prefix")
        if normalize(source).startswith(normalize(stripped)) and normalize(
            stripped
        ) != normalize(source):
            issues.append("source_copy_truncated")

    technical = is_technical(source, target)
    if normalize(source) == normalize(target) and not technical:
        issues.append("source_copy")
    elif (
        normalize(target)
        and normalize(source).startswith(normalize(target))
        and normalize(target) != normalize(source)
    ):
        # La cible est un préfixe de la source : elle a perdu la fin. On
        # tolère seulement si les mots manquants sont des sigles/marques.
        extra = set(words(source)) - set(words(target))
        extra = {
            word
            for word in extra
            if word.upper() not in DNT_TERMS
            and word not in TECH_ALLOW
        }
        if extra:
            issues.append("source_copy_truncated")

    if not technical:
        issues.extend(french_leak(source, target))
        issues.extend(english_leak(target))

    for token in tokens(source):
        if target.count(token) != 1:
            issues.append("missing_token")

    for term in DNT_TERMS:
        if has_term(source, term) and not has_term(target, term):
            issues.append("dnt_missing")

    source_words = words(source)
    target_words = words(target)
    if (
        len(source_words) >= 5
        and len(target_words) <= max(1, int(len(source_words) * 0.3))
        and not is_technical(source, target)
    ):
        issues.append("too_short")

    if not (set(target) & LANG_CHARS.get(code, set())):
        issues.append("no_lang_char")

    # Doublons d'issues (french_leak peut être ajouté deux fois).
    return list(dict.fromkeys(issues))


def split_alternatives(target: str) -> list[str]:
    parts = [part.strip() for part in re.split(r"\s*/\s*", target or "")]
    return [part for part in parts if part]


def independence(t1: dict, t2: dict) -> tuple[list[dict], dict]:
    rows: list[dict] = []
    counts = Counter()
    for item_id in sorted(set(t1) & set(t2)):
        left = (t1[item_id].get("target") or "").strip()
        right = (t2[item_id].get("target") or "").strip()
        if not left and not right:
            relation = "empty"
        elif not left or not right:
            relation = "incomplete"
        elif normalize(left) == normalize(right):
            relation = "exact"
        else:
            alternatives = {
                normalize(part) for part in split_alternatives(left)
            }
            if normalize(right) in alternatives:
                relation = "alternative"
            elif difflib.SequenceMatcher(
                None, normalize(left), normalize(right)
            ).ratio() >= 0.85:
                relation = "near"
            else:
                relation = "divergent"
        counts[relation] += 1
        comment_left = normalize(t1[item_id].get("commentaire") or "")
        comment_right = normalize(t2[item_id].get("commentaire") or "")
        comment_derived = bool(
            comment_left
            and comment_right
            and (
                comment_left == comment_right
                or comment_right.startswith(comment_left)
                or comment_left.startswith(comment_right)
            )
        )
        if comment_derived:
            counts["comment_derived"] += 1
        rows.append(
            {
                "item_id": item_id,
                "relation": relation,
                "target_t1": left,
                "target_t2": right,
                "comment_derived": comment_derived,
            }
        )

    total = sum(
        counts[key]
        for key in ("exact", "alternative", "near", "divergent", "incomplete")
    )
    derived = counts["exact"] + counts["alternative"] + counts["near"]
    ratio = derived / total if total else 0.0
    if counts["exact"] / total >= 0.95 if total else False:
        verdict = "copied"
    elif ratio >= 0.8:
        verdict = "derived"
    elif ratio >= 0.5:
        verdict = "partly_independent"
    else:
        verdict = "independent"
    summary = {
        "rows": total,
        "exact": counts["exact"],
        "alternative": counts["alternative"],
        "near": counts["near"],
        "divergent": counts["divergent"],
        "incomplete": counts["incomplete"],
        "comment_derived": counts["comment_derived"],
        "derived_ratio": round(ratio, 4),
        "verdict": verdict,
    }
    return rows, summary


def audit_language(code: str) -> dict:
    label = LABELS[code]
    t1_rows = read_csv(REVIEW / f"{label}.t1.csv")
    t2_rows = read_csv(REVIEW / f"{label}.t2.csv")
    t1 = {row["item_id"]: row for row in t1_rows}
    t2 = {row["item_id"]: row for row in t2_rows}

    results: list[dict] = []
    issue_counts_t1: Counter = Counter()
    issue_counts_t2: Counter = Counter()
    hard_rows_t1 = 0
    hard_rows_t2 = 0
    for item_id in sorted(set(t1) | set(t2)):
        left = t1.get(item_id)
        right = t2.get(item_id)
        source = (left or right or {}).get("source_fr", "")
        issues_t1 = check_target(source, (left or {}).get("target", ""), code)
        issues_t2 = check_target(source, (right or {}).get("target", ""), code)
        hard_t1 = [issue for issue in issues_t1 if issue in HARD_ISSUES]
        hard_t2 = [issue for issue in issues_t2 if issue in HARD_ISSUES]
        if hard_t1:
            hard_rows_t1 += 1
        if hard_t2:
            hard_rows_t2 += 1
        issue_counts_t1.update(issues_t1)
        issue_counts_t2.update(issues_t2)
        results.append(
            {
                "lang": code,
                "item_id": item_id,
                "type": (left or right or {}).get("type", ""),
                "priorite": (left or right or {}).get("priorite", ""),
                "source_fr": source,
                "target_t1": (left or {}).get("target", ""),
                "target_t2": (right or {}).get("target", ""),
                "issues_t1": ",".join(issues_t1),
                "issues_t2": ",".join(issues_t2),
                "hard_t1": bool(hard_t1),
                "hard_t2": bool(hard_t2),
                "reviewer_t1": (left or {}).get("reviewer", ""),
                "reviewer_t2": (right or {}).get("reviewer", ""),
            }
        )

    relations, summary = independence(t1, t2)
    examples = [
        {
            "item_id": row["item_id"],
            "source_fr": row["source_fr"][:120],
            "target_t1": row["target_t1"][:120],
            "issues_t1": row["issues_t1"],
        }
        for row in results
        if row["hard_t1"] and "mt_prefix" in row["issues_t1"]
    ][:8]

    return {
        "code": code,
        "label": label,
        "rows": len(results),
        "p0": sum(1 for row in results if row["priorite"] == "P0"),
        "t1": {
            "hard_rows": hard_rows_t1,
            "issue_counts": dict(issue_counts_t1),
            "clean_rows": len(results) - hard_rows_t1,
        },
        "t2": {
            "hard_rows": hard_rows_t2,
            "issue_counts": dict(issue_counts_t2),
            "clean_rows": len(results) - hard_rows_t2,
        },
        "independence": summary,
        "prefix_examples": examples,
        "relations": relations,
        "results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-out", type=Path, default=DEFAULT_JSON)
    parser.add_argument("--csv-out", type=Path, default=DEFAULT_CSV)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Sortir en erreur si une ligne dure ou une dépendance est détectée.",
    )
    args = parser.parse_args()

    payload = {
        "languages": {code: audit_language(code) for code in LABELS},
    }
    payload["summary"] = {
        "rows": sum(lang["rows"] for lang in payload["languages"].values()),
        "t1_hard": sum(
            lang["t1"]["hard_rows"] for lang in payload["languages"].values()
        ),
        "t2_hard": sum(
            lang["t2"]["hard_rows"] for lang in payload["languages"].values()
        ),
        "non_independent": [
            code
            for code, lang in payload["languages"].items()
            if lang["independence"]["verdict"] != "independent"
        ],
    }

    args.json_out.parent.mkdir(parents=True, exist_ok=True)
    args.json_out.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    fields = [
        "lang",
        "item_id",
        "type",
        "priorite",
        "source_fr",
        "target_t1",
        "target_t2",
        "issues_t1",
        "issues_t2",
        "hard_t1",
        "hard_t2",
        "reviewer_t1",
        "reviewer_t2",
        "relation",
        "comment_derived",
    ]
    args.csv_out.parent.mkdir(parents=True, exist_ok=True)
    with args.csv_out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for code in LABELS:
            language = payload["languages"][code]
            relation_by_id = {
                row["item_id"]: row for row in language["relations"]
            }
            for row in language["results"]:
                relation = relation_by_id.get(row["item_id"], {})
                row["relation"] = relation.get("relation", "")
                row["comment_derived"] = relation.get(
                    "comment_derived", ""
                )
                writer.writerow(row)

    for code, lang in payload["languages"].items():
        ind = lang["independence"]
        print(
            f"{code}: {lang['rows']} lignes · T1 dures {lang['t1']['hard_rows']} "
            f"· T2 dures {lang['t2']['hard_rows']} · indépendance "
            f"{ind['verdict']} ({ind['derived_ratio']:.1%} dérivées)"
        )
        counts = lang["t1"]["issue_counts"]
        if counts:
            top = ", ".join(
                f"{name}={count}"
                for name, count in Counter(counts).most_common(6)
            )
            print(f"  T1: {top}")
        if lang["prefix_examples"]:
            print("  exemples de préfixe machine :")
            for example in lang["prefix_examples"][:3]:
                print(
                    f"    {example['item_id']} | "
                    f"{example['source_fr'][:60]} => "
                    f"{example['target_t1'][:60]}"
                )

    print(
        f"Rapport : {args.json_out.relative_to(ROOT)} · "
        f"{args.csv_out.relative_to(ROOT)}"
    )

    if args.strict:
        failed = False
        for code, lang in payload["languages"].items():
            if lang["t1"]["hard_rows"] or lang["t2"]["hard_rows"]:
                failed = True
            if lang["independence"]["verdict"] == "copied":
                failed = True
        if failed:
            print("Audit strict : données non validables.", file=sys.stderr)
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
