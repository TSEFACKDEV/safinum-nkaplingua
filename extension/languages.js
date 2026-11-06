/**
 * NkapLingua — registre des langues et détection de la langue source.
 *
 * Ce fichier est partagé par le popup, le content script et le background.
 * Il ne contient aucun accès réseau : tout est local et synchrone.
 *
 * Trois familles de cibles :
 *  - "mt"   : traduction automatique (backend NLLB local ou MyMemory) ;
 *  - "pack" : mémoire de traduction communautaire, phrases validées seulement ;
 *  - "term" : glossaire terminologique (prévu, non actif dans cette version).
 */

(function (global) {
  "use strict";

  const TARGETS = [
    {
      code: "fub",
      iso6393: "fub",
      label: "Fulfulde (Adamawa)",
      nativeLabel: "Fulfulde",
      shortLabel: "FF",
      region: "Adamaoua · Nord · Extrême-Nord",
      engine: "mt",
      cloudCode: "ff",
      nllbCode: "fuv_Latn",
      pack: "language-packs/fub.json",
      status: "mt-baseline",
      statusLabel: "MT — validation native en cours",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "ybb",
      iso6393: "ybb",
      label: "Yemba",
      nativeLabel: "Yɛmba",
      shortLabel: "YBB",
      region: "Menoua · Ouest",
      engine: "pack",
      pack: "language-packs/ybb.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "byv",
      iso6393: "byv",
      label: "Medumba",
      nativeLabel: "Mə̀dʉ̂mbɑ̀",
      shortLabel: "BYV",
      region: "Ndé · Ouest",
      engine: "pack",
      pack: "language-packs/byv.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "ewo",
      iso6393: "ewo",
      label: "Ewondo",
      nativeLabel: "Ewondo",
      shortLabel: "EWO",
      region: "Centre · Nyong-et-Mfoumou",
      engine: "pack",
      pack: "language-packs/ewo.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "dua",
      iso6393: "dua",
      label: "Douala",
      nativeLabel: "Duálá",
      shortLabel: "DUA",
      region: "Littoral · Wouri",
      engine: "pack",
      pack: "language-packs/dua.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "bas",
      iso6393: "bas",
      label: "Bassa",
      nativeLabel: "Basàa",
      shortLabel: "BAS",
      region: "Littoral · Nkam · Sanaga-Maritime",
      engine: "pack",
      pack: "language-packs/bas.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "bbj",
      iso6393: "bbj",
      label: "Ghomala'",
      nativeLabel: "Ghomala'",
      shortLabel: "BBJ",
      region: "Ouest · Koung-Khi · Hauts-Plateaux",
      engine: "pack",
      pack: "language-packs/bbj.json",
      status: "community-pack",
      statusLabel: "Pack communautaire — phrases validées",
      orthography: "AGLC",
      verified: false
    }
  ];

  const BY_CODE = new Map(TARGETS.map((target) => [target.code, target]));

  const FRENCH_WORDS = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "dans", "sur",
    "pour", "avec", "sans", "sous", "est", "sont", "été", "être", "avoir",
    "votre", "vos", "notre", "nos", "vous", "nous", "je", "tu", "il", "elle",
    "ils", "elles", "ce", "cet", "cette", "ces", "qui", "que", "quoi",
    "compte", "solde", "frais", "transfert", "paiement", "montant",
    "bénéficiaire", "transaction", "confirmation", "sécurité", "code",
    "banque", "crédit", "débit", "taux", "intérêt", "échéance", "retard",
    "pénalité", "client", "service", "information", "donnée", "données"
  ]);

  const ENGLISH_WORDS = new Set([
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for",
    "with", "without", "under", "is", "are", "was", "were", "be", "been",
    "your", "our", "you", "we", "i", "he", "she", "they", "it", "this",
    "that", "these", "those", "who", "what", "which", "account", "balance",
    "fee", "fees", "transfer", "payment", "amount", "beneficiary",
    "transaction", "confirmation", "security", "code", "bank", "credit",
    "debit", "rate", "interest", "due", "late", "penalty", "customer",
    "service", "information", "data"
  ]);

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizePhrase(value) {
    return normalizeText(value).toLowerCase();
  }

  function canonicalizeTokens(value) {
    return String(value || "").replace(
      /\[\s*\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\s*\]/gi,
      (_match, kind, number) => `[[${kind.toUpperCase()}_${number}]]`
    );
  }

  function sourceHint(hint) {
    const value = String(hint || "").toLowerCase();
    if (value.startsWith("fr")) return "fr";
    if (value.startsWith("en")) return "en";
    return null;
  }

  /**
   * Détection FR/EN volontairement déterministe et explicable.
   * Elle ne prétend pas détecter le fulfulde, le yemba ou le medumba :
   * ces langues sont des cibles, pas des sources attendues du challenge.
   */
  function detectLanguage(text, hint) {
    const value = normalizeText(text).toLowerCase();
    const words = value.match(/[a-zà-ÿ']+/g) || [];
    let french = 0;
    let english = 0;

    for (const word of words) {
      if (FRENCH_WORDS.has(word)) french += 1;
      if (ENGLISH_WORDS.has(word)) english += 1;
    }

    // Indices orthographiques : accents français et digrammes anglais.
    const frenchChars = (value.match(/[àâçéèêëîïôûùüÿœ]/g) || []).length;
    const englishChars = (value.match(/\b(?:th|wh|sh|ing|tion|ough)\b/g) || [])
      .length;
    french += frenchChars * 0.6;
    english += englishChars * 0.4;

    const total = french + english;
    const guessed = sourceHint(hint);

    if (total === 0) {
      return {
        code: guessed || "unknown",
        confidence: guessed ? 0.3 : 0,
        scores: { fr: 0, en: 0 },
        mixed: false
      };
    }

    const confidence = Math.min(
      0.99,
      Math.round((Math.abs(french - english) / total) * 100) / 100
    );

    let code;
    if (french >= english * 1.25) code = "fr";
    else if (english >= french * 1.25) code = "en";
    else code = "mixed";

    // Si la page déclare explicitement sa langue et que le texte est court,
    // l'indice HTML est plus fiable que deux ou trois mots ambigus.
    if (guessed && total < 2) {
      code = guessed;
      return {
        code,
        confidence: 0.3,
        scores: {
          fr: Math.round(french * 10) / 10,
          en: Math.round(english * 10) / 10
        },
        mixed: false
      };
    }

    return {
      code,
      confidence,
      scores: {
        fr: Math.round(french * 10) / 10,
        en: Math.round(english * 10) / 10
      },
      mixed: code === "mixed"
    };
  }

  function getTarget(code) {
    return BY_CODE.get(String(code || "")) || null;
  }

  function listTargets() {
    return TARGETS.map((target) => ({ ...target }));
  }

  function isPackTarget(code) {
    const target = getTarget(code);
    return Boolean(target && target.engine === "pack");
  }

  global.NK_LANGUAGES = {
    listTargets,
    targets: listTargets,
    getTarget,
    isPackTarget,
    detectLanguage,
    normalizeText,
    normalizePhrase,
    canonicalizeTokens
  };
})(globalThis);
