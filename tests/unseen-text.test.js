/**
 * Texte inédit — repli phrase par phrase.
 *
 * Un paragraphe absent du pack ne doit pas faire échouer tout le texte :
 * les phrases connues sont traduites, les autres restent en français.
 * Aucune substitution mot à mot.
 *
 * Fixtures fictives, fetch simulé.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/unseen-text.test.js
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const languagesSource = read("extension/languages.js");
const backgroundSource = read("extension/background.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground() {
  let listener = null;
  globalThis.browser = undefined;
  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: {
        addListener(fn) {
          listener = fn;
        }
      },
      getURL: (pack) => `chrome-extension://test/${pack}`
    },
    contextMenus: {
      removeAll: () => Promise.resolve(),
      create: () => Promise.resolve(),
      onClicked: { addListener() {} }
    },
    tabs: { sendMessage: () => Promise.resolve(), query: () => Promise.resolve([]) },
    scripting: { executeScript: () => Promise.resolve() },
    storage: { local: { get: async () => ({}), set: async () => {} } }
  };
  globalThis.__NK_PACK_OVERRIDES__ = {
    fub: {
      entries: [
        {
          source: "Le vendeur arrive demain.",
          target: "Jaɓɓoowo garannde subaka.",
          status: "draft"
        },
        {
          source: "Le client arrive demain.",
          target: "Soobu garannde subaka.",
          status: "draft"
        }
      ]
    }
  };
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });

  eval(languagesSource);
  eval(backgroundSource);

  return (message) =>
    new Promise((resolve) => listener(message, {}, resolve));
}

(async () => {
  const send = createBackground();

  // 1. Deux phrases connues : tout est traduit.
  const full = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Le vendeur arrive demain. Le client arrive demain."
  });
  assert(full.translation.ok, "traduction complète refusée");
  assert(full.translation.partial === false, "texte complet marqué partiel");
  assert(
    full.translation.text ===
      "Jaɓɓoowo garannde subaka. Soobu garannde subaka.",
    `traduction complète inattendue : ${full.translation.text}`
  );

  // 2. Une phrase connue + une inconnue : la connue est traduite, l'autre
  //    reste en français, sans mot à mot.
  const partial = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Le vendeur arrive demain. Cette phrase est totalement inconnue."
  });
  assert(partial.translation.ok, "repli partiel refusé");
  assert(partial.translation.partial === true, "repli non marqué partiel");
  assert(
    partial.translation.translatedSentences === 1 &&
      partial.translation.keptSentences === 1,
    "compteurs du repli incorrects"
  );
  assert(
    partial.translation.text ===
      "Jaɓɓoowo garannde subaka. Cette phrase est totalement inconnue.",
    `repli inattendu : ${partial.translation.text}`
  );

  // 3. Aucune phrase connue : rien n'est inventé, le texte reste en français.
  const missing = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Cette phrase est totalement inconnue."
  });
  assert(!missing.translation.ok, "phrase inconnue traduite à tort");
  assert(
    missing.translation.reason === "pack_miss",
    `raison inattendue : ${missing.translation.reason}`
  );
  assert(
    missing.translation.text === "Cette phrase est totalement inconnue.",
    "texte inconnu modifié"
  );

  // 4. Une phrase critique absente reste en français, l'autre est traduite.
  const critical = await send({
    type: "NK_TRANSLATE_TEXT",
    target: "fub",
    text: "Le solde est de 25 000 FCFA. Le vendeur arrive demain."
  });
  assert(critical.translation.ok, "repli critique refusé");
  assert(
    critical.translation.text.startsWith("Le solde est de 25 000 FCFA."),
    `phrase critique modifiée : ${critical.translation.text}`
  );
  assert(
    critical.translation.text.includes("Jaɓɓoowo garannde subaka."),
    "phrase connue non traduite après une critique"
  );

  console.log(
    "unseen-text OK — phrases connues traduites, inconnues laissées en français"
  );
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
