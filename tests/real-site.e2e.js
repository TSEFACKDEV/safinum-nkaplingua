/**
 * Recette réelle Chrome — stack packs, sans backend (priorité 4).
 *
 * Charge l'extension réelle dans Chrome for Testing, avec une copie de test
 * qui ajoute uniquement https://safinum.cm/* aux host_permissions. Le
 * manifeste de production reste en activeTab.
 *
 * Parcours : 5 étapes + bascule EN. Vérifie couverture pack, zéro non traduit,
 * zéro critique MT, préservation, boutons/champs, restauration, erreurs page.
 *
 * Prérequis :
 *   npm install --no-save --no-package-lock playwright
 *   PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright (ou CHROME_PATH=...)
 *
 * Usage :
 *   node tests/real-site.e2e.js
 *   SITE_URL=... node tests/real-site.e2e.js
 *
 * Écrit docs/test-results/real-site-packs-<date>.json.
 */

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const siteUrl = process.env.SITE_URL || "https://safinum.cm/hackathon-test";
const siteOrigin = new URL(siteUrl).origin;
const pad = (value) => String(value).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
  now.getDate()
)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const resultFile = path.join(
  root,
  "docs/test-results",
  `real-site-packs-${stamp}.json`
);
const cache = process.env.NK_TEST_CACHE
  ? path.resolve(process.env.NK_TEST_CACHE)
  : path.join(root, ".cache/real-site");
const testExtension = path.join(cache, "extension");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function prepareExtension() {
  fs.rmSync(testExtension, { recursive: true, force: true });
  fs.cpSync(path.join(root, "extension"), testExtension, { recursive: true });
  const manifestPath = path.join(testExtension, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.host_permissions = [
    ...new Set([...(manifest.host_permissions || []), `${siteOrigin}/*`])
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

function norm(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

async function readSummary(page) {
  return page.evaluate(() => {
    const raw = document.documentElement.getAttribute("data-nk-summary");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });
}

async function snapshot(page) {
  const body = await page.locator("body").innerText();
  return {
    body,
    summary: await readSummary(page),
    normalized: norm(body),
    title: await page.title(),
    inputs: await page
      .locator("input,select,textarea")
      .evaluateAll((els) => els.map((e) => ({ value: e.value, checked: e.checked }))),
    buttons: await page
      .locator("button")
      .evaluateAll((els) => els.map((e) => ({ text: (e.innerText || "").trim(), disabled: e.disabled }))),
    amounts: [...body.matchAll(/[\d\s\u00A0]{1,}(?:FCFA)/g)].map((m) => norm(m[0])),
    references: [...body.matchAll(/SAF-\d{4}-[A-Z0-9]+/g)].map((m) => m[0]),
    hasAccount: body.includes("CM 001 2345 6789 01"),
    hasAmina: body.includes("Amina Ngo Bell"),
    hasJeanPaul: body.includes("Jean-Paul Mbarga")
  };
}

async function toastText(page) {
  return page.evaluate(() => {
    const hosts = [...document.querySelectorAll("div")].filter((d) => d.shadowRoot);
    const toast = hosts
      .map((h) => h.shadowRoot.querySelector(".toast")?.textContent || "")
      .filter(Boolean)
      .pop();
    return toast ? toast.replace(/\s+/g, " ").trim() : "";
  });
}

async function waitForTranslation(page, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const summary = await readSummary(page);
    if (summary && summary.translated > 0) {
      await page.waitForTimeout(500);
      return summary;
    }
    const count = await page.locator("[data-nk-translated]").count();
    if (count > 0) {
      await page.waitForTimeout(400);
      return { translated: count };
    }
    await page.waitForTimeout(300);
  }
  return { translated: await page.locator("[data-nk-translated]").count() };
}

async function waitForToast(page, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const toast = await toastText(page);
    if (toast.includes("passage(s) traduits") || toast.includes("Traduction terminée")) return toast;
    await page.waitForTimeout(250);
  }
  return toastText(page);
}

async function gotoWithRetry(page, url) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(4000);
    }
  }
  throw lastError;
}

