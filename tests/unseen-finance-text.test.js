/**
 * Texte inédit — phrase courante avec un mot financier.
 *
 * « Votre transfert est en cours » ou « Les frais sont de 1 000 FCFA »
 * ne doivent pas être bloqués par la règle niveau A stricte. Les vraies
 * alertes (PIN, solde insuffisant, blocage) restent conservées.
 *
 * Fixtures fictives, fetch simulé.
 */

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------
// Un texte courant contenant un mot du domaine financier ne doit pas être
// bloqué par la règle du niveau A stricte (« transfert », « frais »,
// « compte »). Le moteur local reçoit la phrase ; les vraies alertes
// (PIN, solde insuffisant, blocage) restent conservées en français.
// ---------------------------------------------------------------------
(async () => {
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

  let listener = null;
  globalThis.browser = undefined;
  globalThis.__NK_PACK_OVERRIDES__ = { fub: { entries: [] }, ewo: { entries: [] } };
  globalThis.chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener: (fn) => (listener = fn) },
      getURL: (pack) => `chrome-extension://test/${pack}`
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
      // Le moteur réel restitue les jetons ; le mock doit faire pareil,
      // sinon la garde anti-perte de montant refuse à juste titre.
      const body = JSON.parse((init && init.body) || "{}");
      const translations = (body.segments || []).map((segment) => ({
        id: segment.id,
        text: `[local] ${segment.text}`,
        ok: true
      }));
      return {
        ok: true,
        json: async () => ({ provider: "local", translations })
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  eval(languagesSource);
  eval(backgroundSource);
  const send = (message) =>
    new Promise((resolve) => listener(message, {}, resolve));

  for (const [target, text] of [
    ["fub", "Votre transfert est en cours de traitement."],
    ["fub", "Les frais de transfert sont de 1 000 FCFA."],
    ["ewo", "Votre transfert est en cours de traitement."],
    ["ewo", "Les frais de transfert sont de 1 000 FCFA."]
  ]) {
    const response = await send({ type: "NK_TRANSLATE_TEXT", target, text });
    if (response.error) {
      throw new Error(`${target} « ${text} » bloqué : ${response.error}`);
    }
    if (!response.translation?.ok) {
      throw new Error(
        `${target} « ${text} » non traduit : ${JSON.stringify(response.translation)}`
      );
    }
  }

  for (const text of [
    "Ne partagez jamais votre code PIN.",
    "Solde insuffisant pour effectuer ce transfert.",
    "Ce compte a été bloqué."
  ]) {
    const response = await send({ type: "NK_TRANSLATE_TEXT", target: "fub", text });
    if (response.translation?.reason !== "untranslated_critical") {
      throw new Error(`alerte traduite à tort : « ${text} »`);
    }
  }

  console.log(
    "unseen-text OK — texte courant traduit, alertes sensibles conservées"
  );
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
