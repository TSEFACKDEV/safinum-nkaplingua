/**
 * Démo publique : l'overlay FINAKA doit traduire la page sans backend.
 *
 * Fixture : le vrai HTML de demo/index.html, les vrais packs + l'overlay,
 * un runtime simulé qui fait la recherche exacte. Aucun réseau.
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fub = JSON.parse(read("extension/language-packs/fub.json"));
const overlay = JSON.parse(read("extension/demo/fub-demo.json"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const translations = new Map();
for (const entry of [...fub.entries, ...overlay.entries]) {
  const source = normalize(entry.source);
  if (source) translations.set(source, entry.target);
}

const dom = new JSDOM(read("demo/index.html"), {
  url: "https://tsefackdev.github.io/safinum-nkaplingua/demo/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const { window } = dom;
let listener = null;
window.chrome = {
  runtime: {
    onInstalled: { addListener() {} },
    onMessage: { addListener: (fn) => (listener = fn) },
    getURL: (file) => `chrome-extension://test/${file}`,
    sendMessage: async (message) => {
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        return {
          provider: "pack",
          detected: { code: "fr", confidence: 0.9 },
          translations: message.segments.map((segment) => {
            const target = translations.get(normalize(segment.text));
            return target
              ? {
                  id: segment.id,
                  text: target,
                  ok: true,
                  packStatus: "draft",
                  humanReviewed: true
                }
              : {
                  id: segment.id,
                  text: segment.text,
                  ok: false,
                  reason: "pack_miss"
                };
          })
        };
      }
      if (message.type === "NK_TRANSLATE_TEXT") {
        return {
          provider: "pack",
          translation: {
            id: "text",
            text: translations.get(normalize(message.text)) || message.text,
            ok: translations.has(normalize(message.text))
          }
        };
      }
      return { ok: true };
    }
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {}
    }
  }
};
window.eval(read("extension/languages.js"));
window.eval(read("extension/content.js"));

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert(typeof listener === "function", "listener content absent");
  await new Promise((resolve) => {
    listener({ type: "NK_TRANSLATE_PAGE", target: "fub" }, {}, resolve);
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const text = window.document.body.textContent;
  assert(text.includes("Winndannde yeeso"), "Vue d’ensemble non traduite");
  assert(text.includes("Jaɓɓorgo Kewuuji"), "Transferts non traduits");
  assert(text.includes("Jam tiiɗi, Aïcha."), "salutation démo non traduite");
  const count = window.document.querySelectorAll("[data-nk-translated]").length;
  assert(count >= 50, `trop peu de nœuds traduits : ${count}`);

  console.log(`demo-page OK — ${count} nœuds traduits, overlay sans backend`);
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
