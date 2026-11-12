/**
 * Reçu de traduction — popup.
 *
 * Vérifie l'affichage des compteurs, l'étiquette du moteur, la note
 * « brouillons » et le masquage à la restauration.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/receipt.test.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("extension/popup.html");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadPopup() {
  const dom = new JSDOM(html, {
    url: "chrome-extension://test/popup.html",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  let listener = null;
  window.chrome = {
    runtime: {
      onMessage: { addListener: (fn) => (listener = fn) },
      sendMessage: async () => ({ ok: true })
    },
    storage: { local: { get: async () => ({}), set: async () => {} } },
    tabs: { query: async () => [{ id: 1 }], sendMessage: async () => ({ ok: true }) },
    scripting: { executeScript: async () => {} }
  };
  window.eval(read("extension/ui-copy.js"));
  window.eval(read("extension/languages.js"));
  window.eval(read("extension/popup.js"));
  return { window, send: (message) => listener(message) };
}

(async () => {
  const popup = loadPopup();
  await new Promise((resolve) => setTimeout(resolve, 80));
  const doc = popup.window.document;

  popup.send({
    type: "NK_TRANSLATION_SUMMARY",
    summary: {
      label: "Fulfulde (Adamawa)",
      translated: 188,
      human: 30,
      demo: 0,
      untranslated: 0,
      partial: 2,
      truncated: false,
      simple: true,
      provider: "pack"
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 40));

  const receipt = doc.getElementById("receipt");
  assert(!receipt.hidden, "reçu masqué");
  assert(doc.getElementById("receiptTranslated").textContent === "188", "traduits");
  assert(doc.getElementById("receiptPartial").textContent === "2", "partiels");
  assert(doc.getElementById("receiptUnverified").textContent === "30", "non validés");
  assert(
    doc.getElementById("receiptEngine").textContent.includes("pack"),
    `moteur inattendu : ${doc.getElementById("receiptEngine").textContent}`
  );
  assert(
    doc.getElementById("receiptNote").textContent.includes("non validées"),
    `note brouillon absente : ${doc.getElementById("receiptNote").textContent}`
  );

  doc.getElementById("restore").click();
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert(doc.getElementById("receipt").hidden, "reçu encore visible après restauration");

  popup.send({
    type: "NK_TRANSLATION_SUMMARY",
    summary: { translated: 0 }
  });
  assert(doc.getElementById("receipt").hidden, "reçu visible sans traduction");

  console.log("receipt OK — compteurs, moteur, note et masquage");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
