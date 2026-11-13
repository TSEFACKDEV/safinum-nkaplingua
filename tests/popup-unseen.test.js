/**
 * Popup — texte inédit partiel ou absent du pack.
 *
 * Vérifie qu'une phrase inconnue n'est pas présentée comme une panne :
 * le popup explique ce qui reste en français, sans erreur rouge.
 *
 * Fixtures fictives, JSDOM.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/popup-unseen.test.js
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

let reply = null;

const dom = new JSDOM(html, {
  url: "chrome-extension://test/popup.html",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
window.chrome = {
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async () => reply
  },
  tabs: {
    query: async () => [{ id: 1 }],
    sendMessage: async () => ({ ok: true })
  },
  scripting: { executeScript: async () => ({}) },
  storage: { local: { get: async () => ({}), set: async () => {} } }
};
window.eval(read("extension/ui-copy.js"));
window.eval(read("extension/languages.js"));
window.eval(read("extension/popup.js"));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  await wait(80);
  const doc = window.document;
  doc.getElementById("unseen").value =
    "Le vendeur arrive demain. Cette phrase est totalement inconnue.";

  // 1. Repli partiel : une phrase traduite, une laissée en français.
  reply = {
    provider: "pack",
    detected: { code: "fr", confidence: 0.96 },
    translation: {
      ok: true,
      text: "Jaɓɓoowo garannde subaka. Cette phrase est totalement inconnue.",
      partial: true,
      translatedSentences: 1,
      keptSentences: 1,
      totalSentences: 2
    }
  };
  doc.getElementById("translateText").click();
  await wait(80);

  assert(
    doc.getElementById("result").textContent.includes("Jaɓɓoowo"),
    "traduction partielle absente"
  );
  assert(
    doc.getElementById("resultMeta").textContent.includes("1 phrase(s) sur 2"),
    `explication partielle absente : ${doc.getElementById("resultMeta").textContent}`
  );
  assert(
    doc.getElementById("testError").hidden,
    "repli partiel affiché comme une erreur"
  );
  assert(
    doc.getElementById("status").textContent.includes("1 phrase(s) restent"),
    `statut partiel absent : ${doc.getElementById("status").textContent}`
  );

  // 2. Phrase absente du pack : explication neutre, pas d'erreur rouge.
  reply = {
    provider: null,
    detected: { code: "fr", confidence: 0.96 },
    translation: {
      ok: false,
      reason: "pack_miss",
      text: "Cette phrase est totalement inconnue."
    }
  };
  doc.getElementById("translateText").click();
  await wait(80);

  assert(
    doc.getElementById("resultMeta").textContent.includes("pas encore disponible"),
    `explication d'absence absente : ${doc.getElementById("resultMeta").textContent}`
  );
  assert(
    doc.getElementById("testError").hidden,
    "phrase absente affichée comme une erreur rouge"
  );
  assert(
    doc.getElementById("status").textContent.includes("laissé en français"),
    `statut d'absence absent : ${doc.getElementById("status").textContent}`
  );

  console.log(
    "popup-unseen OK — repli expliqué sans erreur rouge"
  );
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
