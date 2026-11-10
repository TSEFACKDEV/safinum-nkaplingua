/**
 * Actions du popup : busy, succès réel, erreur réelle (pas de faux succès).
 * Fixtures fictives, JSDOM.
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "extension/popup.html"), "utf8");
const read = (f) => fs.readFileSync(path.join(root, "extension", f), "utf8");
let reply = { ok: true, translated: 3, untranslated: 0 };

const dom = new JSDOM(html, {
  url: "chrome-extension://test/popup.html",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
window.chrome = {
  runtime: { onMessage: { addListener() {} }, sendMessage: async () => ({}) },
  tabs: {
    query: async () => [{ id: 1 }],
    sendMessage: async (id, message) => {
      if (message.type === "NK_GET_STATE") return { ok: true, translated: 0 };
      return reply;
    }
  },
  scripting: { executeScript: async () => [{}] },
  storage: { local: { get: async () => ({}), set: async () => {} } }
};
window.eval(read("ui-copy.js"));
window.eval(read("languages.js"));
window.eval(read("popup.js"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  await wait(80);
  const button = window.document.getElementById("restore");
  reply = { ok: false, error: "Aucune traduction à restaurer." };
  button.click();
  await wait(80);
  assert(button.disabled === false, "bouton resté désactivé après erreur");
  assert(
    window.document.getElementById("status").textContent.includes("Aucune traduction"),
    "erreur de restauration non affichée"
  );

  reply = { ok: true, translated: 3, untranslated: 0 };
  window.document.getElementById("translatePage").click();
  await wait(80);
  assert(
    window.document.getElementById("status").textContent.includes("3 passage(s)"),
    "succès réel non affiché"
  );
  assert(
    window.document.getElementById("status").dataset.tone === "ok",
    "succès marqué en erreur"
  );

  reply = { ok: false, error: "Sélectionnez d'abord du texte." };
  window.document.getElementById("translateSelection").click();
  await wait(80);
  assert(
    window.document.getElementById("status").textContent.includes("Sélectionnez"),
    "no-op de sélection non signalé"
  );

  console.log("popup-actions OK — busy, succès et no-op réels");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
