#!/usr/bin/env node
/**
 * Tests légers de l’extension, sans navigateur ni réseau.
 *
 * Vérifie :
 *  - le registre des langues et la détection FR/EN ;
 *  - la mémoire de traduction (pack) ;
 *  - le refus des entrées non validées ;
 *  - la préservation des jetons NUM et NAME.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const noop = () => {};
const event = { addListener: noop };

const context = {
  console,
  fetch,
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
  chrome: {
    runtime: {
      onInstalled: event,
      onMessage: event,
      getURL: (file) => `chrome-extension://test/${file}`
    },
    contextMenus: {
      removeAll: async () => {},
      create: () => {},
      onClicked: event
    },
    tabs: { sendMessage: async () => {} },
    scripting: { executeScript: async () => {} }
  }
};
context.globalThis = context;
vm.createContext(context);

vm.runInContext(
  fs.readFileSync(path.join(root, "extension/languages.js"), "utf8"),
  context
);

const LANG = context.NK_LANGUAGES;
const codes = LANG.listTargets().map((target) => target.code);
assert(codes.length === 3, `3 langues attendues, reçu ${codes.length}`);
assert(codes.includes("fub"), "fulfulde manquant");
assert(codes.includes("ewo"), "ewo manquant");
assert(codes.includes("dua"), "dua manquant");

const french = LANG.detectLanguage("Le solde de votre compte est disponible.");
assert(french.code === "fr", `détection FR échouée : ${french.code}`);
assert(french.confidence > 0, "confiance FR nulle");

const english = LANG.detectLanguage("The balance of your account is available.");
assert(english.code === "en", `détection EN échouée : ${english.code}`);

const hinted = LANG.detectLanguage("Solde", "en-US");
assert(hinted.code === "en", "indice HTML non prioritaire sur texte court");

context.__NK_PACK_OVERRIDES__ = {
  dua: {
    code: "dua",
    entries: [
      {
        source: "Le solde est de [[NUM_0]] FCFA.",
        target: "Solde ewo [[NUM_0]] FCFA.",
        status: "validated"
      },
      {
        source: "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA.",
        target: "Nafoore [[NAME_0]] ina heɓa [[NUM_0]] FCFA.",
        status: "validated"
      },
      {
        source: "Opération [[NAME_0]].",
        target: "Nde [[NAME_0]].",
        status: "validated"
      },
      {
        source: "Phrase non validée.",
        target: "Phrase ewo.",
        status: "draft"
      }
    ]
  }
};
context.__NK_PACK_OVERRIDES__.ewo = { code: "ewo", entries: [] };

vm.runInContext(
  fs.readFileSync(path.join(root, "extension/background.js"), "utf8"),
  context
);

(async () => {
  const hit = await context.translateSegments(
    [{ id: "a", text: "Le solde est de [[NUM_0]] FCFA." }],
    "dua",
    "fr"
  );
  assert(hit.provider === "pack", "provider pack attendu");
  assert(hit.translations[0].ok === true, "phrase validée refusée");
  assert(
    hit.translations[0].text.includes("[[NUM_0]]"),
    "jeton NUM perdu dans le pack"
  );

  const nameHit = await context.translateSegments(
    [
      {
        id: "b",
        text: "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA."
      }
    ],
    "dua",
    "fr"
  );
  assert(nameHit.translations[0].ok === true, "phrase avec NAME refusée");
  assert(
    nameHit.translations[0].text.includes("[[NAME_0]]"),
    "jeton NAME perdu dans le pack"
  );

  // Appel direct (popup « texte inédit ») : le background doit tokeniser
  // les montants et les noms, puis les restaurer avant de répondre.
  const rawAmount = await context.translateSegments(
    [{ id: "raw-amount", text: "Le solde est de 125 000 FCFA." }],
    "dua",
    "fr"
  );
  assert(rawAmount.translations[0].ok === true, "montant brut refusé");
  assert(
    rawAmount.translations[0].text.includes("125 000 FCFA"),
    "montant brut non restauré"
  );
  assert(
    !rawAmount.translations[0].text.includes("[[NUM_"),
    "jeton NUM visible dans la réponse au popup"
  );

  const rawName = await context.translateSegments(
    [{ id: "raw-name", text: "Le bénéficiaire Aïcha reçoit 25 000 FCFA." }],
    "dua",
    "fr"
  );
  assert(rawName.translations[0].ok === true, "phrase avec nom brut refusée");
  assert(
    rawName.translations[0].text.includes("Aïcha"),
    "nom brut non restauré"
  );
  assert(
    rawName.translations[0].text.includes("25 000 FCFA"),
    "montant avec nom brut non restauré"
  );
  assert(
    !rawName.translations[0].text.includes("[[NAME_"),
    "jeton NAME visible dans la réponse au popup"
  );

  const rawReference = await context.translateSegments(
    [{ id: "raw-ref", text: "Opération SAF-2026-AB12CD." }],
    "dua",
    "fr"
  );
  assert(rawReference.translations[0].ok === true, "référence refusée");
  assert(
    rawReference.translations[0].text.includes("SAF-2026-AB12CD"),
    "référence non restaurée"
  );
  assert(
    !rawReference.translations[0].text.includes("[[NAME_"),
    "jeton de référence visible dans la réponse"
  );

  const miss = await context.translateSegments(
    [{ id: "c", text: "Une phrase inconnue." }],
    "dua",
    "fr"
  );
  assert(miss.translations[0].ok === false, "phrase inconnue acceptée");
  assert(
    miss.translations[0].reason === "pack_miss",
    "raison pack_miss attendue"
  );

  const draft = await context.translateSegments(
    [{ id: "d", text: "Phrase non validée." }],
    "dua",
    "fr"
  );
  assert(draft.translations[0].ok === false, "phrase draft acceptée");
  assert(
    draft.translations[0].reason === "pack_unverified",
    "raison pack_unverified attendue"
  );

  const leak = context.validateTranslation(
    "Le bénéficiaire reçoit le montant net après déduction des frais.",
    "Le bénéficiaire reçoit le montant net sur votre compte.",
    { engine: "mt" }
  );
  assert(leak.ok === false, "fuite de français acceptée");

  const repetitive = context.validateTranslation(
    "Le bénéficiaire reçoit le montant net après déduction des frais.",
    "frais frais frais frais frais frais frais frais frais frais",
    { engine: "mt" }
  );
  assert(repetitive.ok === false, "sortie répétitive acceptée");

  const plausible = context.validateTranslation(
    "Le solde est de [[NUM_0]] FCFA.",
    "Fedde jaɓande nden ko [[NUM_0]] FCFA.",
    { engine: "mt" }
  );
  assert(plausible.ok === true, "traduction plausible refusée");

  const protectedTerms = LANG.protectTerms(
    "Le solde est de 125 000 FCFA. Ne partagez jamais votre code PIN."
  );
  assert(
    protectedTerms.text.includes("[[0]]"),
    "FCFA non protégé avant le moteur MT"
  );
  assert(
    protectedTerms.text.includes("[[1]]"),
    "PIN non protégé avant le moteur MT"
  );
  const restoredTerms = LANG.restoreTerms(
    protectedTerms.text,
    protectedTerms.terms
  );
  assert(
    restoredTerms.includes("FCFA") && restoredTerms.includes("PIN"),
    "termes critiques non restaurés"
  );

  const finalized = context.finalizeTranslation(
    {
      id: "term",
      text: "Solde fulfulde [[0]].",
      ok: true,
      reason: null
    },
    {
      tokens: [],
      terms: [{ token: "[[0]]", original: "FCFA" }],
      originalText: "Le solde est de 125 000 FCFA."
    }
  );
  assert(finalized.text.includes("FCFA"), "FCFA perdu à la finalisation");

  const ewo = LANG.getTarget("ewo");
  assert(ewo.engine === "mt", "ewo doit passer en mode MT brouillon");
  assert(!ewo.cloudCode, "ewo ne doit pas avoir de code cloud");
  assert(
    LANG.isCriticalText("Le solde est de 125 000 FCFA.") === true,
    "phrase finance non classée critique"
  );
  assert(
    LANG.isCriticalText("Bonjour, comment allez-vous ?") === false,
    "salutation classée critique par erreur"
  );
  assert(
    LANG.isDemoPage({
      hostname: "safinum.cm",
      pathname: "/hackathon-test"
    }) === true,
    "site de test SAFINUM non reconnu"
  );
  assert(
    LANG.isDemoPage({
      hostname: "example.com",
      pathname: "/hackathon-test"
    }) === false,
    "site inconnu classé démo"
  );

  const critical = await context.translateSegments(
    [{ id: "crit", text: "Le solde est de 125 000 FCFA." }],
    "ewo",
    "fr"
  );
  assert(
    critical.translations[0].ok === false,
    "phrase critique traduite par MT"
  );
  assert(
    critical.translations[0].reason === "untranslated_critical",
    "raison untranslated_critical attendue"
  );
  assert(
    critical.translations[0].text.includes("125 000 FCFA"),
    "montant critique non conservé dans le texte source"
  );

  console.log("Extension tests OK — registre, détection, packs, jetons, qualité, niveau A");
})().catch((error) => {
  console.error("FAIL", error);
  process.exit(1);
});
