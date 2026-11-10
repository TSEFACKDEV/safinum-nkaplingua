import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const popup = pathToFileURL(path.join(root, "extension", "popup.html")).href;
const outDir = path.join(root, "docs", "assets");
const open = process.argv.includes("--open");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: !open });
const page = await browser.newPage({
  viewport: { width: 380, height: 600 },
  deviceScaleFactor: 2
});

const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

await page.addInitScript(() => {
  const storage = { nkTarget: "fub", nkCloudFallback: true };
  window.chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async (message) => {
        if (message?.type === "NK_TRANSLATE_TEXT") {
          return {
            provider: "pack",
            detected: { code: "fr", confidence: 0.96 },
            translation: {
              ok: true,
              text: "Fedde ndee ko 125 000 FCFA.",
              roundtrip: null
            }
          };
        }
        return {};
      }
    },
    tabs: {
      query: async () => [{ id: 1 }],
      sendMessage: async () => ({ ok: true })
    },
    scripting: { executeScript: async () => ({}) },
    storage: {
      local: {
        get: async (key) =>
          typeof key === "string" ? { [key]: storage[key] } : { ...storage },
        set: async (values) => Object.assign(storage, values)
      }
    }
  };
});

await page.goto(popup, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(200);

const closed = await page.evaluate(() => ({
  bodyHeight: document.body.scrollHeight,
  bodyWidth: document.body.scrollWidth,
  viewportHeight: window.innerHeight,
  viewportWidth: window.innerWidth,
  footBottom: document.querySelector(".foot")?.getBoundingClientRect().bottom
}));

await page.screenshot({
  path: path.join(outDir, "popup-redesign.png"),
  clip: { x: 0, y: 0, width: 380, height: Math.ceil(closed.bodyHeight) }
});
fs.copyFileSync(
  path.join(outDir, "popup-redesign.png"),
  path.join(outDir, "popup.png")
);
await page.screenshot({
  path: path.join(outDir, "popup-redesign-full.png"),
  fullPage: true
});

await page.click("#languageButton");
await page.waitForTimeout(80);
const listHeight = await page.evaluate(() => document.body.scrollHeight);
await page.screenshot({
  path: path.join(outDir, "popup-redesign-list.png"),
  clip: { x: 0, y: 0, width: 380, height: Math.ceil(listHeight) }
});
await page.click('.lang-option[data-code="ewo"]');
await page.waitForTimeout(120);
const ewoHeight = await page.evaluate(() => document.body.scrollHeight);
await page.screenshot({
  path: path.join(outDir, "popup-redesign-ewo.png"),
  clip: { x: 0, y: 0, width: 380, height: Math.ceil(ewoHeight) }
});
await page.click("#languageButton");
await page.click('.lang-option[data-code="fub"]');

await page.click(".test > summary");
await page.fill("#unseen", "Le solde minimum est de 5 000 FCFA.");
await page.click("#translateText");
await page.waitForTimeout(200);

const expanded = await page.evaluate(() => ({
  bodyHeight: document.body.scrollHeight,
  bodyWidth: document.body.scrollWidth,
  result: document.querySelector("#result")?.textContent,
  meta: document.querySelector("#resultMeta")?.textContent
}));
await page.screenshot({
  path: path.join(outDir, "popup-redesign-test.png"),
  fullPage: true
});
await page.reload({ waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

await page.click(".privacy > summary");
await page.waitForTimeout(120);
const privacy = await page.evaluate(() => ({
  bodyHeight: document.body.scrollHeight,
  bodyWidth: document.body.scrollWidth,
  panelWidth: document.querySelector(".privacy-body")?.getBoundingClientRect().width
}));
await page.screenshot({
  path: path.join(outDir, "popup-redesign-privacy.png"),
  fullPage: true
});
await page.click(".privacy > summary");

await page.reload({ waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.click(".test > summary");
await page.fill("#unseen", "");
await page.click("#translateText");
await page.waitForTimeout(100);
const errorState = await page.evaluate(() => ({
  status: document.querySelector("#status")?.textContent,
  tone: document.querySelector("#status")?.dataset.tone
}));
await page.screenshot({
  path: path.join(outDir, "popup-redesign-error.png"),
  fullPage: true
});
await page.click(".test > summary");

await page.reload({ waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.setViewportSize({ width: 800, height: 800 });
await page.screenshot({
  path: path.join(outDir, "popup-redesign-wide.png"),
  fullPage: true
});

console.log(JSON.stringify({ closed, expanded, privacy, errorState, errors }, null, 2));

if (open) {
  console.log("Aperçu ouvert. Ferme la fenêtre pour terminer.");
  await new Promise((resolve) => page.once("close", resolve));
}

await browser.close();
