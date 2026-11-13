/**
 * Comportement d'état du content script.
 *
 * Vérifie que le popup peut savoir si une page est traduite, que le changement
 * de langue retraduit, et que restaurer/sélectionner ne renvoie pas un faux
 * succès. Fixtures fictives.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const languagesSource = fs.readFileSync(
  path.join(root, "extension/languages.js"),
  "utf8"
);
const contentSource = fs.readFileSync(
  path.join(root, "extension/content.js"),
  "utf8"
);

const dom = new JSDOM(
  `<!doctype html><html lang="fr"><head><title>Test état</title></head><body>
    <h1>Solde disponible</h1>
    <p>Le solde est de 125 000 FCFA.</p>
    <p>Le bénéficiaire reçoit 25 000 FCFA.</p>
  </body></html>`,
  {
    url: "https://example.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  }
);
const { window } = dom;
let listener = null;

window.chrome = {
  runtime: {
    onMessage: { addListener: (fn) => (listener = fn) },
    sendMessage: async (message) => {
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        return {
          provider: "local",
          translations: message.segments.map((segment) => ({
            id: segment.id,
            text: `XX ${segment.text}`,
            ok: true
          }))
        };
      }
      if (message.type === "NK_TRANSLATE_TEXT") {
        return {
          provider: "local",
          translation: { ok: true, text: `XX ${message.text}` },
          detected: { code: "fr", confidence: 0.9 }
        };
      }
      return {};
    }
  },
  storage: {
    local: {
      get: async () => ({}),
      set: async () => {}
    }
  }
};

window.eval(languagesSource);
window.eval(contentSource);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function send(message) {
  return new Promise((resolve) => listener(message, {}, resolve));
}

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));

  const empty = await send({ type: "NK_GET_STATE" });
  assert(empty.translated === 0, "état initial non vide");

  const first = await send({ type: "NK_TRANSLATE_PAGE", target: "fub" });
  assert(first.ok === true && first.translated > 0, "traduction initiale absente");

  const translated = await send({ type: "NK_GET_STATE" });
  assert(translated.translated > 0, "état traduit non exposé");
  assert(translated.target === "fub", "cible initiale incorrecte");
  assert(
    translated.summary && translated.summary.translated === translated.translated,
    "reçu absent de l’état exposé au popup"
  );

  const switched = await send({ type: "NK_SET_TARGET", target: "ewo" });
  assert(switched.ok === true && switched.retranslating === true, "retraduction non annoncée");
  await new Promise((resolve) => setTimeout(resolve, 700));
  const afterSwitch = await send({ type: "NK_GET_STATE" });
  assert(afterSwitch.target === "ewo", "cible non appliquée");
  assert(afterSwitch.translated > 0, "page non retraduite après changement de langue");

  const restore = await send({ type: "NK_RESTORE" });
  assert(restore.ok === true, "restauration refusée");
  const afterRestore = await send({ type: "NK_GET_STATE" });
  assert(afterRestore.translated === 0, "état non restauré");

  const secondRestore = await send({ type: "NK_RESTORE" });
  assert(secondRestore.ok === false, "restauration vide annoncée comme succès");

  const selection = await send({ type: "NK_TRANSLATE_SELECTION", target: "fub" });
  assert(selection.ok === false, "sélection vide annoncée comme succès");

  console.log("state OK — état, retraduction et refus des no-op");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
