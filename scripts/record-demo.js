/**
 * Screencast automatisé — démonstration NkapLingua sans voix off.
 *
 * Enregistre un parcours réel sur https://safinum.cm/hackathon-test avec les
 * packs embarqués, puis produit dist/nkaplingua-demo.mp4 (≤ 3 min, sans audio).
 * Le manifeste de production n'est pas modifié : une copie de test ajoute
 * uniquement l'hôte du site pour l'automatisation.
 *
 * Usage :
 *   NK_TEST_CACHE=/home/klein/.tmp/opencode/demo-cache \
 *   NODE_PATH=... CHROME_PATH=... node scripts/record-demo.js
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const siteUrl = process.env.SITE_URL || "https://safinum.cm/hackathon-test";
const siteOrigin = new URL(siteUrl).origin;
const cache = process.env.NK_TEST_CACHE
  ? path.resolve(process.env.NK_TEST_CACHE)
  : path.join(root, ".cache/demo");
const testExtension = path.join(cache, "extension");
const videoDir = path.join(cache, "video");
const output = path.join(root, "dist/nkaplingua-demo.mp4");
const width = 1280;
const height = 720;

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

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const browsers = path.join(root, ".cache/ms-playwright");
  if (fs.existsSync(browsers)) {
    for (const entry of fs.readdirSync(browsers)) {
      if (!entry.startsWith("chromium-")) continue;
      const candidate = path.join(browsers, entry, "chrome-linux64/chrome");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  return chromium.executablePath();
}

async function main() {
  prepareExtension();
  fs.rmSync(videoDir, { recursive: true, force: true });
  fs.mkdirSync(videoDir, { recursive: true });
  fs.mkdirSync(path.join(cache, "home"), { recursive: true });
  fs.mkdirSync(path.join(cache, "tmp"), { recursive: true });
  fs.rmSync(path.join(cache, "profile"), { recursive: true, force: true });

  const context = await chromium.launchPersistentContext(
    path.join(cache, "profile"),
    {
      executablePath: findChrome(),
      headless: true,
      viewport: { width, height },
      recordVideo: { dir: videoDir, size: { width, height } },
      env: {
        ...process.env,
        HOME: path.join(cache, "home"),
        XDG_CONFIG_HOME: path.join(cache, "home/.config"),
        XDG_CACHE_HOME: path.join(cache, "home/.cache"),
        TMPDIR: path.join(cache, "tmp")
      },
      ignoreDefaultArgs: ["--disable-extensions"],
      args: [
        `--disable-extensions-except=${testExtension}`,
        `--load-extension=${testExtension}`,
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--force-device-scale-factor=1"
      ]
    }
  );

  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker", { timeout: 15000 }));

  // Préchauffe le site dans un onglet non filmé pour que l'onglet de
  // démonstration n'affiche pas une longue page blanche au démarrage.
  const preload = await context.newPage();
  await preload.goto(siteUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await preload
    .waitForSelector("text=Safinum Pay", { timeout: 30000 })
    .catch(() => {});
  await preload.close();

  const page = await context.newPage();

  const sleep = (ms) => page.waitForTimeout(ms);

  async function inject() {
    const ids = await worker.evaluate(async () =>
      (await chrome.tabs.query({})).map((tab) => tab.id)
    );
    let siteTab = null;
    for (const id of ids) {
      try {
        await worker.evaluate(
          async (tabId) =>
            chrome.scripting.executeScript({
              target: { tabId },
              files: ["languages.js", "content.js"]
            }),
          id
        );
      } catch {}
    }
    for (const id of ids) {
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
    assert(siteTab !== null, "onglet du site introuvable");
    return siteTab;
  }

  async function send(tab, payload) {
    return worker.evaluate(
      async ({ id, message }) => chrome.tabs.sendMessage(id, message),
      { id: tab, message: payload }
    );
  }

  async function caption(tab, text) {
    await page.evaluate((value) => {
      let host = document.getElementById("nk-demo-caption");
      if (!host) {
        host = document.createElement("div");
        host.id = "nk-demo-caption";
        host.setAttribute("data-nk-ignore", "");
        host.style.cssText = [
          "position:fixed",
          "z-index:2147483646",
          "left:50%",
          "bottom:134px",
          "transform:translateX(-50%)",
          "max-width:820px",
          "width:calc(100% - 300px)",
          "padding:11px 18px",
          "border-radius:12px",
          "background:rgba(11,34,26,.93)",
          "border:1px solid rgba(232,213,173,.35)",
          "box-shadow:0 12px 30px rgba(0,0,0,.28)",
          "color:#f8f4ec",
          "font:600 17px/1.35 'Noto Sans',system-ui,sans-serif",
          "text-align:center",
          "pointer-events:none"
        ].join(";");
        document.documentElement.appendChild(host);
      }
      host.textContent = value;
    }, text);
  }

  async function removeCaption() {
    await page.evaluate(() => {
      document.getElementById("nk-demo-caption")?.remove();
    });
  }

  async function titleCard(kicker, title, lines, ms) {
    await page.evaluate(
      ({ kickerText, titleText, bodyLines }) => {
        let card = document.getElementById("nk-demo-title");
        if (!card) {
          card = document.createElement("div");
          card.id = "nk-demo-title";
          card.setAttribute("data-nk-ignore", "");
          card.style.cssText = [
            "position:fixed",
            "inset:0",
            "z-index:2147483647",
            "display:flex",
            "flex-direction:column",
            "justify-content:center",
            "align-items:center",
            "gap:18px",
            "background:radial-gradient(circle at 50% 30%,#174b39 0%,#08271e 65%,#041712 100%)",
            "color:#f8f4ec",
            "text-align:center",
            "padding:70px",
            "font-family:'Noto Sans',system-ui,sans-serif"
          ].join(";");
          document.documentElement.appendChild(card);
        }
        card.innerHTML = "";
        if (kickerText) {
          const kicker = document.createElement("div");
          kicker.textContent = kickerText;
          kicker.style.cssText =
            "letter-spacing:.22em;text-transform:uppercase;font-size:13px;color:#c9a45c;font-weight:700";
          card.appendChild(kicker);
        }
        const heading = document.createElement("div");
        heading.textContent = titleText;
        heading.style.cssText =
          "font-size:52px;line-height:1.12;font-weight:800;max-width:1000px";
        card.appendChild(heading);
        for (const line of bodyLines) {
          const p = document.createElement("div");
          p.textContent = line;
          p.style.cssText =
            "font-size:21px;line-height:1.5;max-width:900px;color:#e8d5ad";
          card.appendChild(p);
        }
      },
      { kickerText: kicker, titleText: title, bodyLines: lines }
    );
    await sleep(ms);
    await page.evaluate(() => {
      document.getElementById("nk-demo-title")?.remove();
    });
  }

  async function highlight(needles, ms = 6000) {
    // 1) Amener les cibles à l'écran.
    await page.evaluate((values) => {
      const find = (needle) => {
        const all = [...document.querySelectorAll("body *")];
        return all
          .filter((el) => {
            if (el.childElementCount !== 0) return false;
            if (!(el.textContent || "").includes(needle)) return false;
            const rect = el.getBoundingClientRect();
            return (
              rect.width > 12 &&
              rect.height > 8 &&
              el.offsetParent !== null &&
              (el.innerText || "").trim().length > 0
            );
          })
          .sort(
            (a, b) =>
              (a.textContent || "").length - (b.textContent || "").length
          )[0];
      };
      for (const needle of values) {
        find(needle)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }, needles);
    await sleep(900);

    // 2) Dessiner les cadres à la position finale.
    const rects = await page.evaluate((values) => {
      const find = (needle) => {
        const all = [...document.querySelectorAll("body *")];
        return all
          .filter((el) => {
            if (el.childElementCount !== 0) return false;
            if (!(el.textContent || "").includes(needle)) return false;
            const rect = el.getBoundingClientRect();
            return (
              rect.width > 12 &&
              rect.height > 8 &&
              el.offsetParent !== null &&
              (el.innerText || "").trim().length > 0
            );
          })
          .sort(
            (a, b) =>
              (a.textContent || "").length - (b.textContent || "").length
          )[0];
      };
      const boxes = [];
      for (const needle of values) {
        const el = find(needle);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) continue;
        boxes.push({
          x: Math.max(8, rect.left - 8),
          y: Math.max(8, rect.top - 8),
          w: Math.min(window.innerWidth - 16, rect.width + 16),
          h: Math.min(window.innerHeight - 16, rect.height + 16)
        });
      }
      const host = document.createElement("div");
      host.id = "nk-demo-highlight";
      host.setAttribute("data-nk-ignore", "");
      host.style.cssText =
        "position:fixed;inset:0;z-index:2147483645;pointer-events:none";
      for (const box of boxes) {
        const ring = document.createElement("div");
        ring.style.cssText = [
          "position:absolute",
          `left:${box.x}px`,
          `top:${box.y}px`,
          `width:${box.w}px`,
          `height:${box.h}px`,
          "border:3px solid #c9a45c",
          "border-radius:9px",
          "box-shadow:0 0 0 4px rgba(201,164,92,.18),0 8px 24px rgba(0,0,0,.18)"
        ].join(";");
        host.appendChild(ring);
      }
      document.documentElement.appendChild(host);
      return boxes.length;
    }, needles);
    await sleep(ms);
    await page.evaluate(() => {
      document.getElementById("nk-demo-highlight")?.remove();
    });
    return rects;
  }

  async function waitForToast(text, timeoutMs = 20000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const toast = await page.evaluate(() =>
        [...document.documentElement.children]
          .map((el) => el.shadowRoot?.querySelector(".toast")?.textContent || "")
          .join(" ")
      );
      if (toast.includes(text) || toast.includes("Traduction terminée")) return toast;
      await sleep(250);
    }
    return "";
  }

  let tab = null;
  try {
    await page.goto(siteUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page
      .waitForSelector("text=Safinum Pay", { timeout: 20000 })
      .catch(() => {});
    tab = await inject();
    await sleep(600);

    await titleCard(
      "SAFINUM Innovate 2026",
      "NkapLingua",
      [
        "Traduire une interface financière sans modifier le site.",
        "Démonstration automatique — packs embarqués, aucun serveur.",
        "Aucune donnée réelle."
      ],
      8000
    );

    await caption(
      tab,
      "Page SAFINUM en français : solde, frais et bénéficiaire."
    );
    await highlight(["250 000 FCFA", "Amina Ngo Bell"], 5000);
    await caption(tab, "L’extension lit uniquement les textes visibles.");
    await sleep(3000);
    await highlight(["250 000 FCFA"], 3500);

    await caption(
      tab,
      "Traduction en fulfulde — uniquement les packs embarqués."
    );
    await send(tab, { type: "NK_TRANSLATE_PAGE", target: "fub" });
    await waitForToast("Traduction terminée");
    await sleep(1200);
    await caption(
      tab,
      "Packs embarqués : aucun backend local, aucune requête cloud."
    );
    await sleep(2500);
    await page.evaluate(() =>
      window.scrollTo({ top: 420, behavior: "smooth" })
    );
    await sleep(3000);
    await highlight(["Jawdindi ndi yami", "250 000 FCFA"], 5000);
    await highlight(["CM 001 2345 6789 01", "Amina Ngo Bell"], 5000);

    await caption(tab, "Bascule en ewondo.");
    await send(tab, { type: "NK_RESTORE" });
    await sleep(900);
    await send(tab, { type: "NK_SET_TARGET", target: "ewo" });
    await send(tab, { type: "NK_TRANSLATE_PAGE", target: "ewo" });
    await waitForToast("Traduction terminée");
    await sleep(4200);

    await caption(tab, "Bascule en duala.");
    await send(tab, { type: "NK_RESTORE" });
    await sleep(900);
    await send(tab, { type: "NK_SET_TARGET", target: "dua" });
    await send(tab, { type: "NK_TRANSLATE_PAGE", target: "dua" });
    await waitForToast("Traduction terminée");
    await sleep(4200);

    await caption(
      tab,
      "Montants, compte, noms et avertissements sont préservés."
    );
    await highlight(["CM 001 2345 6789 01"], 4500);
    await highlight(["Amina Ngo Bell"], 3500);

    await caption(tab, "Retour à l’original : le site source reste intact.");
    await send(tab, { type: "NK_RESTORE" });
    await sleep(2600);
    await page.evaluate(() =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
    await sleep(1500);

    await send(tab, { type: "NK_SET_TARGET", target: "fub" });
    await page.evaluate(() => {
      const probe = document.createElement("p");
      probe.id = "nk-fallback-probe";
      probe.textContent =
        "Le solde est de 25 000 FCFA. Le vendeur arrive demain.";
      probe.style.cssText =
        "margin:88px 40px 12px;padding:14px 18px;background:#fff;border:2px solid #c9a45c;border-radius:10px;font:600 20px/1.4 'Noto Sans',system-ui,sans-serif;color:#123b2e";
      document.body.prepend(probe);
    });
    await caption(
      tab,
      "Texte inédit : phrase connue traduite, phrase inconnue laissée en français."
    );
    await sleep(1800);
    await send(tab, { type: "NK_TRANSLATE_PAGE", target: "fub" });
    await waitForToast("partielle");
    await sleep(1500);
    await highlight(["25 000 FCFA", "vendeur arrive"], 7000);
    await caption(
      tab,
      "Aucune traduction mot à mot : 1 traduction partielle annoncée."
    );
    await sleep(3500);
    await highlight(["Jawdindi ko", "vendeur arrive"], 5500);

    await send(tab, { type: "NK_RESTORE" });
    await sleep(500);
    await removeCaption();
    await titleCard(
      "Limites annoncées",
      "Des brouillons, pas une validation native",
      [
        "0 phrase validée par un panel natif indépendant.",
        "Niveau A : pack validé uniquement, sinon français conservé.",
        "Sans serveur : les phrases connues du pack sont traduites.",
        "Le cloud reste désactivé par défaut."
      ],
      9000
    );
    await titleCard(
      "NkapLingua",
      "Une couche de confiance pour l’inclusion financière",
      [
        "Sans modifier le site. Sans exposer les données sensibles.",
        "github.com/TSEFACKDEV/safinum-nkaplingua"
      ],
      7000);
  } finally {
    const video = page.video();
    await context.close();
    const recorded = video ? await video.path() : null;
    if (recorded && fs.existsSync(recorded)) {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-i",
          recorded,
          "-c:v",
          "libx264",
          "-preset",
          "medium",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          "-an",
          output
        ],
        { stdio: "inherit" }
      );
      console.log(`Screencast : ${output}`);
    } else {
      console.error("Aucune vidéo produite.");
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
