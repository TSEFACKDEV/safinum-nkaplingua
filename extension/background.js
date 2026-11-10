/**
 * NkapLingua — background.
 * Chrome : service worker. Firefox : event page (`background.scripts`).
 *
 * Trois modes de traduction :
 *  1. mémoire de traduction communautaire (packs validés) ;
 *  2. backend local flagship-ai (brouillon) ou NLLB (127.0.0.1:8000) ;
 *  3. service cloud MyMemory, uniquement si l’utilisateur l’autorise
 *     explicitement (opt-in) et si la paire a un code cloud (pas l’ewondo).
 *
 * Dans tous les cas :
 *  - seuls des textes pseudonymisés sont envoyés ;
 *  - aucune valeur de formulaire, aucun cookie, aucun code PIN n’est lu ;
 *  - les montants, URLs, emails et noms sont contrôlés après traduction ;
 *  - une phrase contenant un terme du niveau A (solde, frais, PIN/OTP, etc.)
 *    n’est jamais envoyée à la MT : elle exige une entrée de pack validée.
 */

// Chrome service worker : charge le registre partagé. Firefox et les tests
// chargent `languages.js` avant ce fichier.
if (!globalThis.NK_LANGUAGES && typeof importScripts === "function") {
  importScripts("languages.js");
}

// Chrome expose `chrome`, Firefox expose `browser` (API à promesses).
const api = globalThis.browser ?? globalThis.chrome;
const LANG = globalThis.NK_LANGUAGES;

if (!LANG) {
  console.error("[NkapLingua] languages.js doit être chargé avant background.js");
}

const LOCAL_API = "http://127.0.0.1:8000";
const CLOUD_API = "https://api.mymemory.translated.net/get";
const DEFAULT_TARGET = "fub";
const CACHE_LIMIT = 500;
const LOCAL_TIMEOUT_MS = 120000;
const LOCAL_HEALTH_TIMEOUT_MS = 900;
const CLOUD_TIMEOUT_MS = 25000;
const CLOUD_CONCURRENCY = 3;

// "auto" = local d’abord, cloud ensuite. "local" ou "cloud" forcent un mode.
const TRANSLATION_MODE = "auto";

const cache = new Map();
const packCache = new Map();
const packIndexes = new WeakMap();
let localAvailable = null;

api.runtime.onInstalled.addListener(() => {
  // Firefox et Chrome ne gèrent pas les callbacks de la même façon.
  // On supprime puis on recrée après un court délai, en ignorant les erreurs
  // de doublon éventuelles.
  Promise.resolve(api.contextMenus.removeAll()).catch(() => {});
  setTimeout(() => {
    Promise.resolve(
      api.contextMenus.create({
        id: "nkaplingua-translate-selection",
        title: "Traduire la sélection avec NkapLingua",
        contexts: ["selection"]
      })
    ).catch(() => {});
  }, 100);
});

api.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "nkaplingua-translate-selection" || !tab?.id) return;
  api.tabs
    .sendMessage(tab.id, { type: "NK_TRANSLATE_SELECTION" })
    .catch(() => {
      // Le content script n'est peut-être pas encore injecté : on l'injecte
      // puis on réessaie une fois.
      api.scripting
        .executeScript({
          target: { tabId: tab.id },
          files: ["languages.js", "content.js"]
        })
        .then(() =>
          api.tabs.sendMessage(tab.id, { type: "NK_TRANSLATE_SELECTION" })
        )
        .catch(() => {});
    });
});

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "NK_GET_LANGUAGES") {
    sendResponse({
      targets: LANG ? LANG.listTargets() : [],
      defaultTarget: DEFAULT_TARGET
    });
    return true;
  }

  if (message?.type === "NK_DETECT_LANGUAGE") {
    sendResponse(
      LANG
        ? LANG.detectLanguage(message.text || "", message.hint || "")
        : { code: "unknown", confidence: 0 }
    );
    return true;
  }

  if (message?.type === "NK_TRANSLATE_SEGMENTS") {
    translateSegments(
      message.segments || [],
      message.target || DEFAULT_TARGET,
      message.source,
      { demo: Boolean(message.demo) }
    )
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));
    return true;
  }

  if (message?.type === "NK_TRANSLATE_TEXT") {
    translateText(
      message.text || "",
      message.target || DEFAULT_TARGET,
      message.source,
      Boolean(message.demo)
    )
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));
    return true;
  }

  return false;
});

