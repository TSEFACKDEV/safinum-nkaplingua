/**
 * Intégration content script + background + vrais packs, en mode démo.
 *
 * Fixture minimale : un libellé couvert, un libellé critique non couvert et
 * une salutation. Le test vérifie le texte appliqué et les badges.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/site-demo.e2e.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground() {
  const calls = [];
  const noop = () => {};
  const event = { addListener: noop };
  const context = {
    console,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    Promise,
    Map,
    WeakMap,
    Array,
    String,
    Number,
    RegExp,
    Math,
    JSON,
    fetch: async (input) => {
      const url = String(input);
      calls.push(url);
      const match = url.match(/language-packs\/(\w+)\.json/);
      if (!match) return { ok: false, json: async () => ({}) };
      const payload = JSON.parse(
        read(`extension/language-packs/${match[1]}.json`)
      );
      return { ok: true, json: async () => payload };
    },
    chrome: {
      runtime: {
        onInstalled: event,
        onMessage: event,
        getURL: (file) => `chrome-extension://test/${file}`
      },
      contextMenus: {
        removeAll: async () => {},
        create: async () => {},
        onClicked: event
      },
      tabs: { sendMessage: async () => {}, query: async () => [] },
      scripting: { executeScript: async () => {} },
      storage: { local: { get: async () => ({}), set: async () => {} } }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(read("extension/languages.js"), context);
  context.__NK_PACK_OVERRIDES__ = {};
  vm.runInContext(read("extension/background.js"), context);
  return { context, calls };
}

async function main() {
  const dom = new JSDOM(
    `<!doctype html>
<html lang="fr">
<head><title>Environnement de test — Hackathon SAFINUM</title></head>
<body>
  <p id="covered">Solde disponible</p>
  <p id="greeting">Bonjour, Amina</p>
  <p id="editorial">Référence</p>
  <p id="missing">Solde mystérieux</p>
</body>
</html>`,
    {
      url: "https://safinum.cm/hackathon-test",
      runScripts: "outside-only",
      pretendToBeVisual: true
    }
  );
  const { window } = dom;
  const background = createBackground();
  let listener = null;

  window.chrome = {
    runtime: {
      onMessage: { addListener(fn) { listener = fn; } },
      async sendMessage(message) {
        if (message.type === "NK_TRANSLATE_SEGMENTS") {
          return background.context.translateSegments(
            message.segments,
            message.target,
            message.source,
            { demo: message.demo === true }
          );
        }
        return {};
      },
      getURL: (file) => file
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
  await new Promise((resolve) => setTimeout(resolve, 80));

  // Le content script écoute NK_TRANSLATE_PAGE.
  assert(typeof listener === "function", "listener content script absent");
  await new Promise((resolve) => {
    listener(
      { type: "NK_TRANSLATE_PAGE", target: "dua" },
      {},
      resolve
    );
  });
  await new Promise((resolve) => setTimeout(resolve, 400));

  const covered = window.document.getElementById("covered");
  const greeting = window.document.getElementById("greeting");
  const editorial = window.document.getElementById("editorial");
  const missing = window.document.getElementById("missing");

  assert(
    covered.textContent.includes("Mɔ̀nì"),
    `libellé duala non appliqué : ${covered.textContent}`
  );
  assert(
    covered.getAttribute("data-nk-human-reviewed") === "draft",
    `badge humain absent : ${covered.getAttribute("data-nk-human-reviewed")}`
  );
  assert(
    greeting.textContent.includes("Idiba, Amina"),
    `salutation non appliquée : ${greeting.textContent}`
  );
  assert(
    editorial.textContent.includes("Nombara"),
    `entrée éditoriale non appliquée : ${editorial.textContent}`
  );
  assert(
    editorial.getAttribute("data-nk-human-reviewed") === "editorial",
    `badge éditorial absent : ${editorial.getAttribute("data-nk-human-reviewed")}`
  );
  assert(
    missing.textContent === "Solde mystérieux",
    `phrase non couverte modifiée : ${missing.textContent}`
  );
  assert(
    missing.getAttribute("data-nk-untranslated") === "A",
    "badge non traduit absent sur la phrase critique non couverte"
  );
  assert(
    background.calls.every((url) => url.includes("language-packs/")),
    `réseau inattendu : ${background.calls.join(", ")}`
  );

  // Une seule mention discrète, pas une pastille par phrase.
  const notice = window.document.getElementById("nk-notice-host");
  assert(
    notice && notice.shadowRoot.textContent.includes("brouillons non validés"),
    "mention unique de traduction non validée absente"
  );
  assert(
    !read("extension/content.js").includes('content: "brouillon humain"') &&
      !read("extension/content.js").includes('content: "brouillon éditorial"'),
    "pastilles par phrase encore présentes dans le CSS"
  );

  console.log(
    "site-demo OK — pack humain, mention unique, badge non traduit, zéro réseau externe"
  );
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
