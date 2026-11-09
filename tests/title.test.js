/**
 * Titre FR/EN : le titre peut être dans une autre langue que la page.
 *
 * Page EN + titre FR. Le content script doit envoyer le titre avec la
 * source FR, pas avec la source EN de la page.
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const dom = new JSDOM(
  `<!doctype html>
<html lang="en">
<head><title>Environnement de test — Hackathon SAFINUM</title></head>
<body><p id="body">Check your balance</p></body>
</html>`,
  {
    url: "https://safinum.cm/hackathon-test",
    runScripts: "outside-only",
    pretendToBeVisual: true
  }
);
const { window } = dom;
const sent = [];
let listener = null;

window.chrome = {
  runtime: {
    onMessage: {
      addListener(fn) {
        listener = fn;
      }
    },
    async sendMessage(message) {
      sent.push(message);
      if (message.type === "NK_TRANSLATE_TEXT") {
        return {
          provider: "flagship",
          translation: {
            id: "text",
            text: "Test environment — [[NAME_0]]",
            ok: true,
            reason: null
          }
        };
      }
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        return {
          provider: "flagship",
          translations: message.segments.map((segment) => ({
            id: segment.id,
            text: "XX " + segment.text,
            ok: true,
            reason: null
          }))
        };
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await new Promise((resolve) => {
    listener({ type: "NK_TRANSLATE_PAGE", target: "fub" }, {}, resolve);
  });
  await new Promise((resolve) => setTimeout(resolve, 300));

  const titleMessage = sent.find(
    (message) =>
      message.type === "NK_TRANSLATE_TEXT" &&
      String(message.text || "").includes("Environnement")
  );
  assert(titleMessage, `titre non envoyé : ${JSON.stringify(sent)}`);
  assert(
    titleMessage.source === "fr",
    `titre envoyé avec la source ${titleMessage.source}, attendu fr`
  );
  assert(
    window.document.title === "Test environment — Hackathon SAFINUM",
    `titre non traduit : ${window.document.title}`
  );

  const bodyMessage = sent.find(
    (message) => message.type === "NK_TRANSLATE_SEGMENTS"
  );
  assert(bodyMessage, "corps non envoyé");
  assert(
    bodyMessage.source === "en",
    `corps envoyé avec la source ${bodyMessage.source}, attendu en`
  );

  console.log("title OK — titre FR traduit sur page EN, corps en source EN");
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