/* ------------------------------------------------------------------ */
/* Détection de langue                                                */
/* ------------------------------------------------------------------ */

function detectSourceLanguage(text, hint) {
  const info = LANG
    ? LANG.detectLanguage(text, hint)
    : { code: "fr", confidence: 0 };
  return info.code === "en" ? "en" : "fr";
}

/* ------------------------------------------------------------------ */
/* Entrée publique                                                    */
/* ------------------------------------------------------------------ */

async function translateText(text, target, source, demo = false) {
  const clean = String(text || "").trim();
  if (!clean) return { translation: null, error: "empty_text" };

  const detectedInfo = LANG
    ? LANG.detectLanguage(clean, "")
    : { code: "fr", confidence: 0 };
  const detected = source || (detectedInfo.code === "en" ? "en" : "fr");
  const result = await translateSegments(
    [{ id: "text", text: clean }],
    target,
    detected,
    { demo }
  );

  if (result.error) return result;
  return {
    translation: result.translations?.[0] || null,
    provider: result.provider || null,
    detected: detectedInfo
  };
}

const CRITICALITY_TERMS =
  /\b(solde|frais|montant|total|beneficiaire|pin|otp|confirmer|confirmation|annuler|annulation|erreur|securite|reessayer|reference|transaction|paiement|virement|transfert|compte|debit|credit|taux|interet|echeance|penalite|retard|echec)\b/i;

/**
 * Niveau A : segment critique (solde, frais, PIN, confirmation, erreur…).
 * Il ne peut venir que d'un pack validé, jamais d'une MT ni d'un fuzzy.
 */
function classifyCriticality(text) {
  const normalized = String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return CRITICALITY_TERMS.test(normalized) ? "A" : "B";
}

function isUnchangedLiteral(text) {
  let residue = String(text || "").replace(/\[\[[^\]]+\]\]/g, " ");
  residue = residue.replace(
    /\b(?:FCFA|XAF|PIN|OTP|KYC|FINAKA|MTN|MoMo|Orange Money|Wave|Visa|Mastercard|WhatsApp|IBAN|SWIFT)\b/gi,
    " "
  );
  residue = residue.replace(/\b[A-Z]{1,4}\b/g, " ");
  residue = residue.replace(/[0-9\s.,;:+\-–—/()%·]/g, " ");
  return !/[A-Za-zÀ-ÖØ-öø-ÿɓɗŋƴɔɛə]/.test(residue);
}

function isShortLabel(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 4;
}