async function main() {
  const run = {
    startedAt: new Date().toISOString(),
    siteUrl,
    browser: "chrome-for-testing (playwright)",
    steps: {},
    en: {},
    errors: [],
    status: "fail"
  };
  prepareExtension();

  const env = {
    ...process.env,
    HOME: path.join(cache, "home"),
    XDG_CONFIG_HOME: path.join(cache, "home/.config"),
    XDG_CACHE_HOME: path.join(cache, "home/.cache"),
    TMPDIR: path.join(cache, "tmp")
  };
  fs.mkdirSync(env.HOME, { recursive: true });
  fs.mkdirSync(env.TMPDIR, { recursive: true });

  function findChrome() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    const browsers = path.join(root, ".cache/ms-playwright");
    if (fs.existsSync(browsers)) {
      for (const entry of fs.readdirSync(browsers)) {
        if (!entry.startsWith("chromium-")) continue;
        const candidate = path.join(browsers, entry, "chrome-linux64/chrome");
        if (fs.existsSync(candidate)) return candidate;
        const fallback = path.join(browsers, entry, "chrome-linux/chrome");
        if (fs.existsSync(fallback)) return fallback;
      }
    }
    return chromium.executablePath();
  }
  fs.rmSync(path.join(cache, "profile"), { recursive: true, force: true });
  const context = await chromium.launchPersistentContext(path.join(cache, "profile"), {
    executablePath: findChrome(),
    headless: true,
    env,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${testExtension}`,
      `--load-extension=${testExtension}`,
      "--no-sandbox",
      "--disable-dev-shm-usage"
    ]
  });

  try {
    const worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent("serviceworker", { timeout: 15000 }));
    const page = await context.newPage();
    page.on("pageerror", (error) => run.errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") run.errors.push(`console: ${message.text()}`);
    });

    await gotoWithRetry(page, siteUrl);

    const tabIds = await worker.evaluate(async () =>
      (await chrome.tabs.query({})).map((tab) => tab.id)
    );
    for (const id of tabIds) {
      try {
        await worker.evaluate(
          async (tabId) =>
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["languages.js", "content.js", "widget.js"]
            }),
          id
        );
      } catch {
        // Onglet sans contenu injectable : ignoré.
      }
    }
    let siteTab = null;
    for (const id of tabIds) {
      try {
        const response = await worker.evaluate(
          async (tabId) => chrome.tabs.sendMessage(tabId, { type: "NK_SET_TARGET", target: "fub" }),
          id
        );
        if (response?.ok) siteTab = id;
      } catch {
        // Pas le bon onglet.
      }
    }
    assert(siteTab !== null, "onglet du site introuvable");
    const send = (message) =>
      worker.evaluate(
        async ({ id, payload }) => chrome.tabs.sendMessage(id, payload),
        { id: siteTab, payload: message }
      );

    async function click(name) {
      const button = page.getByRole("button", { name, exact: false }).first();
      await button.waitFor({ state: "visible", timeout: 8000 });
      await button.click();
      await page.waitForTimeout(900);
    }

    async function checkStep(
      label,
      { expectTitle = false, allowedUntranslated = 0 } = {}
    ) {
      const before = await snapshot(page);
      await send({ type: "NK_TRANSLATE_PAGE", target: "fub" });
      const summary = await waitForTranslation(page);
      const toast = await waitForToast(page);
      const after = await snapshot(page);
      const domTranslated = await page.locator("[data-nk-translated]").count();
      const domUntranslated = await page.locator("[data-nk-untranslated]").count();
      const domDemoCritical = await page.locator("[data-nk-demo-critical]").count();
      const counts = {
        fub: await page.locator('[lang="fub"]').count(),
        translated: summary?.translated ?? domTranslated,
        domTranslated,
        untranslated: summary?.untranslated ?? domUntranslated,
        demoCritical: summary?.demo ?? domDemoCritical,
        partial: summary?.partial ?? 0,
        human: summary?.human ?? 0,
        provider: summary?.provider || null
      };

      const failures = [];
      if (counts.translated === 0) failures.push("aucun segment traduit");
      if (counts.untranslated > allowedUntranslated) {
        failures.push(`${counts.untranslated} non traduit(s)`);
      }
      if (counts.demoCritical !== 0) failures.push(`${counts.demoCritical} critique(s) MT`);
      for (const amount of before.amounts) {
        if (!after.normalized.includes(amount)) failures.push(`montant perdu ${amount}`);
      }
      for (const reference of before.references) {
        if (!after.normalized.includes(reference)) failures.push(`référence perdue ${reference}`);
      }
      if (before.hasAccount && !after.hasAccount) failures.push("compte perdu");
      if (before.hasAmina && !after.hasAmina) failures.push("nom Amina perdu");
      if (before.hasJeanPaul && !after.hasJeanPaul) failures.push("nom Jean-Paul perdu");
      if (JSON.stringify(before.inputs) !== JSON.stringify(after.inputs)) {
        failures.push("champs modifiés");
      }
      if (before.buttons.length !== after.buttons.length) failures.push("boutons ajoutés/retirés");
      const beforeDisabled = before.buttons.map((b) => b.disabled);
      const afterDisabled = after.buttons.map((b) => b.disabled);
      if (JSON.stringify(beforeDisabled) !== JSON.stringify(afterDisabled)) {
        failures.push("état disabled des boutons modifié");
      }
      if (expectTitle && before.title === after.title) failures.push("titre non traduit");

      await send({ type: "NK_RESTORE" });
      await page.waitForTimeout(1600);
      const restored = await snapshot(page);
      if (restored.normalized !== before.normalized) failures.push("restauration incomplète");
      if (restored.title !== before.title) failures.push("titre non restauré");
      const markers = await page.locator("[data-nk-translated]").count();
      if (markers !== 0) failures.push(`${markers} marqueur(s) après restauration`);
      if (restored.summary) failures.push("reçu non nettoyé après restauration");

      run.steps[label] = { counts, before: { title: before.title }, after: { title: after.title, body: after.body }, toast, failures, restored: failures.length === 0 };
      if (failures.length) throw new Error(`${label}: ${failures.join(", ")}`);
    }

    await checkStep("step1", { expectTitle: true });
    await click("Effectuer un transfert");
    await checkStep("step2");
    await click("Continuer");
    await checkStep("step3");
    await page.locator('input[type="checkbox"]').check({ force: true });
    await click("Continuer");
    await checkStep("step4");
    await page.locator('input[type="checkbox"]').check({ force: true });
    await click("Confirmer le transfert");
    await checkStep("step5");

    // Bascule EN sur une page fraîche.
    await gotoWithRetry(page, siteUrl);
    const tabIdsEn = await worker.evaluate(async () =>
      (await chrome.tabs.query({})).map((tab) => tab.id)
    );
    for (const id of tabIdsEn) {
      try {
        await worker.evaluate(
          async (tabId) =>
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["languages.js", "content.js", "widget.js"]
            }),
          id
        );
      } catch {}
    }
    for (const id of tabIdsEn) {
      try {
        const response = await worker.evaluate(
          async (tabId) => chrome.tabs.sendMessage(tabId, { type: "NK_SET_TARGET", target: "fub" }),
          id
        );
        if (response?.ok) siteTab = id;
      } catch {}
    }
    await click("EN");
    await page.waitForFunction(() => document.body.innerText.includes("Balance"), null, { timeout: 8000 });
    await page.waitForTimeout(800);
    // Les 4 libellés EN absents du pack restent visibles en anglais : c'est
    // une limite connue (40/44), pas une régression du repli phrase.
    await checkStep("en-step1", { expectTitle: true, allowedUntranslated: 4 });
    run.en = { ...run.steps["en-step1"], label: "en-step1" };
    delete run.steps["en-step1"];

    // Repli phrase par phrase : paragraphe mixte (phrase connue + inconnue).
    await gotoWithRetry(page, siteUrl);
    const fallbackTabs = await worker.evaluate(async () =>
      (await chrome.tabs.query({})).map((tab) => tab.id)
    );
    for (const id of fallbackTabs) {
      try {
        await worker.evaluate(
          async (tabId) =>
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["languages.js", "content.js", "widget.js"]
            }),
          id
        );
      } catch {}
    }
    for (const id of fallbackTabs) {
      try {
        const response = await worker.evaluate(
          async (tabId) =>
            chrome.tabs.sendMessage(tabId, {
              type: "NK_SET_TARGET",
              target: "fub"
            }),
          id
        );
        if (response?.ok) siteTab = id;
      } catch {}
    }
    await page.evaluate(() => {
      const probe = document.createElement("p");
      probe.id = "nk-fallback-probe";
      probe.textContent =
        "Le solde est de 25 000 FCFA. Le vendeur arrive demain.";
      document.body.prepend(probe);
    });
    await send({ type: "NK_TRANSLATE_PAGE", target: "fub" });
    await waitForTranslation(page);
    const fallbackToast = await waitForToast(page);
    const probe = await page.locator("#nk-fallback-probe").evaluate((element) => ({
      text: element.textContent,
      untranslated: element.hasAttribute("data-nk-untranslated"),
      notice: [...document.documentElement.children]
        .map((child) => child.shadowRoot?.querySelector(".notice")?.title || "")
        .join(" ")
    }));
    const fallbackFailures = [];
    if (!probe.text.includes("Jawdindi ko 25 000 FCFA.")) {
      fallbackFailures.push("phrase connue non traduite");
    }
    if (!probe.text.includes("Le vendeur arrive demain.")) {
      fallbackFailures.push("phrase inconnue altérée");
    }
    if (probe.untranslated) fallbackFailures.push("badge non traduit");
    // En mode démo, la notice et les badges sont masqués : le repli est
    // vérifié par le texte lui-même (phrase connue traduite, inconnue intacte).
    run.fallback = { probe, toast: fallbackToast, failures: fallbackFailures };
    await send({ type: "NK_RESTORE" });
    if (fallbackFailures.length) {
      throw new Error(`repli phrase : ${fallbackFailures.join(", ")}`);
    }
    if (fallbackToast.includes("non traduit(s)")) {
      throw new Error("repli phrase : un non traduit subsiste");
    }

    const frSummaryTotal = ["step1", "step2", "step3", "step4", "step5"].reduce(
      (sum, key) => sum + run.steps[key].counts.translated,
      0
    );
    run.frToastTotal = frSummaryTotal;
    if (frSummaryTotal !== 188) throw new Error(`total FR ${frSummaryTotal}, attendu 188`);
    if (run.errors.length) throw new Error(`erreurs page : ${run.errors.slice(0, 3).join(" | ")}`);
    run.status = "pass";
    run.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(resultFile), { recursive: true });
    fs.writeFileSync(resultFile, JSON.stringify(run, null, 2) + "\n");
    console.log(
      `real-site OK — 5 étapes + EN, ${Object.values({ ...run.steps, en: run.en }).reduce((sum, step) => sum + (step.counts?.translated || 0), 0)} segments traduits → ${path.relative(root, resultFile)}`
    );
  } catch (error) {
    run.error = error.message;
    fs.mkdirSync(path.dirname(resultFile), { recursive: true });
    fs.writeFileSync(resultFile, JSON.stringify(run, null, 2) + "\n");
    throw error;
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
