/**
 * Taxonomie d'erreur du popup — priorités 3.
 *
 * Vérifie que low_roundtrip, token_lost, too_short et dnt_missing produisent
 * quatre messages distincts, sans tomber dans le message générique.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/error-taxonomy.test.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "extension/popup.html"), "utf8");
const popupSource = fs.readFileSync(path.join(root, "extension/popup.js"), "utf8");
const languagesSource = fs.readFileSync(
  path.join(root, "extension/languages.js"),
  "utf8"
);
const uiCopySource = fs.readFileSync(
  path.join(root, "extension/ui-copy.js"),
  "utf8"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadPopup() {
  const dom = new JSDOM(html, {
    url: "chrome-extension://test/popup.html",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  let reason = "low_roundtrip:0.2";
  window.chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async () => ({
        detected: { code: "fr", confidence: 0.9 },
        translation: { id: "text", text: "x", ok: false, reason }
      })
    },
    storage: { local: { get: async () => ({}), set: async () => {} } },
    tabs: { query: async () => [{}], sendMessage: async () => ({}) },
    scripting: { executeScript: async () => {} }
  };
  window.eval(uiCopySource);
  window.eval(languagesSource);
  window.eval(popupSource);
  return {
    window,
    setReason(value) {
      reason = value;
    }
  };
}

async function statusFor(reason) {
  const popup = loadPopup();
  popup.setReason(reason);
  await new Promise((resolve) => setTimeout(resolve, 80));
  popup.window.document.getElementById("unseen").value =
    "Le service client est disponible.";
  popup.window.document.getElementById("translateText").click();
  await new Promise((resolve) => setTimeout(resolve, 120));
  return (
    popup.window.document.getElementById("testError").textContent ||
    popup.window.document.getElementById("status").textContent
  );
}

(async () => {
  const low = await statusFor("low_roundtrip:0.17");
  const token = await statusFor("token_lost:[[NUM_0]]");
  const short = await statusFor("too_short");
  const dnt = await statusFor("dnt_missing:FCFA");

  assert(low.includes("cohérence"), `low_roundtrip: ${low}`);
  assert(
    token.includes("montant, un nom ou une référence"),
    `token_lost: ${token}`
  );
  assert(short.includes("trop courte"), `too_short: ${short}`);
  assert(dnt.includes("terme critique"), `dnt_missing: ${dnt}`);

  const messages = [low, token, short, dnt];
  assert(new Set(messages).size === 4, `messages non distincts : ${messages}`);
  for (const message of messages) {
    assert(
      !message.includes("contrôle de sûreté. Le texte original"),
      `message générique utilisé : ${message}`
    );
  }

  console.log(
    "error-taxonomy OK — low_roundtrip, token_lost, too_short, dnt_missing distincts"
  );
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
