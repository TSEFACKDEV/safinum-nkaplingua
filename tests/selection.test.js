/**
 * Traduction d'une sélection : le texte entier doit être tenté avant le
 * découpage en phrases. Une entrée de pack peut contenir deux phrases.
 *
 * Fixtures fictives, fetch simulé.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const languagesSource = fs.readFileSync(
  path.join(root, "extension/languages.js"),
  "utf8"
);
const backgroundSource = fs.readFileSync(
  path.join(root, "extension/background.js"),
  "utf8"
);
const phrase =
  "Renseignez les informations du destinataire. Vérifiez toujours le numéro avant de valider.";
const fulfulde =
  "Lonndu kabaaru keɓoowo. Teeŋtu limre nde ko adii yoɓgol.";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground(entries) {
  let listener = null;
  globalThis.browser = undefined;
  globalThis.__NK_PACK_OVERRIDES__ = { fub: { entries } };
  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener: (fn) => (listener = fn) },
      getURL: (file) => `chrome-extension://test/${file}`
    },
    contextMenus: {
      removeAll: async () => {},
      create: async () => {},
      onClicked: { addListener() {} }
    },
    tabs: { sendMessage: async () => {}, query: async () => [] },
    scripting: { executeScript: async () => {} },
    storage: { local: { get: async () => ({}), set: async () => {} } }
  };
  globalThis.fetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
  eval(languagesSource);
  eval(backgroundSource);
  return (message) => new Promise((resolve) => listener(message, {}, resolve));
}

(async () => {
  // 1. La phrase entière est dans le pack : elle doit être trouvée.
  const send = createBackground([{ source: phrase, target: fulfulde, status: "draft" }]);
  const whole = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: phrase
  });
  assert(whole.translation?.ok, `phrase entière refusée : ${JSON.stringify(whole.translation)}`);
  assert(
    whole.translation.text === fulfulde,
    `traduction entière inattendue : ${whole.translation.text}`
  );
  assert(
    whole.translation.partial === undefined || whole.translation.partial === false,
    "phrase entière marquée partielle"
  );

  // 2. Si la phrase entière manque, le repli phrase par phrase reste actif.
  const fallback = createBackground([
    {
      source: "Renseignez les informations du destinataire.",
      target: "Lonndu kabaaru keɓoowo.",
      status: "draft"
    }
  ]);
  const partial = await fallback({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: phrase
  });
  assert(partial.translation?.ok, "repli partiel refusé");
  assert(partial.translation.partial === true, "repli non marqué partiel");
  assert(
    partial.translation.text.includes("Lonndu kabaaru keɓoowo."),
    "phrase connue non traduite dans le repli"
  );
  assert(
    partial.translation.text.includes("Vérifiez toujours le numéro avant de valider."),
    "phrase inconnue altérée"
  );

  console.log("selection OK — phrase entière puis repli phrase par phrase");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
