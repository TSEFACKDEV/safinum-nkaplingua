#!/usr/bin/env python3
"""Recette réelle Firefox — stack packs, sans backend (priorité 1).

Construit un XPI de test depuis dist/firefox (code inchangé, ajout de
https://safinum.cm/* et d'un content script de test pour déclencher la
traduction), l'installe en add-on temporaire dans Firefox 159 via Selenium,
puis rejoue les 5 étapes + EN.

Prérequis manuels (hors CI) :
  - Firefox : .cache/firefox/firefox/firefox ou NK_FIREFOX_BIN
  - geckodriver : .cache/selenium/geckodriver ou NK_GECKODRIVER
  - selenium installé dans le venv serveur

Usage :
  server/.venv/bin/python tests/real-firefox.e2e.py
Écrit docs/test-results/real-firefox-<date>.json.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / ".cache/real-firefox"
EXT = CACHE / "extension"
XPI = CACHE / "nkaplingua-firefox-test.xpi"
SITE = os.environ.get("SITE_URL", "https://safinum.cm/hackathon-test")
FIREFOX = Path(os.environ.get("NK_FIREFOX_BIN", ROOT / ".cache/firefox/firefox/firefox"))
GECKO = Path(os.environ.get("NK_GECKODRIVER", ROOT / ".cache/selenium/geckodriver"))


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def build_xpi() -> None:
    subprocess.run(["bash", str(ROOT / "scripts/build-firefox.sh")], check=True, capture_output=True)
    shutil.rmtree(EXT, ignore_errors=True)
    shutil.copytree(ROOT / "dist/firefox", EXT)
    manifest_path = EXT / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    origin = f"{SITE.split('/hackathon-test')[0]}/*"
    manifest["host_permissions"] = sorted(
        set(manifest.get("host_permissions", [])) | {origin}
    )
    manifest["content_scripts"] = [
        {
            "matches": [origin],
            "js": ["languages.js", "content.js", "autotrigger.js"],
            "run_at": "document_idle",
        }
    ]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    content = EXT / "content.js"
    text = content.read_text(encoding="utf-8")
    needle = "\n})();\n"
    assert text.endswith(needle), "fin de content.js inattendue"
    text = text[:-len(needle)] + "\n  window.__NK_TRANSLATE__ = translatePage;\n  window.__NK_RESTORE__ = restoreAll;\n})();\n"
    content.write_text(text, encoding="utf-8")
    (EXT / "autotrigger.js").write_text(
        'document.documentElement.setAttribute("data-nk-autotrigger", "1");\n'
        'document.addEventListener("nk-translate", () => { if (window.__NK_TRANSLATE__) window.__NK_TRANSLATE__("fub"); });\n'
        'document.addEventListener("nk-restore", () => { if (window.__NK_RESTORE__) window.__NK_RESTORE__(); });\n',
        encoding="utf-8",
    )
    XPI.unlink(missing_ok=True)
    with zipfile.ZipFile(XPI, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in EXT.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(EXT))


def snapshot(driver) -> dict:
    return driver.execute_script(
        """
        const body = document.body ? document.body.innerText : "";
        const hosts = [...document.querySelectorAll("div")].filter(d => d.shadowRoot);
        const toast = hosts.map(h => h.shadowRoot.querySelector(".toast")?.textContent || "").filter(Boolean).pop() || "";
        const rawSummary = document.documentElement.getAttribute("data-nk-summary");
        let summary = null;
        try { summary = rawSummary ? JSON.parse(rawSummary) : null; } catch { summary = null; }
        return {
          body,
          summary,
          title: document.title,
          inputs: [...document.querySelectorAll("input,select,textarea")].map(e => ({value:e.value, checked:e.checked})),
          buttons: [...document.querySelectorAll("button")].map(e => ({text:(e.innerText||"").trim(), disabled:e.disabled})),
          fub: document.querySelectorAll('[lang="fub"]').length,
          translated: document.querySelectorAll('[data-nk-translated]').length,
          untranslated: document.querySelectorAll('[data-nk-untranslated]').length,
          demoCritical: document.querySelectorAll('[data-nk-demo-critical]').length,
          toast,
          errors: (window.__nkErrors || []).slice(-8)
        };
        """
    )


def trigger(driver, event: str) -> None:
    driver.execute_script(f"document.dispatchEvent(new Event('{event}'))")


def wait_toast(driver, timeout: float = 25) -> str:
    deadline = time.time() + timeout
    while time.time() < deadline:
        data = snapshot(driver)
        if "passage(s) traduits" in data["toast"]:
            time.sleep(0.8)
            return snapshot(driver)["toast"]
        time.sleep(0.3)
    return snapshot(driver)["toast"]


def click(driver, label: str) -> None:
    elements = driver.find_elements(
        By.XPATH, f"//button[contains(normalize-space(.), '{label}')]"
    )
    if not elements:
        raise AssertionError(f"bouton introuvable : {label}")
    element = elements[0]
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
    element.click()
    time.sleep(1)


def goto(driver, url: str) -> None:
    last = None
    for _ in range(3):
        try:
            driver.get(url)
            WebDriverWait(driver, 20).until(
                lambda d: "SAFINUM" in d.title or "Safinum" in d.title
            )
            time.sleep(1.5)
            return
        except Exception as error:  # noqa: BLE001
            last = error
            time.sleep(4)
    raise last  # type: ignore[misc]


def main() -> int:
    if not FIREFOX.exists():
        raise SystemExit(f"Firefox introuvable : {FIREFOX}")
    if not GECKO.exists():
        raise SystemExit(f"geckodriver introuvable : {GECKO}")

    build_xpi()
    os.environ["HOME"] = str(CACHE / "home")
    os.environ["XDG_RUNTIME_DIR"] = str(CACHE / "runtime")
    os.environ["MOZ_HEADLESS"] = "1"
    os.environ["TMPDIR"] = str(CACHE / "tmp")
    (CACHE / "home").mkdir(parents=True, exist_ok=True)
    (CACHE / "runtime").mkdir(parents=True, exist_ok=True)
    (CACHE / "tmp").mkdir(parents=True, exist_ok=True)

    options = Options()
    options.binary_location = str(FIREFOX)
    options.add_argument("-headless")
    driver = webdriver.Firefox(
        options=options, service=Service(executable_path=str(GECKO), log_output=str(CACHE / "geckodriver.log"))
    )
    run: dict = {
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "siteUrl": SITE,
        "browser": "Firefox (Selenium)",
        "steps": {},
        "en": {},
        "status": "fail",
    }
    try:
        driver.install_addon(str(XPI), temporary=True)
        driver.set_page_load_timeout(60)
        goto(driver, SITE)
        driver.execute_script(
            """
            window.__nkErrors = [];
            window.addEventListener('error', e => window.__nkErrors.push(String(e.message)));
            const original = console.error.bind(console);
            console.error = (...args) => { window.__nkErrors.push(args.join(' ')); original(...args); };
            """
        )

        def wait_summary(timeout: float = 25) -> dict | None:
            deadline = time.time() + timeout
            while time.time() < deadline:
                summary = snapshot(driver)["summary"]
                if summary and summary.get("translated", 0) > 0:
                    time.sleep(0.5)
                    return summary
                time.sleep(0.3)
            return snapshot(driver)["summary"]

        def check_step(label: str, expect_title: bool = False, allowed_untranslated: int = 0) -> None:
            before = snapshot(driver)
            before_norm = norm(before["body"])
            trigger(driver, "nk-translate")
            summary = wait_summary(driver) if False else wait_summary()
            toast = wait_toast(driver)
            after = snapshot(driver)
            counts = {
                "fub": after["fub"],
                "translated": (summary or {}).get("translated", after["translated"]),
                "domTranslated": after["translated"],
                "untranslated": (summary or {}).get("untranslated", after["untranslated"]),
                "demoCritical": (summary or {}).get("demo", after["demoCritical"]),
                "partial": (summary or {}).get("partial", 0),
                "human": (summary or {}).get("human", 0),
                "provider": (summary or {}).get("provider"),
            }
            failures = []
            if counts["translated"] == 0:
                failures.append("aucun segment traduit")
            if counts["untranslated"] > allowed_untranslated:
                failures.append(f"{counts['untranslated']} non traduit(s)")
            if counts["demoCritical"] != 0:
                failures.append(f"{counts['demoCritical']} critique(s) MT")
            for amount in re.findall(r"[\d\s\u00a0]{1,}FCFA", before["body"]):
                if norm(amount) not in norm(after["body"]):
                    failures.append(f"montant perdu {norm(amount)}")
            for reference in re.findall(r"SAF-\d{4}-[A-Z0-9]+", before["body"]):
                if reference not in after["body"]:
                    failures.append(f"référence perdue {reference}")
            if "CM 001 2345 6789 01" in before["body"] and "CM 001 2345 6789 01" not in after["body"]:
                failures.append("compte perdu")
            if "Amina Ngo Bell" in before["body"] and "Amina Ngo Bell" not in after["body"]:
                failures.append("nom Amina perdu")
            if "Jean-Paul Mbarga" in before["body"] and "Jean-Paul Mbarga" not in after["body"]:
                failures.append("nom Jean-Paul perdu")
            if before["inputs"] != after["inputs"]:
                failures.append("champs modifiés")
            if len(before["buttons"]) != len(after["buttons"]):
                failures.append("boutons ajoutés/retirés")
            if [b["disabled"] for b in before["buttons"]] != [b["disabled"] for b in after["buttons"]]:
                failures.append("état disabled modifié")
            if expect_title and before["title"] == after["title"]:
                failures.append("titre non traduit")
            if after["errors"]:
                failures.append(f"erreurs page : {after['errors'][:2]}")

            trigger(driver, "nk-restore")
            WebDriverWait(driver, 8).until(
                lambda d: d.execute_script(
                    "return document.querySelectorAll('[data-nk-translated]').length"
                )
                == 0
            )
            time.sleep(0.4)
            restored = snapshot(driver)
            if norm(restored["body"]) != before_norm:
                failures.append("restauration incomplète")
            if restored["title"] != before["title"]:
                failures.append("titre non restauré")
            if restored["summary"]:
                failures.append("reçu non nettoyé après restauration")

            run["steps"][label] = {
                "counts": counts,
                "toast": toast,
                "afterTitle": after["title"],
                "afterBody": after["body"],
                "failures": failures,
                "restored": not failures,
            }
            if failures:
                raise AssertionError(f"{label}: {', '.join(failures)}")

        check_step("step1", expect_title=True)
        click(driver, "Effectuer un transfert")
        check_step("step2")
        click(driver, "Continuer")
        check_step("step3")
        checkbox = driver.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
        if checkbox and not checkbox[0].is_selected():
            driver.execute_script("arguments[0].click();", checkbox[0])
            time.sleep(0.3)
        click(driver, "Continuer")
        check_step("step4")
        checkbox = driver.find_elements(By.CSS_SELECTOR, 'input[type="checkbox"]')
        if checkbox and not checkbox[0].is_selected():
            driver.execute_script("arguments[0].click();", checkbox[0])
            time.sleep(0.3)
        click(driver, "Confirmer le transfert")
        check_step("step5")

        goto(driver, SITE)
        driver.execute_script(
            """
            window.__nkErrors = [];
            window.addEventListener('error', e => window.__nkErrors.push(String(e.message)));
            """
        )
        click(driver, "EN")
        WebDriverWait(driver, 10).until(
            lambda d: "Balance" in d.find_element(By.TAG_NAME, "body").text
        )
        time.sleep(1)
        check_step("en-step1", expect_title=True, allowed_untranslated=4)
        run["en"] = {**run["steps"].pop("en-step1"), "label": "en-step1"}

        total = sum(run["steps"][key]["counts"]["translated"] for key in ["step1", "step2", "step3", "step4", "step5"])
        run["frToastTotal"] = total
        if total != 188:
            raise AssertionError(f"total FR {total}, attendu 188")
        run["status"] = "pass"
        run["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
        output = ROOT / "docs/test-results" / f"real-firefox-{time.strftime('%Y-%m-%d-%H%M%S')}.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(run, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        driver.save_screenshot(str(CACHE / "firefox-final.png"))
        print(json.dumps({"status": "pass", "frToastTotal": total, "en": run["en"]["counts"], "file": str(output)}, ensure_ascii=False, indent=2))
        return 0
    except Exception as error:  # noqa: BLE001
        run["error"] = str(error)
        output = ROOT / "docs/test-results" / f"real-firefox-{time.strftime('%Y-%m-%d-%H%M%S')}.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(run, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"FAIL {error}\npreuve: {output}", file=sys.stderr)
        return 1
    finally:
        driver.quit()


if __name__ == "__main__":
    raise SystemExit(main())
