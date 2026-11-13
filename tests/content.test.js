/**
 * Test du content script dans jsdom : texte, noms, attributs, options,
 * restauration et index de jetons par type.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/content.test.js
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
<head><title>Page de test NkapLingua</title></head>
<body>
  <h1>Solde disponible</h1>
  <p id="solde">Le solde est de 125 000 FCFA.</p>
  <p id="reference">Opération SAF-2026-AB12CD.</p>
  <p id="critique">Solde critique.</p>
  <p id="transfert">Transfert à Aïcha.</p>
  <p id="nom-montant">Le bénéficiaire Aïcha reçoit 25 000 FCFA.</p>
  <p id="frais">Les frais de transfert sont de 1 000 FCFA.</p>
  <button id="btn" title="Vérifier le bénéficiaire" aria-label="Confirmer le transfert">Confirmer</button>
  <img id="logo" alt="Logo FINAKA" src="logo.png" />
  <input id="pin" placeholder="6 chiffres" />
  <input id="send" type="button" value="Envoyer" />
  <select id="type"><option>Compte courant</option><option>Compte épargne</option></select>
  <div id="sensitive" data-sensitive><span>Code PIN secret</span></div>
</body>
</html>`;

const dom = new JSDOM(html, {
  url: "https://example.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});

const { window } = dom;
let listener = null;
const seen = [];

window.chrome = {
  runtime: {
    onMessage: {
      addListener(fn) {
        listener = fn;
      }
    },
    sendMessage(message) {
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        return Promise.resolve({
          provider: "local",
          detected: { code: "fr", confidence: 0.9 },
          translations: message.segments.map((segment) => {
            seen.push(segment.text);
            if (segment.text.includes("Solde critique")) {
              return {
                id: segment.id,
                text: segment.text,
                ok: false,
                reason: "untranslated_critical"
              };
            }
            return {
              id: segment.id,
              text: `XX ${segment.text}`,
              ok: true,
              reason: null
            };
          })
        });
      }
      if (message.type === "NK_TRANSLATE_TEXT") {
        return Promise.resolve({
          provider: "local",
          translation: { id: "text", text: `XX ${message.text}`, ok: true },
          detected: { code: "fr", confidence: 0.9 }
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

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
  await sendMessage({ type: "NK_TRANSLATE_PAGE", target: "fub" });
  await new Promise((resolve) => setTimeout(resolve, 300));

  const body = window.document.body.textContent;
  assert(
    body.includes("XX Le solde est de 125 000 FCFA."),
    "texte du solde non traduit"
  );
  assert(
    window.document.title.startsWith("XX "),
    "titre de l’onglet non traduit"
  );
  assert(
    body.includes("SAF-2026-AB12CD"),
    "référence d'opération non préservée"
  );
  assert(!body.includes("[[NAME_"), "jeton de référence non restauré");
  assert(
    window.document.getElementById("critique").getAttribute("data-nk-untranslated") ===
      "A",
    "niveau A non marqué"
  );
  assert(
    window.document.getElementById("nk-badge-style"),
    "style du badge non injecté"
  );
  assert(
    body.includes("Transfert à Aïcha."),
    "nom du bénéficiaire non préservé"
  );
  assert(!body.includes("[[NAME_"), "jeton NAME non restauré");
  assert(!body.includes("[[NUM_"), "jeton NUM non restauré");

  assert(
    window.document.getElementById("btn").getAttribute("title").startsWith("XX "),
    "attribut title non traduit"
  );
  assert(
    window.document
      .getElementById("btn")
      .getAttribute("aria-label")
      .startsWith("XX "),
    "attribut aria-label non traduit"
  );
  assert(
    window.document.getElementById("logo").getAttribute("alt").startsWith("XX "),
    "attribut alt non traduit"
  );
  assert(
    window.document
      .getElementById("pin")
      .getAttribute("placeholder")
      .startsWith("XX "),
    "attribut placeholder non traduit"
  );
  assert(
    window.document.getElementById("send").value.startsWith("XX "),
    "valeur du bouton input non traduite"
  );
  assert(
    window.document.querySelector("option").textContent.startsWith("XX "),
    "option non traduite"
  );
  assert(
    !window.document.getElementById("sensitive").textContent.includes("XX "),
    "contenu sensible traduit"
  );
  assert(
    window.document.getElementById("solde").getAttribute("lang") === "fub",
    "lang cible non appliqué"
  );

  const mixed = seen.find(
    (text) =>
      text.includes("[[NAME_0]]") && text.includes("[[NUM_0]]")
  );
  assert(mixed, "phrase avec nom et montant non tokenisée");
  assert(
    mixed.includes("Aïcha") === false,
    "le nom du bénéficiaire fuit vers le moteur"
  );

  await sendMessage({ type: "NK_RESTORE" });
  await new Promise((resolve) => setTimeout(resolve, 50));

  assert(
    window.document.body.textContent.includes("Le solde est de 125 000 FCFA."),
    "restauration texte échouée"
  );
  assert(
    !window.document.title.startsWith("XX "),
    "restauration du titre échouée"
  );
  assert(
    window.document.getElementById("btn").getAttribute("title") ===
      "Vérifier le bénéficiaire",
    "restauration title échouée"
  );
  assert(
    !window.document
      .getElementById("critique")
      .hasAttribute("data-nk-untranslated"),
    "marqueur de niveau A non retiré à la restauration"
  );
  assert(
    !window.document.getElementById("nk-badge-style"),
    "style du badge non retiré à la restauration"
  );
  assert(
    window.document.getElementById("pin").getAttribute("placeholder") ===
      "6 chiffres",
    "restauration placeholder échouée"
  );
  assert(
    window.document.getElementById("send").value === "Envoyer",
    "restauration input value échouée"
  );

  // Seconde passe : les originaux d'attributs doivent être réinitialisés.
  await sendMessage({ type: "NK_TRANSLATE_PAGE", target: "fub" });
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert(
    window.document.getElementById("btn").getAttribute("title").startsWith("XX "),
    "seconde traduction des attributs échouée"
  );

  // Une restauration ne doit pas laisser la sélection surlignée sur le DOM
  // remplacé (bug observé sur « Renseignez les informations… »).
  const selectionRange = window.document.createRange();
  selectionRange.selectNodeContents(window.document.getElementById("solde"));
  const pageSelection = window.getSelection();
  pageSelection.removeAllRanges();
  pageSelection.addRange(selectionRange);
  assert(pageSelection.rangeCount === 1, "sélection de test non posée");
  await sendMessage({ type: "NK_RESTORE" });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert(pageSelection.rangeCount === 0, "sélection restée après restauration");

  // La dernière sélection doit survivre à la perte de focus du popup.
  const transfert = window.document.getElementById("transfert");
  const popupRange = window.document.createRange();
  popupRange.selectNodeContents(transfert);
  pageSelection.removeAllRanges();
  pageSelection.addRange(popupRange);
  // jsdom n'émet pas toujours selectionchange ; le navigateur réel le fait.
  window.document.dispatchEvent(new window.Event("selectionchange"));
  pageSelection.removeAllRanges();
  const selectionResponse = await sendMessage({
    type: "NK_TRANSLATE_SELECTION",
    target: "fub"
  });
  assert(selectionResponse?.ok, "traduction de sélection perdue après perte de focus");

  console.log("content.js OK — texte, noms, attributs, options, restauration");
})().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
