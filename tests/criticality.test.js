/**
 * M3 — politique niveau A.
 *
 * Un segment critique (solde, frais, PIN, confirmation, erreur…) ne doit
 * jamais partir au backend local ni au cloud : seul un pack validé peut le
 * traduire. Sinon l'original est conservé avec `untranslated_critical`.
 *
 * Fixtures fictives, fetch simulé.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/criticality.test.js
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const languagesSource = read("extension/languages.js");
const backgroundSource = read("extension/background.js");

const CLOUD_HOST = "api.mymemory.translated.net";
const LOCAL_TRANSLATE = "127.0.0.1:8000/translate";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground(storage) {
  const calls = [];
  let listener = null;

  const chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener(fn) { listener = fn; } },
      getURL: (pack) => `chrome-extension://test/${pack}`
    },
    contextMenus: {
      removeAll: () => Promise.resolve(),
      create: () => Promise.resolve(),
      onClicked: { addListener() {} }
    },
    tabs: {
      sendMessage: () => Promise.resolve(),
      query: () => Promise.resolve([])
    },
    scripting: { executeScript: () => Promise.resolve() },
    storage: {
      local: {
        get: async () => storage,
        set: async () => {}
      }
    }
  };

  globalThis.browser = undefined;
  globalThis.chrome = chrome;
  globalThis.__NK_PACK_OVERRIDES__ = {};
  globalThis.fetch = async (url) => {
    const value = String(url);
    calls.push(value);

    if (value.includes(CLOUD_HOST)) {
      return {
        ok: true,
        json: async () => ({
          responseStatus: 200,
          responseData: { translatedText: "Nde nje woni.", match: 1 }
        })
      };
    }
    if (value.includes("127.0.0.1:8000/health")) {
      return { ok: false, json: async () => ({}) };
    }
    return { ok: false, json: async () => ({}) };
  };

  eval(languagesSource);
  eval(backgroundSource);

  const send = (message) =>
    new Promise((resolve) => listener(message, {}, resolve));
  return { send, calls, overrides: globalThis.__NK_PACK_OVERRIDES__ };
}

async function main() {
  // 1. Niveau A absent du pack ewo : original, raison explicite, zéro réseau.
  const missingPack = createBackground({});
  missingPack.overrides.ewo = { entries: [] };
  const missingResponse = await missingPack.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "ewo",
    source: "fr",
    segments: [{ id: "a0", text: "Votre solde est disponible." }]
  });
  const missing = missingResponse.translations?.[0];
  assert(
    missing?.ok === false && missing.reason === "untranslated_critical",
    `niveau A non bloqué : ${JSON.stringify(missingResponse)}`
  );
  assert(
    missing.text === "Votre solde est disponible.",
    `original non conservé : ${JSON.stringify(missing)}`
  );
  assert(
    missingPack.calls.length === 0,
    `réseau sur un niveau A absent du pack : ${missingPack.calls.join(", ")}`
  );

  // 2. Niveau A présent et validé dans le pack : traduction pack.
  const presentPack = createBackground({});
  presentPack.overrides.ewo = {
    entries: [
      {
        source: "Votre solde est disponible.",
        target: "Nde nje woni.",
        status: "validated"
      }
    ]
  };
  const presentResponse = await presentPack.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "ewo",
    source: "fr",
    segments: [{ id: "a1", text: "Votre solde est disponible." }]
  });
  assert(
    presentResponse.translations?.[0]?.ok === true &&
      presentResponse.translations[0].text === "Nde nje woni.",
    `pack validé non appliqué : ${JSON.stringify(presentResponse)}`
  );
  assert(
    presentPack.calls.length === 0,
    `réseau sur un hit de pack : ${presentPack.calls.join(", ")}`
  );

  // 3. Niveau A, cible MT et cloud autorisé : aucun appel MT.
  const criticalMl = createBackground({ nkCloudFallback: true });
  const criticalResponse = await criticalMl.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "fub",
    source: "fr",
    segments: [
      { id: "a2", text: "Les frais sont de 1 000 FCFA." },
      { id: "b2", text: "Le total est de 25 000 FCFA." }
    ]
  });
  for (const translation of criticalResponse.translations || []) {
    assert(
      translation.reason === "untranslated_critical",
      `niveau A traduit par MT : ${JSON.stringify(translation)}`
    );
  }
  assert(
    !criticalMl.calls.some(
      (url) => url.includes(CLOUD_HOST) || url.includes(LOCAL_TRANSLATE)
    ),
    `appel MT sur niveau A : ${criticalMl.calls.join(", ")}`
  );

  // 4. Niveau B avec opt-in : la MT reste autorisée et étiquetée.
  const nonCritical = createBackground({ nkCloudFallback: true });
  const nonCriticalResponse = await nonCritical.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "fub",
    source: "fr",
    segments: [{ id: "b3", text: "Bonjour, merci beaucoup." }]
  });
  assert(
    nonCritical.calls.some((url) => url.includes(CLOUD_HOST)),
    "niveau B non envoyé à la MT alors que le cloud est autorisé"
  );
  assert(
    nonCriticalResponse.translations?.[0]?.ok === true,
    `niveau B refusé : ${JSON.stringify(nonCriticalResponse)}`
  );

  // 5. Mode démo SAFINUM : la phrase critique peut passer en MT, mais elle
  //    est explicitement marquée `demoCritical` (jamais « validée »).
  const demo = createBackground({ nkCloudFallback: true });
  const demoResponse = await demo.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "fub",
    source: "fr",
    demo: true,
    segments: [{ id: "d1", text: "Votre solde est disponible." }]
  });
  assert(
    demoResponse.translations?.[0]?.ok === true,
    `mode démo : traduction refusée ${JSON.stringify(demoResponse)}`
  );
  assert(
    demoResponse.translations[0].demoCritical === true,
    "mode démo : marqueur demoCritical absent"
  );
  assert(
    demo.calls.some((url) => url.includes(CLOUD_HOST)),
    "mode démo : la MT n’a pas été appelée"
  );

  console.log(
    "criticality OK — niveau A pack-only, zéro MT, niveau B autorisé, démo étiquetée"
  );
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
