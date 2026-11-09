/**
 * Non-régression préservation : compte avec espaces, casse des noms,
 * placeholders de jetons.
 *
 * Aucun réseau, aucun DOM.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "extension/languages.js"),
  "utf8"
);

eval(source);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function roundtrip(text) {
  const redaction = NK_LANGUAGES.redactSensitive(text);
  return {
    redaction,
    restored: NK_LANGUAGES.restoreSensitive(
      redaction.text,
      redaction.tokens
    )
  };
}

// 1. Numéro de compte : un seul jeton, espaces restaurés à l'identique.
const account = "Numéro de compte : CM 001 2345 6789 01";
const accountResult = roundtrip(account);
assert(
  accountResult.redaction.tokens.length === 1,
  `compte découpé en ${accountResult.redaction.tokens.length} jetons`
);
assert(
  accountResult.redaction.text.includes("[[NUM_0]]"),
  `jeton NUM absent : ${accountResult.redaction.text}`
);
assert(
  accountResult.restored === account,
  `compte restauré différent : ${accountResult.restored}`
);

// 2. Salutation : le prénom est protégé et sa casse est restaurée.
const greeting = "Bonjour, Amina";
const greetingResult = roundtrip(greeting);
assert(
  greetingResult.redaction.tokens.length === 1,
  "prénom non tokenisé dans la salutation"
);
assert(
  greetingResult.redaction.tokens[0].original === "Amina",
  "mauvais original pour le prénom"
);
assert(
  greetingResult.restored === greeting,
  `salutation restaurée différente : ${greetingResult.restored}`
);

// 3. Nom complet : casse préservée.
const fullName = "Amina Ngo Bell";
const fullNameResult = roundtrip(fullName);
assert(
  fullNameResult.restored === fullName,
  `nom complet restauré différent : ${fullNameResult.restored}`
);

// 4. Montant : un seul jeton, espace restauré.
const amount = "Le solde est de 25 000 FCFA.";
const amountResult = roundtrip(amount);
assert(
  amountResult.redaction.tokens.length === 1,
  `montant découpé en ${amountResult.redaction.tokens.length} jetons`
);
assert(
  amountResult.restored === amount,
  `montant restauré différent : ${amountResult.restored}`
);

console.log(
  "preservation OK — compte, prénom, nom complet, montant, casse et espaces"
);
