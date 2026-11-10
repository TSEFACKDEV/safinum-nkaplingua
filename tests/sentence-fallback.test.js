/**
 * Repli phrase par phrase quand le pack est le seul moteur :
 * les phrases connues sont traduites, les autres restent en français.
 * Aucune substitution mot à mot, aucun badge par phrase.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/sentence-fallback.test.js
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
  <p id="mixte">Le solde est de 25 000 FCFA. Le vendeur arrive demain.</p>
  <p id="critique">Le solde est de 30 000 FCFA. Le client arrive demain.</p>
</body>
</html>`;

const dom = new JSDOM(html, {
  url: "https://example.test/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});

const { window } = dom;
let listener = null;
const summaries = [];
let segmentCalls = [];

window.chrome = {
  runtime: {
    onMessage: {
      addListener(fn) {
        listener = fn;
      }
    },
    sendMessage(message) {
      if (message.type === "NK_TRANSLATE_SEGMENTS") {
        segmentCalls.push(message.segments.map((segment) => segment.id));
        return Promise.resolve({
          provider: "pack",
          detected: { code: "fr", confidence: 0.9 },
          translations: message.segments.map((segment) => {
            const critical = segment.id.startsWith("n2");
            // Seconde phrase toujours absente du pack.
            if (/#s1$/.test(segment.id)) {
              return {
                id: segment.id,
                text: "",
                ok: false,
                reason: "pack_miss"
              };
            }
            // Phrase critique non validée : le pack refuse, même phrase
            // par phrase. Elle doit rester en français.
            if (critical && /#s0$/.test(segment.id)) {
              return {
                id: segment.id,
                text: "",
                ok: false,
                reason: "critical_pack_only"
              };
            }
            // Phrase connue du pack : uniquement la première phrase du
            // paragraphe non critique.
            if (/#s0$/.test(segment.id)) {
              return {
                id: segment.id,
                text: "Jawdindi ko [[NUM_0]] FCFA.",
                ok: true,
                reason: null,
                humanReviewed: false
              };
            }
            // Paragraphe entier : le critique est refusé d'emblée.
            return {
              id: segment.id,
              text: "",
              ok: false,
              reason: critical ? "untranslated_critical" : "pack_miss"
            };
          })
        });
      }
      if (message.type === "NK_TRANSLATE_TEXT") {
        return Promise.resolve({
          provider: "pack",
          translation: {
            id: "text",
            text: "NkapLingua — nokkuure test",
            ok: true
          },
          detected: { code: "fr", confidence: 0.9 }
        });
      }
      if (message.type === "NK_TRANSLATION_SUMMARY") {
        summaries.push(message.summary);
        return Promise.resolve({});
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

  const paragraph = window.document.getElementById("mixte");
  const text = paragraph.textContent;

  assert(
    text.includes("Jawdindi ko 25 000 FCFA."),
    "phrase connue non traduite par repli phrase"
  );
  assert(
    text.includes("Le vendeur arrive demain."),
    "phrase inconnue ne reste pas en français"
  );
  assert(
    !text.includes("XX") && !text.includes("[[NUM_0]]"),
    "jeton non restauré ou traduction mot à mot"
  );

  assert(
    segmentCalls.some(
      (ids) => ids.length === 2 && ids.some((id) => /#s0$/.test(id))
    ),
    "le paragraphe n'a pas été retenté phrase par phrase"
  );

  assert(
    !paragraph.hasAttribute("data-nk-untranslated"),
    "badge « non traduit » conservé sur une traduction partielle"
  );
  assert(
    !paragraph.querySelector("[data-nk-untranslated]"),
    "badge par phrase injecté"
  );

  const critical = window.document.getElementById("critique");
  assert(
    critical.textContent.includes("Le solde est de 30 000 FCFA.") &&
      critical.textContent.includes("Le client arrive demain."),
    "une phrase critique non validée a été traduite par repli"
  );
  assert(
    critical.getAttribute("data-nk-untranslated") === "A",
    "niveau A non marqué après repli refusé"
  );

  const summary = summaries[summaries.length - 1];
  assert(summary, "résumé de traduction non envoyé");
  assert(summary.partial === 1, `partiel attendu 1, reçu ${summary.partial}`);
  assert(
    summary.untranslated === 2,
    `non traduit attendu 2 (critique), reçu ${summary.untranslated}`
  );

  const shadowText = [...window.document.documentElement.children]
    .map((element) => element.shadowRoot?.textContent || "")
    .join(" ");
  const toast = shadowText || window.document.body.textContent;
  assert(
    /traduction\(s\) partielle\(s\)/.test(toast),
    "mention « traduction(s) partielle(s) » absente"
  );
  assert(
    !/brouillon humain|brouillon éditorial/.test(toast),
    "badge par phrase présent dans le récapitulatif"
  );

  console.log("sentence-fallback: OK");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
