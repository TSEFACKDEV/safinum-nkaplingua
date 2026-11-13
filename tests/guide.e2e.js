/**
 * Recette « protocole SAFINUM » — conditions du guide officiel.
 * Page non modifiée, contenu injecté après chargement, montants/références,
 * changement de langue et absence de hook.
 *
 * Usage :
 *   NK_TEST_CACHE=/tmp/nk-guide node tests/guide.e2e.js
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const siteUrl = "https://safinum.cm/hackathon-test";
const cache = process.env.NK_TEST_CACHE
  ? path.resolve(process.env.NK_TEST_CACHE)
  : path.join(root, ".cache/guide");
const extension = path.join(cache, "extension");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = path.join(root, "docs/test-results", `guide-${stamp}.json`);

function prepare() {
  fs.rmSync(extension, { recursive: true, force: true });
  fs.cpSync(path.join(root, "extension"), extension, { recursive: true });
  const manifestPath = path.join(extension, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.host_permissions = [
    ...new Set([...(manifest.host_permissions || []), "https://safinum.cm/*"])
  ];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

function fail(message) {
  throw new Error(message);
}

(async () => {
  prepare();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const run = { startedAt: new Date().toISOString(), siteUrl, checks: {}, errors: [], status: "fail" };
  const env = {
    ...process.env,
    HOME: path.join(cache, "home"),
    XDG_CONFIG_HOME: path.join(cache, "home/.config"),
    XDG_CACHE_HOME: path.join(cache, "home/.cache"),
    TMPDIR: path.join(cache, "tmp")
  };
  fs.mkdirSync(env.HOME, { recursive: true });
  fs.mkdirSync(env.TMPDIR, { recursive: true });
  const context = await chromium.launchPersistentContext(path.join(cache, "profile"), {
    headless: false,
    env,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
      "--no-sandbox",
      "--disable-dev-shm-usage"
    ]
  });
  try {
    const worker = context.serviceWorkers()[0] || (await context.waitForEvent("serviceworker"));
    const page = await context.newPage();
    page.on("pageerror", (e) => run.errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") run.errors.push(`console: ${m.text()}`); });
    await page.goto(siteUrl, { waitUntil: "networkidle", timeout: 60000 });

    const tabIds = await worker.evaluate(async () => (await chrome.tabs.query({})).map((t) => t.id));
    for (const id of tabIds) {
      try {
        await worker.evaluate(async (tabId) => chrome.scripting.executeScript({
          target: { tabId }, files: ["languages.js", "content.js", "widget.js"]
        }), id);
      } catch {}
    }
    let siteTab = null;
    for (const id of tabIds) {
      try {
        const r = await worker.evaluate(async (tabId) => chrome.tabs.sendMessage(tabId, {
          type: "NK_SET_TARGET", target: "fub"
        }), id);
        if (r?.ok) siteTab = id;
      } catch {}
    }
    if (!siteTab) fail("onglet SAFINUM introuvable");
    const send = (message) => worker.evaluate(async ({ id, payload }) =>
      chrome.tabs.sendMessage(id, payload), { id: siteTab, payload: message });

    const before = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        amounts: body.match(/[\d\s\u00A0]{1,}(?:FCFA)/g) || [],
        references: body.match(/SAF-\d{4}-[A-Z0-9]+/g) || [],
        body,
        inputs: [...document.querySelectorAll("input,select,textarea")].map((e) => e.value),
        hooks: [...document.querySelectorAll("[data-i18n]")].length
      };
    });
    const translate = await send({ type: "NK_TRANSLATE_PAGE", target: "fub" });
    await page.waitForFunction(() => document.querySelectorAll("[data-nk-translated]").length > 10, null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({
      translated: document.querySelectorAll("[data-nk-translated]").length,
      amounts: document.body.innerText.match(/[\d\s\u00A0]{1,}(?:FCFA)/g) || [],
      inputs: [...document.querySelectorAll("input,select,textarea")].map((e) => e.value),
      references: document.body.innerText.match(/SAF-\d{4}-[A-Z0-9]+/g) || [],
      account: document.body.innerText.includes("CM 001 2345 6789 01")
    }));

    // Contenu injecté après chargement : le guide l'exige explicitement.
    await page.evaluate(() => {
      const host = document.createElement("section");
      host.id = "jury-injected";
      host.innerHTML = "<p>Votre compte</p><p>Le vendeur arrive demain.</p>";
      document.body.appendChild(host);
    });
    await page.waitForTimeout(2600);
    const dynamic = await page.evaluate(() => {
      const host = document.getElementById("jury-injected");
      return {
        text: host?.innerText || "",
        translated: host?.querySelectorAll("[data-nk-translated]").length || 0,
        untranslated: host?.querySelectorAll("[data-nk-untranslated]").length || 0
      };
    });

    // Changement de langue après traduction.
    const switchResponse = await send({ type: "NK_SET_TARGET", target: "ewo" });
    await page.waitForTimeout(1600);
    const state = await send({ type: "NK_GET_STATE" });

    run.checks = {
      noHookNeeded: before.hooks === 0,
      unmodifiedPage: before.body.includes("Safinum Pay") && after.translated > 0,
      amountsPreserved: before.amounts.every((a) =>
        after.amounts.some((b) => b.replace(/\s+/g, "") === a.replace(/\s+/g, ""))
      ),
      referencePreserved: before.references.every((a) => after.references.includes(a)),
      accountPreserved: after.account,
      inputsUntouched: JSON.stringify(after.inputs) === JSON.stringify(before.inputs),
      dynamicKnownTranslated: dynamic.text.includes("Asaaku ma") || dynamic.translated > 0,
      dynamicUnknownStaysFrench: dynamic.text.includes("Le vendeur arrive demain."),
      languageSwitchRetranslates: switchResponse?.retranslating === true && state?.target === "ewo" && state?.translated > 0
    };
    const failed = Object.entries(run.checks).filter(([, v]) => !v).map(([k]) => k);
    run.translation = { translated: translate?.translated || 0, state };
    run.dynamic = dynamic;
    run.failed = failed;
    if (failed.length) fail(`conditions non satisfaites : ${failed.join(", ")}`);
    run.status = "pass";
    console.log(`guide OK — ${after.translated} passages, dynamique ${dynamic.translated}/${dynamic.untranslated}, changement ${state?.target}`);
  } finally {
    fs.writeFileSync(output, JSON.stringify(run, null, 2) + "\n");
    await context.close();
  }
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