async function translateSegments(segments, target, source, options = {}) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { translations: [], provider: null };
  }
  const demoMode = Boolean(options.demo);

  const targetSpec = LANG?.getTarget(target);
  if (!targetSpec) {
    return {
      translations: [],
      provider: null,
      error: `Langue cible non supportée : ${target}`
    };
  }

  // MyMemory n'a pas de paire pour l'ewondo : on ne l'appelle jamais avec
  // un code cloud absent (sinon on traduirait vers le fulfulde par erreur).
  const allowCloud =
    Boolean(targetSpec.cloudCode) && (await cloudAllowed());

  // Deuxième barrière de pseudonymisation : elle protège aussi les appels
  // directs au background (popup « texte inédit », test, futur client).
  const prepared = segments.map((segment) => {
    const redaction = LANG.redactSensitive(segment.text || "");
    return {
      ...segment,
      text: redaction.text,
      tokens: redaction.tokens,
      originalText: segment.text || "",
      criticality: classifyCriticality(segment.text || "")
    };
  });
  const preparedById = new Map(
    prepared.map((segment) => [segment.id, segment])
  );

  const detected =
    source ||
    detectSourceLanguage(
      prepared.map((segment) => segment.originalText).join(" ")
    );

  const results = new Map();
  const missing = [];

  for (const segment of prepared) {
    // Montant, référence ou nom seuls : rien à traduire, on renvoie
    // l'original sans appeler ni pack ni MT.
    if (isUnchangedLiteral(segment.originalText)) {
      results.set(segment.id, {
        id: segment.id,
        text: segment.originalText,
        ok: true,
        reason: null,
        unchanged: true
      });
      continue;
    }

    // Le niveau A ne lit jamais le cache : il doit être validé dans le pack.
    if (segment.criticality === "A") {
      missing.push(segment);
      continue;
    }
    const key = `${detected}:${target}:${segment.originalText}`;
    if (cache.has(key)) {
      results.set(segment.id, { ...cache.get(key), id: segment.id });
    } else {
      missing.push(segment);
    }
  }

  if (missing.length === 0) {
    return {
      translations: segments
        .map((segment) => results.get(segment.id))
        .filter(Boolean),
      provider: null
    };
  }

  let provider = null;
  let remaining = missing;
  let usedCloudLabels = false;
  let usedPack = false;
  let usedMt = false;
  let packMisses = [];

  // 1) Pack communautaire : prioritaire, car il contient des phrases
  //    relues par des locuteurs natifs.
  if (targetSpec.pack) {
    let packResults = [];
    try {
      packResults = await translateWithPack(missing, targetSpec, {
        demo: demoMode
      });
    } catch (error) {
      if (targetSpec.engine === "pack") {
        return {
          translations: [],
          provider: null,
          error: `Pack ${targetSpec.label} indisponible : ${String(error)}`
        };
      }
      // Pour une cible MT, un pack absent ne doit pas bloquer le moteur.
    }

    const hits = packResults.filter((translation) => translation.ok);
    packMisses = packResults.filter((translation) => !translation.ok);
    for (const translation of hits) {
      const final = finalizeTranslation(
        translation,
        preparedById.get(translation.id)
      );
      results.set(final.id, final);
      const original = missing.find((item) => item.id === translation.id);
      // Un pack humain non validé ne doit jamais contaminer le cache du mode
      // strict : seules les entrées `validated` sont mémorisées.
      if (original && final.packStatus === "validated") {
        cacheTranslation(detected, target, original.originalText, final);
      }
    }
    if (hits.length > 0) {
      provider = "pack";
      usedPack = true;
    }

    if (targetSpec.engine === "pack") {
      for (const translation of packResults) {
        const final = finalizeTranslation(
          translation,
          preparedById.get(translation.id)
        );
        results.set(final.id, final);
      }
      // Niveau A absent du pack : original conservé, aucun moteur MT.
      for (const segment of missing) {
        if (segment.criticality !== "A") continue;
        if (results.get(segment.id)?.ok) continue;
        results.set(segment.id, {
          id: segment.id,
          text: segment.originalText,
          ok: false,
          reason: "untranslated_critical",
          criticality: "A"
        });
      }
      return {
        translations: segments
          .map((segment) => results.get(segment.id))
          .filter(Boolean),
        provider: "pack",
        detected
      };
    }

    remaining = missing.filter(
      (segment) => !hits.some((translation) => translation.id === segment.id)
    );
  }

  // Mode démo SAFINUM : MyMemory (fr|ff) est bien meilleur que le modèle
  // local sur les libellés courts du site (Montant, Sécurité, Confirmation…).
  // On le tente en premier uniquement pour ces libellés, et uniquement si
  // l'utilisateur a explicitement autorisé le cloud.
  if (demoMode && allowCloud && targetSpec.cloudCode) {
    const shortLabels = remaining.filter((segment) =>
      isShortLabel(segment.originalText)
    );
    if (shortLabels.length > 0) {
      try {
        const cloudResults = await translateWithCloud(
          shortLabels,
          detected,
          targetSpec
        );
        const cloudById = new Map(
          cloudResults.map((translation) => [translation.id, translation])
        );
        const hitIds = new Set();
        for (const segment of shortLabels) {
          const result = cloudById.get(segment.id);
          if (!result?.ok) continue;
          const prepared = preparedById.get(segment.id);
          const final = finalizeTranslation(result, prepared);
          if (!final.ok) continue;
          if (demoMode && prepared?.criticality === "A") {
            final.demoCritical = true;
          }
          results.set(final.id, final);
          hitIds.add(segment.id);
        }
        if (hitIds.size > 0) {
          usedCloudLabels = true;
          usedMt = true;
          provider = "cloud";
          remaining = remaining.filter(
            (segment) => !hitIds.has(segment.id)
          );
        }
      } catch {
        // MyMemory indisponible : le moteur local reste prioritaire.
      }
    }
  }

  // Niveau A absent du pack : en mode strict, on conserve l'original et on
  // ne contacte jamais le backend local ni le cloud. En mode démo SAFINUM
  // (site fictif), la MT est autorisée mais le résultat sera marqué
  // `demoCritical` et affiché avec un badge « démo MT ».
  if (!demoMode) {
    const criticalMisses = remaining.filter(
      (segment) => segment.criticality === "A"
    );
    for (const segment of criticalMisses) {
      results.set(segment.id, {
        id: segment.id,
        text: segment.originalText,
        ok: false,
        reason: "untranslated_critical",
        criticality: "A"
      });
    }
    remaining = remaining.filter((segment) => segment.criticality !== "A");
  }

  if (remaining.length === 0) {
    if (usedPack && usedMt) {
      provider = "mixed";
    } else if (usedCloudLabels && provider && provider !== "cloud") {
      provider = "hybrid";
    }
    return {
      translations: segments
        .map((segment) => results.get(segment.id))
        .filter(Boolean),
      provider
    };
  }

  // Protection des termes critiques avant le moteur MT (FCFA, PIN, etc.).
  // Les packs, eux, sont cherchés sur le texte brut pour rester compatibles
  // avec les entrées validées.
  for (const segment of remaining) {
    const protectedTerms = LANG.protectTerms(segment.text);
    segment.text = protectedTerms.text;
    segment.terms = protectedTerms.terms;
  }

  // 2) Backend local.
  let translations = null;
  if (TRANSLATION_MODE !== "cloud" && (await isLocalAvailable())) {
    try {
      const local = await translateWithLocal(
        remaining,
        targetSpec.code,
        detected
      );
      translations = local.translations;
      usedMt = true;
      provider = local.provider || "local";
    } catch {
      // Le backend local a échoué : on passe au cloud.
      localAvailable = false;
    }
  }

  // 2b) Si le local est disponible mais rejette certaines phrases (jeton,
  // qualité, rétro-traduction), on demande une seconde opinion au cloud
  // pseudonymisé. Le local reste prioritaire pour les phrases acceptées.
  if (translations && allowCloud) {
    const rejected = translations.filter((translation) => !translation.ok);
    if (rejected.length > 0) {
      const rejectedSegments = remaining.filter((segment) =>
        rejected.some((translation) => translation.id === segment.id)
      );
      try {
        const fallback = await translateWithCloud(
          rejectedSegments,
          detected,
          targetSpec
        );
        const fallbackById = new Map(
          fallback.map((translation) => [translation.id, translation])
        );
        translations = translations.map((translation) => {
          const candidate = fallbackById.get(translation.id);
          return candidate?.ok ? candidate : translation;
        });
        if (fallback.some((translation) => translation.ok)) {
          provider = "cloud";
        }
      } catch {
        // Le cloud est un secours : on conserve le résultat local.
      }
    }
  }

  // 3) Cloud de secours complet si le local n'a rien produit.
  if (!translations && allowCloud) {
    try {
      translations = await translateWithCloud(remaining, detected, targetSpec);
      usedMt = true;
      provider = "cloud";
    } catch (error) {
      return {
        translations: [],
        provider: null,
        error: `Traduction indisponible : ${String(error)}`
      };
    }
  }

  if (!translations) {
    // Aucun moteur MT : on conserve le verdict du pack pour chaque phrase
    // manquante. Le content script peut ainsi tenter le repli phrase par
    // phrase au lieu d'abandonner tout le lot.
    for (const miss of packMisses) {
      if (results.has(miss.id)) continue;
      const final = finalizeTranslation(miss, preparedById.get(miss.id));
      results.set(final.id, final);
    }
    return {
      translations: segments
        .map((segment) => results.get(segment.id))
        .filter(Boolean),
      provider,
      error:
        packMisses.length > 0
          ? null
          : allowCloud
            ? "Aucun moteur de traduction disponible."
            : "Cloud désactivé et backend local indisponible. Lancez le backend ou autorisez le cloud."
    };
  }

  for (const translation of translations) {
    const prepared = preparedById.get(translation.id);
    const final = finalizeTranslation(translation, prepared);
    if (demoMode && final.ok && prepared?.criticality === "A") {
      final.demoCritical = true;
    }
    results.set(final.id, final);
    // Un niveau A traduit en mode démo n'entre jamais dans le cache MT.
    // Une entrée de pack non validée ne doit pas non plus être réutilisée
    // hors démonstration.
    if (
      final.ok &&
      prepared?.criticality !== "A" &&
      final.packStatus !== "reviewed" &&
      final.packStatus !== "draft"
    ) {
      const original = remaining.find((item) => item.id === final.id);
      if (original) {
        cacheTranslation(detected, target, original.originalText, final);
      }
    }
  }

  if (usedPack && usedMt) {
    provider = "mixed";
  } else if (usedCloudLabels && provider && provider !== "cloud") {
    provider = "hybrid";
  }

  return {
    translations: segments
      .map((segment) => results.get(segment.id))
      .filter(Boolean),
    provider,
    detected
  };
}

