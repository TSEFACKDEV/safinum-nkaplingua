/**
 * NkapLingua — background.
 * Chrome : service worker. Firefox : event page (`background.scripts`).
 *
 * Le prototype fonctionne de deux façons :
 *  1. backend local NLLB (127.0.0.1:8000) si disponible ;
 *  2. service cloud MyMemory en secours, pour qu’un simple fichier
 *     d’extension fonctionne sans installation Python.
 *
 * Dans les deux cas :
 *  - seuls des textes pseudonymisés sont envoyés ;
 *  - aucune valeur de formulaire, aucun cookie, aucun code PIN n’est lu ;
 *  - les montants, URLs et emails sont contrôlés après traduction.
 */

// Chrome expose `chrome`, Firefox expose `browser` (API à promesses).
const api = globalThis.browser ?? globalThis.chrome;

const LOCAL_API = "http://127.0.0.1:8000";
const CLOUD_API = "https://api.mymemory.translated.net/get";
const DEFAULT_TARGET = "fub";
const CLOUD_TARGET = "ff";
const CACHE_LIMIT = 500;
const LOCAL_TIMEOUT_MS = 120000;
const LOCAL_HEALTH_TIMEOUT_MS = 900;
const CLOUD_TIMEOUT_MS = 25000;
const CLOUD_CONCURRENCY = 3;

// "auto" = local d’abord, cloud ensuite. "local" ou "cloud" forcent un mode.
const TRANSLATION_MODE = "auto";

const cache = new Map();
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
        .executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
        .then(() =>
          api.tabs.sendMessage(tab.id, { type: "NK_TRANSLATE_SELECTION" })
        )
        .catch(() => {});
    });
});

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "NK_TRANSLATE_SEGMENTS") {
    translateSegments(
      message.segments || [],
      message.target || DEFAULT_TARGET,
      message.source
    )
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));
    return true;
  }

  if (message?.type === "NK_TRANSLATE_TEXT") {
    translateText(
      message.text || "",
      message.target || DEFAULT_TARGET,
      message.source
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

const FRENCH_HINTS = [
  " le ", " la ", " les ", " des ", " une ", " un ", " est ", " sont ",
  " pour ", " avec ", " votre ", " vos ", " vous ", " nous ", " frais ",
  " solde ", " compte ", " transfert ", " paiement ", " code ",
  " confirmation ", " bénéficiaire ", " montant ", " transaction "
];
const ENGLISH_HINTS = [
  " the ", " and ", " is ", " are ", " for ", " with ", " your ", " you ",
  " we ", " account ", " balance ", " fees ", " transfer ", " payment ",
  " code ", " confirmation ", " beneficiary ", " amount ", " transaction "
];

function detectSourceLanguage(text) {
  const value = ` ${String(text || "").toLowerCase()} `;
  let french = 0;
  let english = 0;

  for (const hint of FRENCH_HINTS) {
    french += value.split(hint).length - 1;
  }
  for (const hint of ENGLISH_HINTS) {
    english += value.split(hint).length - 1;
  }

  return english > french * 1.2 ? "en" : "fr";
}

/* ------------------------------------------------------------------ */
/* Entrée publique                                                    */
/* ------------------------------------------------------------------ */

async function translateText(text, target, source) {
  const clean = String(text || "").trim();
  if (!clean) return { translation: null, error: "empty_text" };

  const detected = source || detectSourceLanguage(clean);
  const result = await translateSegments(
    [{ id: "text", text: clean, context: "" }],
    target,
    detected
  );

  if (result.error) return result;
  return {
    translation: result.translations?.[0] || null,
    provider: result.provider || null
  };
}

async function translateSegments(segments, target, source) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { translations: [], provider: null };
  }

  const detected =
    source ||
    detectSourceLanguage(
      segments.map((segment) => segment.text || "").join(" ")
    );

  const results = new Map();
  const missing = [];

  for (const segment of segments) {
    const key = `${detected}:${target}:${segment.text}`;
    if (cache.has(key)) {
      results.set(segment.id, { ...cache.get(key), id: segment.id });
    } else {
      missing.push(segment);
    }
  }

  if (missing.length > 0) {
    let translations = null;
    let provider = null;

    if (TRANSLATION_MODE !== "cloud" && (await isLocalAvailable())) {
      try {
        translations = await translateWithLocal(missing, target, detected);
        provider = "local";
      } catch {
        // Le backend local a échoué : on passe au cloud.
        localAvailable = false;
      }
    }

    if (!translations && TRANSLATION_MODE !== "local") {
      try {
        translations = await translateWithCloud(missing, detected);
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
      return {
        translations: [],
        provider: null,
        error: "Aucun moteur de traduction disponible."
      };
    }

    for (const translation of translations) {
      results.set(translation.id, translation);
      if (translation.ok) {
        const original = missing.find((item) => item.id === translation.id);
        if (original) {
          cache.set(`${detected}:${target}:${original.text}`, translation);
          if (cache.size > CACHE_LIMIT) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
        }
      }
    }

    return {
      translations: segments
        .map((segment) => results.get(segment.id))
        .filter(Boolean),
      provider
    };
  }

  return {
    translations: segments
      .map((segment) => results.get(segment.id))
      .filter(Boolean),
    provider: null
  };
}

/* ------------------------------------------------------------------ */
/* Backend local                                                      */
/* ------------------------------------------------------------------ */

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
        segments: segments.map((segment) => ({
          id: segment.id,
          text: segment.text,
          context: segment.context || ""
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
  return data.translations;
}

/* ------------------------------------------------------------------ */
/* Service cloud (MyMemory)                                           */
/* ------------------------------------------------------------------ */

async function translateWithCloud(segments, source) {
  const sourceCode = source === "en" ? "en" : "fr";
  const results = await mapWithConcurrency(
    segments,
    CLOUD_CONCURRENCY,
    (segment) => translateCloudSegment(segment, sourceCode)
  );
  return results;
}

async function translateCloudSegment(segment, sourceCode) {
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
    langpair: `${sourceCode}|${CLOUD_TARGET}`
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

  const validation = validateCloud(segment.text, restored);
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
    /\[\[(NUM|URL|EMAIL)_(\d+)\]\]/g,
    (match) => {
      const token = `[[${index++}]]`;
      tokenMap.set(token, match);
      return token;
    }
  );

  return { cloudText, tokenMap };
}

function restoreCloudTokens(text, tokenMap) {
  let value = String(text || "").replace(
    /\[\s*\[\s*(\d+)\s*\]\s*\]/g,
    (_match, number) => `[[${number}]]`
  );

  for (const [token, original] of tokenMap) {
    const occurrences = value.split(token).length - 1;
    if (occurrences !== 1) return null;
    value = value.split(token).join(original);
  }
  return value;
}

function validateCloud(source, translation) {
  if (!translation.trim()) {
    return { ok: false, reason: "empty_translation" };
  }

  const tokens = [
    ...String(source).matchAll(/\[\[(NUM|URL|EMAIL)_(\d+)\]\]/g)
  ].map((match) => match[0]);

  for (const token of tokens) {
    if (translation.split(token).length - 1 !== 1) {
      return { ok: false, reason: `token_lost:${token}` };
    }
  }

  const criticalTerms = ["FCFA", "XAF", "PIN", "OTP", "KYC", "FINAKA"];
  for (const term of criticalTerms) {
    if (hasWord(source, term) && !hasWord(translation, term)) {
      if (term === "FCFA" && /F\s*CFA/i.test(translation)) continue;
      return { ok: false, reason: `dnt_missing:${term}` };
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
