/**
 * NkapLingua — registre des langues et détection de la langue source.
 *
 * Ce fichier est partagé par le popup, le content script et le background.
 * Il ne contient aucun accès réseau : tout est local et synchrone.
 *
 * Trois familles de cibles :
 *  - "mt"   : traduction automatique (backend local flagship-ai/NLLB ou
 *             MyMemory quand une paire cloud existe) ;
 *  - "pack" : mémoire de traduction communautaire, phrases validées seulement ;
 *  - "term" : glossaire terminologique (prévu, non actif dans cette version).
 *
 * Le niveau A (solde, frais, PIN/OTP, etc.) est bloqué avant tout appel MT :
 * `isCriticalText()` sert de barrière commune au background et aux tests.
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
      status: "mt-draft",
      statusLabel: "MT brouillon — validation native en cours",
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
      engine: "mt",
      pack: "language-packs/ewo.json",
      status: "mt-draft",
      statusLabel: "MT brouillon — validation native requise",
      orthography: "AGLC",
      verified: false
    },
    {
      code: "dua",
      iso6393: "dua",
      label: "Duala",
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
   * Elle ne prétend pas détecter le fulfulde, l’ewondo ou le duala :
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


  const NAME_STOPWORDS = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "au", "aux", "ce",
    "cet", "cette", "ces", "mon", "ma", "mes", "votre", "vos", "notre",
    "nos", "son", "sa", "ses", "compte", "courant", "épargne", "titulaire",
    "principal", "secondaire", "mobile", "money", "banque", "agence",
    "service", "client", "cliente", "solde", "frais", "transfert",
    "paiement", "montant", "bénéficiaire", "destinataire", "transaction",
    "confirmation", "sécurité", "code", "crédit", "débit", "taux",
    "intérêt", "échéance", "retard", "pénalité", "information",
    "informations", "donnée", "données", "finaka", "nkaplingua", "safinum",
    "orange", "wave", "visa", "mastercard", "whatsapp", "cameroun",
    "yaoundé", "douala", "dschang", "bafoussam", "menoua", "ndé",
    "disponible", "total", "net", "brut", "actuel", "réel", "effectif",
    "mensuel", "annuel", "journalier", "immédiat", "récent", "nouveau",
    "ancien", "bancaire", "financier", "numérique", "électronique",
    "sécurisé", "personnel", "professionnel", "logo",
    "account", "balance", "available", "monthly", "annual", "daily",
    "recent", "new", "old", "bank", "financial", "digital", "secure",
    "personal", "professional"
  ]);

  const NAME_TRIGGER_RE = new RegExp(
    "(?:^|[^\\p{L}])" +
      "(bénéficiaire|destinataire|client(?:e)?|monsieur|madame|" +
      "mademoiselle|m\\.|mme|mlle|dr|professeur|prof|à|de|du|pour|" +
      "chez|vers|contact)" +
      "\\s*:?\\s+" +
      "([\\p{Lu}][\\p{L}'’-]+(?:\\s+[\\p{Lu}][\\p{L}'’-]+){0,2})",
    "gu"
  );

  const NAME_SEQUENCE_RE =
    /(?:^|[^\p{L}])([\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+)+)(?=$|[^\p{L}])/gu;

  function looksLikeName(candidate) {
    const words = candidate
      .split(/\s+/)
      .map((word) => word.toLocaleLowerCase("fr"));
    if (words.length === 0) return false;
    if (words.every((word) => NAME_STOPWORDS.has(word))) return false;
    if (words.every((word) => word === word.toUpperCase())) return false;
    return words.some((word) => word.length >= 2);
  }

  function redactSensitive(text) {
    const tokens = [];
    let value = String(text || "");
    const counters = { NUM: 0, URL: 0, EMAIL: 0, NAME: 0 };

    const addToken = (kind, original) => {
      const token = `[[${kind}_${counters[kind]++}]]`;
      tokens.push({ token, original });
      return token;
    };

    value = value.replace(/https?:\/\/[^\s<>"']+/gi, (match) =>
      addToken("URL", match)
    );
    value = value.replace(
      /[\w.+-]+@[\w-]+\.[\w.-]+/gi,
      (match) => addToken("EMAIL", match)
    );

    value = value.replace(NAME_TRIGGER_RE, (match, _trigger, candidate) => {
      if (!looksLikeName(candidate)) return match;
      const start = match.indexOf(candidate);
      if (start < 0) return match;
      return `${match.slice(0, start)}${addToken("NAME", candidate)}`;
    });

    value = value.replace(NAME_SEQUENCE_RE, (match, candidate) => {
      if (!looksLikeName(candidate)) return match;
      const prefix = match.slice(0, match.indexOf(candidate));
      return `${prefix}${addToken("NAME", candidate)}`;
    });

    value = value.replace(
      /\b\d{1,3}(?:[ \u00A0]\d{3})+(?:[.,]\d+)?\b|\b\d+(?:[.,]\d+)?\b/g,
      (match) => addToken("NUM", match)
    );

    return { text: value, tokens };
  }

  function restoreSensitive(text, tokens) {
    let value = canonicalizeTokens(text);
    for (const { token, original } of tokens || []) {
      const occurrences = value.split(token).length - 1;
      if (occurrences !== 1) return null;
      value = value.split(token).join(original);
    }
    return value;
  }


  const DNT_TERMS = [
    "FCFA",
    "XAF",
    "MTN",
    "MoMo",
    "Orange Money",
    "Wave",
    "Visa",
    "Mastercard",
    "WhatsApp",
    "PIN",
    "OTP",
    "KYC",
    "IBAN",
    "SWIFT",
    "FINAKA"
  ];

  // Termes qui déclenchent le niveau A : jamais de MT, pack validé only.
  const CRITICAL_TERMS = [
    "solde",
    "frais",
    "montant",
    "total",
    "pin",
    "otp",
    "code secret",
    "transaction",
    "paiement",
    "bénéficiaire",
    "beneficiaire",
    "sécurité",
    "securite",
    "confirmation",
    "erreur",
    "échec",
    "echec",
    "retard",
    "pénalité",
    "penalite",
    "débit",
    "debit",
    "crédit",
    "credit",
    "taux",
    "intérêt",
    "interet",
    "échéance",
    "echeance",
    "virement",
    "transfert",
    "compte"
  ];

  function isCriticalText(text) {
    const value = normalizePhrase(text);
    return CRITICAL_TERMS.some((term) => {
      const pattern = new RegExp(
        `(?:^|[^\\w])${escapeRegExp(term)}(?:[^\\w]|$)`,
        "i"
      );
      return pattern.test(value);
    });
  }

  function protectTerms(text) {
    let value = String(text || "");
    const terms = [];

    for (const term of [...DNT_TERMS].sort((a, b) => b.length - a.length)) {
      const pattern = new RegExp(
        `(?:^|[^\\w])${escapeRegExp(term)}(?:[^\\w]|$)`,
        "gi"
      );
      value = value.replace(pattern, (match) => {
        const start = match.toLowerCase().indexOf(term.toLowerCase());
        const prefix = match.slice(0, start);
        const suffix = match.slice(start + term.length);
        const token = `[[${terms.length}]]`;
        terms.push({ token, original: term });
        return `${prefix}${token}${suffix}`;
      });
    }

    return { text: value, terms };
  }

  function restoreTerms(text, terms) {
    let value = canonicalizeTokens(text).replace(
      /\[\s*\[\s*(\d+)\s*\]\s*\]/g,
      (_match, number) => `[[${number}]]`
    );
    for (const item of terms || []) {
      if (value.split(item.token).length - 1 !== 1) return null;
      value = value.split(item.token).join(item.original);
    }
    return value;
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    canonicalizeTokens,
    redactSensitive,
    restoreSensitive,
    protectTerms,
    restoreTerms,
    isCriticalText
  };
})(globalThis);
