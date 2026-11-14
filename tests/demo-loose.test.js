/**
 * Démo publique : accepter le brut NLLB sur round-trip faible pour que la
 * page FINAKA soit entièrement lisible. Hors démo, le refus reste strict.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const languagesSource = fs.readFileSync(path.join(root, "extension/languages.js"), "utf8");
const backgroundSource = fs.readFileSync(path.join(root, "extension/background.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground() {
  let listener = null;
  globalThis.browser = undefined;
  globalThis.__NK_PACK_OVERRIDES__ = { fub: { entries: [] } };
  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener: (fn) => (listener = fn) },
      getURL: (file) => `chrome-extension://test/${file}`
    },
    contextMenus: { removeAll: async () => {}, create: async () => {}, onClicked: { addListener() {} } },
    tabs: { sendMessage: async () => {}, query: async () => [] },
    scripting: { executeScript: async () => {} },
    storage: { local: { get: async () => ({}), set: async () => {} } }
  };
  globalThis.fetch = async (url, init) => {
    const value = String(url);
    if (value.includes("/health")) {
      return { ok: true, json: async () => ({ loaded: true }) };
    }
    if (value.includes("/translate")) {
      const body = JSON.parse((init && init.body) || "{}");
      return {
        ok: true,
        json: async () => ({
          provider: "nllb",
          translations: (body.segments || []).map((segment) => ({
            id: segment.id,
            text: `[demo] ${segment.text}`,
            ok: false,
            reason: "low_roundtrip:0.2"
          }))
        })
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  eval(languagesSource);
  eval(backgroundSource);
  return (message) => new Promise((resolve) => listener(message, {}, resolve));
}

(async () => {
  const send = createBackground();
  const demo = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Vue d’ensemble",
    demo: true,
    looseDemo: true
  });
  assert(
    demo.translation?.ok === true,
    `démo publique non traduite : ${JSON.stringify(demo.translation)}`
  );
  assert(
    demo.translation.text.includes("[demo]"),
    "traduction brute non appliquée"
  );

  const strict = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Vue d’ensemble",
    demo: true,
    looseDemo: false
  });
  assert(
    strict.translation?.ok === false,
    "qualité faible acceptée hors démo publique"
  );

  console.log("demo-loose OK — démo publique lisible, strict préservé");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
