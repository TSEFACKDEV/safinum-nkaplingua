#!/usr/bin/env python3
"""Contrats API robustes — 16 cas HTTP (M9).

Lance l'application FastAPI en mode mock via TestClient, vérifie les contrats,
les refus, les en-têtes CORS et l'absence de rendu HTML d'un texte hostile.
Écrit docs/test-results/api-robust.json.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

os.environ.setdefault("NK_MOCK", "1")
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "server"))

from fastapi.testclient import TestClient  # noqa: E402

from app import app  # noqa: E402

client = TestClient(app)
RESULTS: list[dict] = []


def check(name: str, condition: bool, detail: str) -> None:
    RESULTS.append({"case": name, "ok": bool(condition), "detail": detail})
    if not condition:
        print(f"FAIL {name}: {detail}", file=sys.stderr)


def main() -> int:
    health = client.get("/health")
    check(
        "health",
        health.status_code == 200 and health.json().get("mock") is True,
        f"{health.status_code} {health.text[:80]}",
    )

    languages = client.get("/languages")
    codes = [item.get("code") for item in languages.json().get("targets", [])]
    check(
        "languages-3",
        languages.status_code == 200 and codes == ["fub", "ewo", "dua"],
        f"{languages.status_code} {codes}",
    )

    detect_fr = client.post("/detect", json={"text": "Le solde de votre compte est disponible."})
    check(
        "detect-fr",
        detect_fr.status_code == 200 and detect_fr.json().get("code") == "fr",
        f"{detect_fr.status_code} {detect_fr.text[:80]}",
    )

    detect_en = client.post("/detect", json={"text": "The balance of your account is available."})
    check(
        "detect-en",
        detect_en.status_code == 200 and detect_en.json().get("code") == "en",
        f"{detect_en.status_code} {detect_en.text[:80]}",
    )

    hinted = client.post("/detect", json={"text": "Solde", "hint": "en-US"})
    check(
        "detect-hint",
        hinted.status_code == 200 and hinted.json().get("code") == "en",
        f"{hinted.status_code} {hinted.text[:80]}",
    )

    translate = client.post(
        "/translate",
        json={
            "source": "fr",
            "target": "fub",
            "segments": [{"id": "a", "text": "Le solde est de 1 000 FCFA."}],
        },
    )
    payload = translate.json() if translate.status_code == 200 else {}
    translated = (payload.get("translations") or [{}])[0].get("text", "")
    check(
        "translate-token",
        translate.status_code == 200 and "1 000 FCFA" in translated,
        f"{translate.status_code} {translated[:100]}",
    )

    english = client.post(
        "/translate",
        json={"source": "en", "target": "fub", "segments": [{"id": "b", "text": "Your balance is available."}]},
    )
    check(
        "translate-en-source",
        english.status_code == 200 and english.json().get("translations"),
        f"{english.status_code} {english.text[:100]}",
    )

    unknown = client.post(
        "/translate",
        json={"source": "fr", "target": "xxx", "segments": [{"id": "c", "text": "Bonjour."}]},
    )
    check("reject-unknown-target", unknown.status_code == 400, str(unknown.status_code))

    pack_target = client.post(
        "/translate",
        json={"source": "fr", "target": "dua", "segments": [{"id": "d", "text": "Bonjour."}]},
    )
    check("reject-pack-target", pack_target.status_code == 400, str(pack_target.status_code))

    removed = client.post(
        "/translate",
        json={"source": "fr", "target": "ybb", "segments": [{"id": "e", "text": "Bonjour."}]},
    )
    check("reject-removed-language", removed.status_code == 400, str(removed.status_code))

    missing = client.post("/translate", json={"source": "fr", "target": "fub"})
    check("reject-missing-segments", missing.status_code == 422, str(missing.status_code))

    empty = client.post(
        "/translate",
        json={"source": "fr", "target": "fub", "segments": []},
    )
    check(
        "empty-segments",
        empty.status_code == 200 and empty.json().get("translations") == [],
        f"{empty.status_code} {empty.text[:80]}",
    )

    preflight = client.options(
        "/translate",
        headers={
            "Origin": "http://127.0.0.1:8000",
            "Access-Control-Request-Method": "POST",
        },
    )
    check(
        "cors-localhost",
        preflight.status_code in {200, 204}
        and preflight.headers.get("access-control-allow-origin") == "http://127.0.0.1:8000",
        f"{preflight.status_code} {dict(preflight.headers)}",
    )

    extension = client.options(
        "/translate",
        headers={
            "Origin": "chrome-extension://abcdefghijklmnop",
            "Access-Control-Request-Method": "POST",
        },
    )
    check(
        "cors-extension",
        extension.status_code in {200, 204}
        and extension.headers.get("access-control-allow-origin") == "chrome-extension://abcdefghijklmnop",
        f"{extension.status_code} {extension.headers.get('access-control-allow-origin')}",
    )

    evil = client.options(
        "/translate",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    check(
        "cors-refuse-evil",
        evil.headers.get("access-control-allow-origin") is None,
        f"{evil.status_code} {evil.headers.get('access-control-allow-origin')}",
    )

    xss = client.post(
        "/translate",
        json={
            "source": "fr",
            "target": "fub",
            "segments": [{"id": "x", "text": "<script>alert(1)</script> Le solde est disponible."}],
        },
    )
    body = xss.text
    parsed_ok = False
    try:
        parsed = xss.json()
        parsed_ok = isinstance(parsed.get("translations"), list)
    except ValueError:
        parsed_ok = False
    check(
        "xss-text-only",
        xss.status_code == 200
        and xss.headers.get("content-type", "").startswith("application/json")
        and parsed_ok,
        f"{xss.status_code} {xss.headers.get('content-type')} {body[:120]}",
    )

    demo = client.get("/demo")
    check(
        "demo-html",
        demo.status_code == 200 and "text/html" in demo.headers.get("content-type", ""),
        f"{demo.status_code} {demo.headers.get('content-type')}",
    )

    output = ROOT / "docs" / "test-results" / "api-robust.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(RESULTS, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    failed = [item for item in RESULTS if not item["ok"]]
    print(f"api-robust {'OK' if not failed else 'FAIL'} — {len(RESULTS) - len(failed)}/{len(RESULTS)} cas")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
