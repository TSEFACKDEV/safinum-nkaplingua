/**
 * NkapLingua — background.
 * Chrome : service worker. Firefox : event page (`background.scripts`).
 *
 * Rôle :
 *  - faire le lien entre le content script et le backend local ;
 *  - cacher les traductions pour éviter les appels répétés ;
 *  - ajouter un menu contextuel "Traduire la sélection".
 *
 * Aucune donnée de formulaire, aucun cookie et aucun header d'authentification
 * ne sont lus ou transmis ici.
 */

// Chrome expose `chrome`, Firefox expose `browser` (API à promesses).
// Ce petit alias permet le même code dans les deux navigateurs.
const api = globalThis.browser ?? globalThis.chrome;

const API_BASE = "http://127.0.0.1:8000";
const DEFAULT_TARGET = "fub";
const CACHE_LIMIT = 500;
const REQUEST_TIMEOUT_MS = 30000;

const cache = new Map();

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
    translateSegments(message.segments || [], message.target || DEFAULT_TARGET)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));
    return true;
  }

  if (message?.type === "NK_TRANSLATE_TEXT") {
    translateText(message.text || "", message.target || DEFAULT_TARGET)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error) }));
    return true;
  }

  return false;
});

async function translateText(text, target) {
  const clean = String(text || "").trim();
  if (!clean) return { translation: null, error: "empty_text" };

  const result = await translateSegments(
    [{ id: "text", text: clean, context: "" }],
    target
  );

  if (result.error) return result;
  return { translation: result.translations?.[0] || null };
}

async function translateSegments(segments, target) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { translations: [] };
  }

  const results = new Map();
  const missing = [];

  for (const segment of segments) {
    const key = `${target}:${segment.text}`;
    if (cache.has(key)) {
      results.set(segment.id, { ...cache.get(key), id: segment.id });
    } else {
      missing.push(segment);
    }
  }

  if (missing.length > 0) {
    const payload = {
      target,
      segments: missing.map((segment) => ({
        id: segment.id,
        text: segment.text,
        context: segment.context || ""
      }))
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`${API_BASE}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Backend HTTP ${response.status}`);
    }

    const data = await response.json();
    for (const translation of data.translations || []) {
      results.set(translation.id, translation);
      if (translation.ok) {
        const original = missing.find((item) => item.id === translation.id);
        if (original) {
          cache.set(`${target}:${original.text}`, translation);
          if (cache.size > CACHE_LIMIT) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
          }
        }
      }
    }
  }

  return {
    translations: segments
      .map((segment) => results.get(segment.id))
      .filter(Boolean)
  };
}