function cacheTranslation(source, target, text, translation) {
  cache.set(`${source}:${target}:${text}`, translation);
  if (cache.size > CACHE_LIMIT) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

function finalizeTranslation(translation, segment) {
  if (!translation || !translation.ok) return translation;

  // Une entrée de pack peut contenir les montants en clair (1 500 FCFA)
  // plutôt que des jetons. Dans ce cas, on vérifie que chaque valeur
  // sensible d'origine est bien présente, sans tenter de restaurer un jeton
  // absent.
  if (
    translation.packRaw &&
    !/\[\[[^\]]+\]\]/.test(translation.text)
  ) {
    const normalizedTarget = LANG.normalizePhrase(translation.text);
    for (const token of segment?.tokens || []) {
      if (
        !normalizedTarget.includes(
          LANG.normalizePhrase(token.original)
        )
      ) {
        return {
          id: translation.id,
          text: segment?.originalText || translation.text,
          ok: false,
          reason: "token_lost"
        };
      }
    }
    return { ...translation, text: translation.text };
  }

  const restoredSensitive = LANG.restoreSensitive(
    translation.text,
    segment?.tokens || []
  );
  if (restoredSensitive === null) {
    return {
      id: translation.id,
      text: segment?.originalText || translation.text,
      ok: false,
      reason: "token_lost"
    };
  }

  const restoredTerms = LANG.restoreTerms(
    restoredSensitive,
    segment?.terms || []
  );
  if (restoredTerms === null) {
    return {
      id: translation.id,
      text: segment?.originalText || translation.text,
      ok: false,
      reason: "token_lost:TERM"
    };
  }

  return { ...translation, text: restoredTerms };
}

