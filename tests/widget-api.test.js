/**
 * Intégration content.js → widget.js.
 *
 * Le widget ne doit s'activer que si l'API du content script est disponible,
 * et cette API doit exposer toutes les actions du panneau.
 *
 * Fixtures fictives, fetch simulé.
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const languages = fs.readFileSync(path.join(root, "extension/languages.js"), "utf8");
const content = fs.readFileSync(path.join(root, "extension/content.js"), "utf8");
const widget = fs.readFileSync(path.join(root, "extension/widget.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const dom = new JSDOM("<!doctype html><html lang=\"fr\"><body><p>Solde disponible</p></body></html>", {
  url: "https://example.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
window.chrome = {
  runtime: {
    onInstalled: { addListener() {} },
    onMessage: { addListener() {} },
    getURL: (file) => `chrome-extension://test/${file}`,
    sendMessage: async () => ({ ok: true })
  },
  storage: { local: { get: async () => ({}), set: async () => {} } },
  tabs: { query: async () => [], sendMessage: async () => {} },
  scripting: { executeScript: async () => {} },
  contextMenus: { removeAll: async () => {}, create: async () => {}, onClicked: { addListener() {} } }
};
window.fetch = async () => ({ ok: false, json: async () => ({}) });

window.eval(languages);
window.eval(content);

const api = window.__NK_WIDGET_API__;
assert(api, "API widget absente du content script");
for (const name of ["getLanguages", "getTarget", "getState", "getSelection", "setTarget", "translatePage", "restore", "translateSelection", "translateText"]) {
  assert(typeof api[name] === "function", `action manquante : ${name}`);
}
assert(api.getLanguages().length === 3, "trois langues attendues");
assert(api.getTarget().code === "fub", "langue initiale inattendue");

window.eval(widget);
assert(window.__NK_WIDGET__, "widget non initialisé");
const host = window.document.getElementById("nk-widget-host");
assert(host?.shadowRoot, "hôte Shadow DOM absent");
assert(host.shadowRoot.getElementById("launcher"), "launcher absent");

console.log("widget-api OK — intégration content script/widget, 3 langues, 9 actions");
