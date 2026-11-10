/**
 * La langue du popup suit la langue déclarée par le site (FR/EN).
 * Fixtures fictives.
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "extension/popup.html"), "utf8");
const read = (f) => fs.readFileSync(path.join(root, "extension", f), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function boot(siteLang) {
  const dom = new JSDOM(html, {
    url: "chrome-extension://test/popup.html",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async () => ({})
    },
    tabs: {
      query: async () => [{ id: 1 }],
      sendMessage: async () => ({ ok: true })
    },
    scripting: {
      executeScript: async () => [{ result: siteLang }]
    },
    storage: {
      local: { get: async () => ({}), set: async () => {} }
    }
  };
  window.eval(read("ui-copy.js"));
  window.eval(read("languages.js"));
  window.eval(read("popup.js"));
  await new Promise((resolve) => setTimeout(resolve, 120));
  return window;
}

(async () => {
  const fr = await boot("fr");
  assert(
    fr.document.getElementById("heroTitle").textContent === "Traduire cette page",
    "titre français absent"
  );
  assert(
    fr.document.getElementById("translatePage").textContent.includes("Traduire la page"),
    "action française absente"
  );

  const en = await boot("en");
  assert(
    en.document.getElementById("heroTitle").textContent === "Translate this page",
    "titre anglais absent"
  );
  assert(
    en.document.getElementById("translatePage").textContent.includes("Translate page"),
    "action anglaise absente"
  );
  assert(
    en.document.getElementById("restore").textContent.includes("Restore"),
    "restauration anglaise absente"
  );
  assert(
    en.document.getElementById("targetNote").textContent.includes("unverified drafts"),
    "statut de pack anglais absent"
  );

  console.log("ui-language OK — popup FR/EN selon la langue du site");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
