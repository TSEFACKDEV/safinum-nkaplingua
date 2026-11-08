/**
 * Test de confidentialité : rien de ce qui est saisi ou marqué sensible ne doit
 * quitter la page, et le champ `context` ne doit plus être transmis au moteur.
 *
 * Le fixture contient un formulaire, une zone [data-sensitive] et des montants
 * volontairement reconnaissables. Aucune donnée réelle n'est utilisée.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/privacy.test.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const languages = fs.readFileSync(
  path.join(root, "extension/languages.js"),
  "utf8"
);
const content = fs.readFileSync(
  path.join(root, "extension/content.js"),
  "utf8"
);

const html = `<!doctype html>
<html lang="fr">
<body>
  <section id="zone">
    <p id="solde">Votre solde est de 25 000 FCFA.</p>
    <p id="frais">Les frais de transfert sont de 1 000 FCFA.</p>
    <div id="bloc">
      Votre code confidentiel est requis.
      <textarea id="note">CONFIDENTIEL — dossier 9876</textarea>
      <div id="secret" data-sensitive>Code secret : CODE-1234</div>
    </div>
  </section>
</body>
</html>`;

const dom = new JSDOM(html, {
  url: "https://example.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});

const { window } = dom;
let listener = null;
const sent = [];

window.chrome = {
  runtime: {
    onMessage: {
      addListener(fn) {
        listener = fn;
      }
    },
    sendMessage(message) {
      sent.push(message);
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        return Promise.resolve({
          provider: "local",
          detected: { code: "fr", confidence: 0.9 },
          translations: message.segments.map((segment) => ({
            id: segment.id,
            text: `XX ${segment.text}`,
            ok: true,
            reason: null
          }))
        });
      }
      return Promise.resolve({});
    }
  },
  storage: {
    local: {
      get() {
        return Promise.resolve({});
      }
    }
  }
};

window.eval(languages);
window.eval(content);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sendMessage(message) {
  return new Promise((resolve) => {
    listener(message, {}, resolve);
  });
}

async function main() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await sendMessage({ type: "NK_TRANSLATE_PAGE", target: "fub" });
  await new Promise((resolve) => setTimeout(resolve, 300));

  assert(sent.length > 0, "aucun message n'a été envoyé au moteur");

  const wire = sent.map((message) => JSON.stringify(message)).join("\n");
  const forbidden = ["CONFIDENTIEL", "CODE-1234", "9876", "1 000", "25 000"];

  for (const value of forbidden) {
    assert(
      !wire.includes(value),
      `fuite vers le moteur : « ${value} » présent dans un message.\n${wire}`
    );
  }

  for (const message of sent) {
    for (const segment of message.segments || []) {
      assert(
        segment.context === undefined || segment.context === "",
        `context non vide transmis au moteur pour ${segment.id} : ` +
          JSON.stringify(segment.context)
      );
    }
  }

  assert(
    window.document.getElementById("note").value ===
      "CONFIDENTIEL — dossier 9876",
    "le contenu du textarea a été modifié"
  );
  assert(
    window.document.getElementById("secret").textContent ===
      "Code secret : CODE-1234",
    "la zone [data-sensitive] a été modifiée"
  );
  assert(
    !window.document.getElementById("secret").textContent.includes("XX "),
    "la zone [data-sensitive] a été traduite"
  );

  console.log(
    "privacy OK — aucun context, aucune valeur de formulaire dans les messages"
  );
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