/* ------------------------------------------------------------------ */
/* Packs communautaires                                               */
/* ------------------------------------------------------------------ */

async function loadPack(targetSpec) {
  const code = targetSpec.code;

  if (globalThis.__NK_PACK_OVERRIDES__?.[code]) {
    return globalThis.__NK_PACK_OVERRIDES__[code];
  }

  if (packCache.has(code)) return packCache.get(code);

  const promise = (async () => {
    const url = api.runtime.getURL(targetSpec.pack);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`pack HTTP ${response.status}`);
    }
    const pack = await response.json();
    if (!pack || !Array.isArray(pack.entries)) {
      throw new Error("format de pack invalide");
    }
    return pack;
  })();

  packCache.set(code, promise);
  return promise;
}

function packLooseKey(value) {
  return LANG
    .normalizePhrase(value)
    .replace(/[.!?;:,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function indexPack(pack) {
  if (packIndexes.has(pack)) return packIndexes.get(pack);
  const index = new Map();
  for (const entry of pack.entries || []) {
    if (!entry?.source || !entry?.target) continue;
    // Index brut, index pseudonymisé (les montants/noms de la page sont
    // remplacés par des jetons avant l'envoi au background) et variante
    // ponctuation/espaces. Les clés brutes restent prioritaires.
    const redaction = LANG.redactSensitive(entry.source);
    const redacted = redaction.text;
    // Version tokenisée de la cible : le content script envoie le texte
    // pseudonymisé, et restaure les valeurs originales localement. Sans
    // cette version, une cible humaine contenant « Safinum Pay » ou
    // « 1 500 FCFA » ne pourrait pas être validée sans faire transiter les
    // données sensibles par le background.
    let targetTokenized = entry.target;
    for (const { token, original } of redaction.tokens) {
      targetTokenized = targetTokenized.split(original).join(token);
    }
    const derived =
      targetTokenized === entry.target
        ? entry
        : { ...entry, target: targetTokenized };
    const rawKeys = new Set([
      LANG.normalizePhrase(entry.source),
      packLooseKey(entry.source)
    ]);
    const redactedKeys = new Set([
      LANG.normalizePhrase(redacted),
      packLooseKey(redacted)
    ]);
    for (const key of rawKeys) {
      if (key && !index.has(key)) index.set(key, entry);
    }
    for (const key of redactedKeys) {
      if (key && !index.has(key)) index.set(key, derived);
    }
  }
  packIndexes.set(pack, index);
  return index;
}

async function translateWithPack(segments, targetSpec, options = {}) {
  const pack = await loadPack(targetSpec);
  const index = indexPack(pack);

  return segments.map((segment) => {
    // Politique produit : hors démo, les brouillons humains sont utilisables
    // pour le niveau B/C, jamais pour le niveau A. Le toast indique le nombre
    // d'entrées de pack non validées utilisées.
    const allowUnvalidated =
      options.demo === true || segment.criticality !== "A";
    // On cherche d'abord le texte brut : les messages humains du site
    // contiennent des montants réels (1 500 FCFA), pas des jetons.
    // Le texte pseudonymisé reste le repli pour les packs à jetons.
    const rawKey = LANG.normalizePhrase(
      segment.originalText || segment.text
    );
    const redactedKey = LANG.normalizePhrase(segment.text);
    const looseRawKey = packLooseKey(segment.originalText || segment.text);
    const looseRedactedKey = packLooseKey(segment.text);
    const entry =
      index.get(rawKey) ||
      index.get(redactedKey) ||
      index.get(looseRawKey) ||
      index.get(looseRedactedKey);

    if (!entry) {
      return {
        id: segment.id,
        text: segment.text,
        ok: false,
        reason: "pack_miss"
      };
    }

    const accepted =
      entry.status === "validated" ||
      (allowUnvalidated &&
        (entry.status === "reviewed" || entry.status === "draft"));
    if (!accepted) {
      return {
        id: segment.id,
        text: segment.text,
        ok: false,
        reason: "pack_unverified",
        packStatus: entry.status,
        reviewLevel: entry.reviewLevel || null
      };
    }

    const translation = LANG.canonicalizeTokens(entry.target);
    const targetHasTokens = /\[\[[^\]]+\]\]/.test(translation);
    const sourceForValidation = targetHasTokens
      ? segment.text
      : LANG.restoreSensitive(
          segment.text,
          segment.tokens || []
        ) || segment.originalText || segment.text;
    const validation = validateTranslation(
      sourceForValidation,
      translation,
      targetSpec
    );

    return {
      id: segment.id,
      text: validation.ok ? translation : segment.text,
      ok: validation.ok,
      reason: validation.reason,
      packStatus: entry.status,
      reviewLevel: entry.reviewLevel || null,
      provenance: entry.provenance || null,
      humanReviewed: entry.status !== "validated",
      packRaw: !targetHasTokens,
      criticality: segment.criticality
    };
  });
}

/* ------------------------------------------------------------------ */
/* Backend local                                                      */
/* ------------------------------------------------------------------ */

async function cloudAllowed() {
  if (TRANSLATION_MODE === "local") return false;
  try {
    const stored = await api.storage?.local?.get("nkCloudFallback");
    // Opt-in explicite : l'absence de choix vaut refus. MyMemory n'est
    // jamais contacté par défaut (audit R7, défaut local-only).
    return stored?.nkCloudFallback === true;
  } catch {
    return false;
  }
}

async function isLocalAvailable() {
  if (TRANSLATION_MODE === "cloud") return false;
  if (localAvailable !== null) return localAvailable;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    LOCAL_HEALTH_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${LOCAL_API}/health`, {
      signal: controller.signal
    });
    localAvailable = response.ok;
  } catch {
    localAvailable = false;
  } finally {
    clearTimeout(timeout);
  }

  return localAvailable;
}

async function translateWithLocal(segments, target, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${LOCAL_API}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        target,
        // `context` n'est jamais transmis : il peut contenir un textarea,
        // une zone [data-sensitive] ou des montants non tokenisés (M1).
        segments: segments.map((segment) => ({
          id: segment.id,
          text: segment.text
        }))
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Backend HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.translations)) {
    throw new Error("Réponse backend invalide.");
  }
  return {
    translations: data.translations,
    provider: data.provider || "local",
    model: data.model || null
  };
}

/* ------------------------------------------------------------------ */
/* Service cloud (MyMemory)                                           */
/* ------------------------------------------------------------------ */

async function translateWithCloud(segments, source, targetSpec) {
  if (!targetSpec.cloudCode) {
    throw new Error(`Cloud non disponible pour ${targetSpec.label}.`);
  }
  const sourceCode = source === "en" ? "en" : "fr";
  const results = await mapWithConcurrency(
    segments,
    CLOUD_CONCURRENCY,
    (segment) => translateCloudSegment(segment, sourceCode, targetSpec)
  );
  return results;
}

async function translateCloudSegment(segment, sourceCode, targetSpec) {
  const { cloudText, tokenMap } = toCloudPlaceholders(segment.text);
  if (!cloudText.trim()) {
    return {
      id: segment.id,
      text: segment.text,
      ok: false,
      reason: "empty_text"
    };
  }

  const params = new URLSearchParams({
    q: cloudText,
    langpair: `${sourceCode}|${targetSpec.cloudCode}`
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLOUD_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${CLOUD_API}?${params.toString()}`, {
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Cloud HTTP ${response.status}`);
  }

  const data = await response.json();
  if (Number(data?.responseStatus) !== 200) {
    throw new Error(data?.responseDetails || "Cloud response error");
  }

  const matchScore = Number(data?.responseData?.match || 0);
  if (matchScore > 0 && matchScore < 0.6) {
    return {
      id: segment.id,
      text: segment.text,
      ok: false,
      reason: "cloud_low_match"
    };
  }

  const translated = decodeHtml(
    String(data?.responseData?.translatedText || "")
  ).trim();

  if (!translated) {
    return {
      id: segment.id,
      text: segment.text,
      ok: false,
      reason: "cloud_empty"
    };
  }

  const restored = restoreCloudTokens(translated, tokenMap);
  if (!restored) {
    return {
      id: segment.id,
      text: segment.text,
      ok: false,
      reason: "token_lost"
    };
  }

  const validation = validateTranslation(
    segment.text,
    restored,
    targetSpec
  );
  return {
    id: segment.id,
    text: validation.ok ? restored : segment.text,
    ok: validation.ok,
    reason: validation.reason
  };
}

function toCloudPlaceholders(text) {
  const tokenMap = new Map();
  let index = 0;

  const cloudText = String(text || "").replace(
    /\[\[(NUM|URL|EMAIL|NAME|TERM)_(\d+)\]\]/g,
    (match) => {
      const token = `[[C${index++}]]`;
      tokenMap.set(token, match);
      return token;
    }
  );

  return { cloudText, tokenMap };
}

function restoreCloudTokens(text, tokenMap) {
  let value = String(text || "").replace(
    /\[\s*\[\s*C\s*(\d+)\s*\]\s*\]/g,
    (_match, number) => `[[C${number}]]`
  );

  for (const [token, original] of tokenMap) {
    const occurrences = value.split(token).length - 1;
    if (occurrences !== 1) return null;
    value = value.split(token).join(original);
  }
  return value;
}

const TECHNICAL_IDENTITIES = new Set([
  "code",
  "code pin",
  "code de confirmation",
  "code confirmation",
  "mobile money",
  "safinum",
  "safinum pay",
  "finaka",
  "fcfa",
  "xaf",
  "pin",
  "otp",
  "kyc",
  "live",
  "sms",
  "fr → ff",
  "fr -> ff",
  "amina ngo bell",
  "mtn",
  "momo",
  "orange money",
  "wave",
  "visa",
  "mastercard",
  "whatsapp",
  "iban",
  "swift"
]);

function isTechnicalIdentity(value) {
  const text = String(value).trim();
  const normalized = LANG.normalizePhrase(text);
  if (TECHNICAL_IDENTITIES.has(normalized)) return true;
  if (/^[A-Z]{2,}-\d{4}-[A-Z0-9]{4,}$/.test(text)) return true;
  const residue = text
    .replace(/\[\[[^\]]+\]\]/g, " ")
    .replace(
      /\b(?:FCFA|XAF|PIN|OTP|KYC|FINAKA|MTN|MoMo|Orange Money|Wave|Visa|Mastercard|WhatsApp|IBAN|SWIFT)\b/gi,
      " "
    )
    .replace(/[^\wà-ÿ]/gi, " ");
  return !/[a-zà-ÿɓɗŋƴɔɛə]/i.test(residue);
}

function rawNumbers(value) {
  const cleaned = String(value).replace(/\[\[[^\]]+\]\]/g, " ");
  return (cleaned.match(/\d+(?:[.,]\d+)?/g) || []);
}

function validateTranslation(source, translation, targetSpec) {
  if (!translation.trim()) {
    return { ok: false, reason: "empty_translation" };
  }

  const tokenPattern = /\[\[\s*(NUM|URL|EMAIL|NAME|TERM)\s*_\s*(\d+)\s*\]\]/gi;
  const sourceTokens = [
    ...String(source).matchAll(tokenPattern)
  ].map((match) => `[[${match[1].toUpperCase()}_${match[2]}]]`);
  const normalized = LANG
    ? LANG.canonicalizeTokens(translation)
    : String(translation);

  for (const token of sourceTokens) {
    if (normalized.split(token).length - 1 !== 1) {
      return { ok: false, reason: `token_lost:${token}` };
    }
  }

  const bareTokens = [
    ...String(source).matchAll(/\[\[(\d+)\]\]/g)
  ].map((match) => `[[${match[1]}]]`);
  for (const token of bareTokens) {
    if (normalized.split(token).length - 1 !== 1) {
      return { ok: false, reason: `token_lost:${token}` };
    }
  }

  const criticalTerms = ["FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA"];
  for (const term of criticalTerms) {
    if (hasWord(source, term) && !hasWord(normalized, term)) {
      if (term === "FCFA" && /F\s*CFA/i.test(normalized)) continue;
      return { ok: false, reason: `dnt_missing:${term}` };
    }
  }

  // Les montants en clair doivent être présents à l'identique.
  const flatTranslation = normalized.replace(
    /(?<=\d)[\s\u00A0]+(?=\d)/g,
    ""
  );
  for (const number of rawNumbers(source)) {
    if (!flatTranslation.includes(number)) {
      return { ok: false, reason: `number_lost:${number}` };
    }
  }

  // Un sigle, un nom propre ou une ligne de montant peut rester identique.
  if (
    LANG.normalizePhrase(source) === LANG.normalizePhrase(normalized) &&
    isTechnicalIdentity(source)
  ) {
    return { ok: true, reason: null };
  }

  // Le pack doit rester dans la même variété linguistique que la cible.
  if (targetSpec?.engine === "pack" && !normalized.trim()) {
    return { ok: false, reason: "pack_empty_target" };
  }

  const quality = qualityCheck(source, normalized);
  if (!quality.ok) return quality;

  return { ok: true, reason: null };
}

function qualityCheck(source, translation) {
  const clean = (value) =>
    LANG
      .normalizePhrase(value)
      .replace(/\[\[[^\]]+\]\]/g, " ")
      .replace(/[^a-zà-ÿ0-9'ɓɗŋƴɔɛə\u0300-\u036f]+/g, " ")
      .trim();

  const sourceClean = clean(source);
  const targetClean = clean(translation);
  if (!targetClean) return { ok: false, reason: "empty_translation" };
  if (sourceClean === targetClean) {
    return { ok: false, reason: "untranslated" };
  }

  const sourceWords = sourceClean.split(/\s+/).filter(Boolean);
  const targetWords = targetClean.split(/\s+/).filter(Boolean);
  if (sourceWords.length >= 4) {
    if (targetWords.length < Math.max(2, Math.floor(sourceWords.length * 0.35))) {
      return { ok: false, reason: "too_short" };
    }
    if (targetWords.length > Math.max(12, Math.floor(sourceWords.length * 3))) {
      return { ok: false, reason: "too_long" };
    }
    if (targetWords.length >= 8) {
      const uniqueRatio = new Set(targetWords).size / targetWords.length;
      if (uniqueRatio < 0.3) {
        return { ok: false, reason: "repetitive" };
      }
      const frenchLeak = new Set([
        "le", "la", "les", "des", "une", "et", "est", "sont", "pour",
        "avec", "votre", "vos", "vous", "nous", "du", "de", "dans",
        "sur", "ce", "cette", "ces", "qui", "que", "au", "aux", "par"
      ]);
      const leak = targetWords.filter((word) => frenchLeak.has(word)).length;
      if (leak / targetWords.length > 0.25) {
        return { ok: false, reason: "french_leak" };
      }
    }
  }

  return { ok: true, reason: null };
}

function hasWord(text, term) {
  return new RegExp(`(?:^|[^\\w])${escapeRegExp(term)}(?:[^\\w]|$)`, "i").test(
    String(text || "")
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

async function mapWithConcurrency(items, limit, mapper) {
  const output = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      output[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return output;
}
