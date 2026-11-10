/**
 * M2 — verrou cloud et défaut local-only.
 *
 * 1. Un pack validé répond sans aucune requête réseau.
 * 2. Sans choix explicite, MyMemory n'est jamais appelé.
 * 3. Avec `nkCloudFallback: true`, MyMemory est appelé.
 * 4. La case du popup est décochée par défaut et respecte l'opt-in.
 *
 * Fixtures fictives ; aucun appel réseau réel (fetch est simulé).
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/cloud-gating.test.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const languagesSource = read("extension/languages.js");
const backgroundSource = read("extension/background.js");
const popupSource = read("extension/popup.js");
const popupHtml = read("extension/popup.html");

const CLOUD_HOST = "api.mymemory.translated.net";
const CLOUD_TRANSLATION = "Nde nje woni.";

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
          responseData: { translatedText: CLOUD_TRANSLATION, match: 1 }
        })
      };
    }
    if (value.includes("127.0.0.1:8000/health")) {
      return { ok: false, json: async () => ({}) };
    }
    return { ok: false, json: async () => ({}) };
  };

  // Évaluer languages.js puis background.js dans la portée locale : chaque
  // appel repart avec un cache et un état neufs.
  eval(languagesSource);
  eval(backgroundSource);

  const send = (message) =>
    new Promise((resolve) => listener(message, {}, resolve));
  return { send, calls, overrides: globalThis.__NK_PACK_OVERRIDES__ };
}

function loadPopup(storage) {
  const dom = new JSDOM(popupHtml, {
    url: "https://example.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.chrome = {
    storage: {
      local: {
        get: async () => storage,
        set: async () => {}
      }
    },
    tabs: {
      query: async () => [{}],
      sendMessage: async () => ({})
    },
    scripting: { executeScript: async () => {} },
    runtime: {
      sendMessage: async () => ({}),
      onMessage: { addListener() {} }
    }
  };
  window.eval(languagesSource);
  window.eval(popupSource);
  return window;
}

async function main() {
  // 1. Pack hit : provider pack, aucune requête réseau.
  const packBackground = createBackground({});
  packBackground.overrides.ewo = {
    entries: [
      {
        source: "Votre solde est disponible.",
        target: "Nde nje woni.",
        status: "validated"
      }
    ]
  };
  const packResponse = await packBackground.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "ewo",
    source: "fr",
    segments: [{ id: "s0", text: "Votre solde est disponible." }]
  });
  assert(
    packResponse.provider === "pack",
    `pack attendu, reçu ${JSON.stringify(packResponse)}`
  );
  assert(
    packResponse.translations?.[0]?.ok === true,
    `traduction pack refusée : ${JSON.stringify(packResponse.translations)}`
  );
  assert(
    packBackground.calls.length === 0,
    `requête(s) réseau sur un hit de pack : ${packBackground.calls.join(", ")}`
  );

  // 2. Sans choix explicite : aucun appel cloud.
  const defaultBackground = createBackground({});
  const defaultResponse = await defaultBackground.send({
    type: "NK_TRANSLATE_TEXT",
    text: "Bonjour, merci beaucoup.",
    target: "fub",
    source: "fr"
  });
  assert(
    !defaultBackground.calls.some((url) => url.includes(CLOUD_HOST)),
    `MyMemory appelé sans opt-in : ${defaultBackground.calls.join(", ")}`
  );
  assert(
    !defaultResponse.translation && defaultResponse.error,
    `un moteur a répondu sans opt-in : ${JSON.stringify(defaultResponse)}`
  );

  // 3. Opt-in explicite : MyMemory est appelé.
  const optInBackground = createBackground({ nkCloudFallback: true });
  const optInResponse = await optInBackground.send({
    type: "NK_TRANSLATE_TEXT",
    text: "Bonjour, merci beaucoup.",
    target: "fub",
    source: "fr"
  });
  assert(
    optInBackground.calls.some((url) => url.includes(CLOUD_HOST)),
    "MyMemory non appelé malgré l'opt-in"
  );
  assert(
    optInResponse.translation?.ok === true,
    `traduction cloud refusée : ${JSON.stringify(optInResponse)}`
  );

  // 4. Popup : décoché par défaut, coché seulement si opt-in stocké.
  const popupDefault = loadPopup({});
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(
    popupDefault.document.getElementById("cloudFallback").checked === false,
    "la case cloud est cochée sans opt-in"
  );

  const popupOptIn = loadPopup({ nkCloudFallback: true });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert(
    popupOptIn.document.getElementById("cloudFallback").checked === true,
    "la case cloud n'est pas cochée alors que l'opt-in est stocké"
  );

  console.log(
    "cloud-gating OK — pack sans réseau, cloud off par défaut, opt-in respecté"
  );
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
