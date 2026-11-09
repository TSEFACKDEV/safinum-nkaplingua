/**
 * NkapLingua — content script.
 *
 * Principe :
 *  - on ne touche jamais au HTML du site ;
 *  - on remplace uniquement des nœuds texte et quelques attributs sûrs ;
 *  - on conserve les liens, les écouteurs d'événements et la mise en page ;
 *  - on peut restaurer l'original à tout moment ;
 *  - les champs de formulaire, mots de passe et OTP ne sont jamais lus.
 */

(() => {
  if (window.__NKAPLINGUA__) return;
  window.__NKAPLINGUA__ = true;

  // Chrome : `chrome` ; Firefox : `browser` (API à promesses).
  const api = globalThis.browser ?? globalThis.chrome;
  const LANG = globalThis.NK_LANGUAGES;

  if (!LANG) {
    console.error("[NkapLingua] languages.js doit être chargé avant content.js");
    return;
  }

  const BATCH_SIZE = 8;
  const MAX_TEXT_ITEMS = 180;
  const MAX_ATTRIBUTE_ITEMS = 60;

  // Badge provisoire du niveau A non traduit. Style aligné sur la charte
  // (or #C9A45C) ; Freedy peut le remplacer sans changer le marqueur.
  const BADGE_STYLE = `
    [data-nk-untranslated="A"]::after {
      content: "non traduit";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #c9a45c;
      border-radius: 999px;
      background: #fff8e1;
      color: #5c4a12;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
    [data-nk-untranslated="B"]::after {
      content: "non traduit";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #9ca3af;
      border-radius: 999px;
      background: #f3f4f6;
      color: #4b5563;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
    [data-nk-demo-critical="A"]::after {
      content: "démo MT";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #0284c7;
      border-radius: 999px;
      background: #e0f2fe;
      color: #075985;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
    [data-nk-human-reviewed="reviewed"]::after {
      content: "humain non validé";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #0f766e;
      border-radius: 999px;
      background: #ccfbf1;
      color: #115e59;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
    [data-nk-human-reviewed="draft"]::after {
      content: "brouillon humain";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #b45309;
      border-radius: 999px;
      background: #fef3c7;
      color: #92400e;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
    [data-nk-human-reviewed="editorial"]::after {
      content: "brouillon éditorial";
      display: inline-block;
      margin-left: 6px;
      padding: 0 6px;
      border: 1px solid #7c3aed;
      border-radius: 999px;
      background: #ede9fe;
      color: #5b21b6;
      font: 500 10px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif;
      vertical-align: middle;
      white-space: nowrap;
    }
  `;

  function ensureBadgeStyle() {
    if (document.getElementById("nk-badge-style")) return;
    const style = document.createElement("style");
    style.id = "nk-badge-style";
    style.textContent = BADGE_STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "CODE",
    "PRE",
    "KBD",
    "SAMP",
    "SVG",
    "CANVAS",
    "IFRAME",
    "OBJECT",
    "EMBED"
  ]);

  const DO_NOT_TRANSLATE = [
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

  const DATE_ABBR_RE =
    /^\d{1,2}\s+(janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)\.?\s+\d{4}$/i;

  const ATTRIBUTE_SELECTOR = [
    "[title]",
    "[aria-label]",
    "[placeholder]",
    "img[alt]",
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]'
  ].join(",");

  const BUTTON_INPUT_TYPES = new Set(["button", "submit", "reset"]);

  // Noms propres : on protège les séquences capitalisées qui ressemblent à
  // un nom de personne, ainsi que le nom qui suit un mot déclencheur.
  // Les mots courants et les marques sont exclus pour éviter les faux positifs.
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
    "sécurisé", "personnel", "professionnel", "disponible", "solde",
    "account", "balance", "available", "total", "net", "monthly", "annual",
    "daily", "recent", "new", "old", "bank", "financial", "digital",
    "secure", "personal", "professional"
  ]);

  const NAME_TRIGGER_RE = new RegExp(
    "(?:^|[^\\p{L}])" +
      "(bénéficiaire|destinataire|client(?:e)?|monsieur|madame|" +
      "mademoiselle|m\\.|mme|mlle|dr|professeur|prof|à|de|du|pour|" +
      "chez|vers|contact)" +
      "\\s*:?\\s+" +
      "([\\p{Lu}][\\p{L}'’-]+(?:\\s+[\\p{Lu}][\\p{L}'’-]+){0,2})",
    "giu"
  );

  const NAME_VOCATIVE_RE = new RegExp(
    "(?:^|[^\\p{L}])" +
      "(bonjour|bonsoir|salut|hello|hi|coucou|cher|chère|dear)" +
      "\\s*[,:-]?\\s+" +
      "([\\p{Lu}][\\p{L}'’-]+(?:\\s+[\\p{Lu}][\\p{L}'’-]+){0,2})",
    "giu"
  );

  const NAME_SEQUENCE_RE =
    /(?:^|[^\p{L}])([\p{Lu}][\p{L}'’-]+(?:\s+[\p{Lu}][\p{L}'’-]+)+)(?=$|[^\p{L}])/gu;

  let translated = new WeakMap();
  const translatedNodes = new Set();
  const translatedElements = new Set();
  const translatedAttributes = [];
  let attributeOriginals = new WeakMap();
  const flaggedNodes = new Set();
  let active = false;
  let observer = null;
  let applying = false;
  let pendingTimer = null;
  let toastHost = null;
  let selectionHost = null;
  let currentTarget = "fub";
  let translatedTitleOriginal = null;
  const DEMO_PAGE = LANG.isDemoPage?.() === true;

  /* ------------------------------------------------------------------ */
  /* Détection de langue                                                */
  /* ------------------------------------------------------------------ */

  function detectSourceLanguage(text) {
    return LANG.detectLanguage(
      text,
      document.documentElement?.getAttribute("lang") || ""
    );
  }

  function sourceLabel(code) {
    if (code === "en") return "anglais";
    if (code === "fr") return "français";
    return "langue inconnue";
  }

  /* ------------------------------------------------------------------ */
  /* Sélection des nœuds et attributs                                   */
  /* ------------------------------------------------------------------ */

  function isSensitive(element) {
    if (!element) return false;
    return Boolean(
      element.closest(
        [
          'input[type="password"]',
          'input[autocomplete*="one-time-code"]',
          'input[autocomplete*="cc-"]',
          'input[name*="otp" i]',
          'input[name*="pin" i]',
          'input[name*="password" i]',
          "[data-sensitive]"
        ].join(",")
      )
    );
  }

  function hasLetters(text) {
    return /[A-Za-zÀ-ÿ]/.test(text);
  }

  function shouldSkipText(node) {
    const element = node.parentElement;
    if (!element) return true;
    if (SKIP_TAGS.has(element.tagName)) return true;
    if (element.closest("[data-nk-ignore]")) return true;
    if (element.closest('input,textarea,[contenteditable="true"]')) {
      return true;
    }
    if (isSensitive(element)) return true;

    const text = node.nodeValue || "";
    if (!text.trim()) return true;
    if (!hasLetters(text)) return true;

    // Codes de langue, initiales d'avatar, sigles courts : on ne les traduit
    // pas (EN, FR, AN, CM…). Cela évite de casser un sélecteur de langue.
    if (/^[A-Z]{1,4}$/.test(text.trim())) return true;

    if (
      DO_NOT_TRANSLATE.some(
        (term) => text.trim().toLowerCase() === term.toLowerCase()
      )
    ) {
      return true;
    }

    if (element.closest("a") && /^https?:\/\//i.test(text.trim())) return true;

    // Les dates au format « 05 nov. 2026 » restent telles quelles : ce sont
    // des données, pas un libellé à traduire.
    if (DATE_ABBR_RE.test(text.trim())) return true;

    return false;
  }

  function collectTextItems(root, items) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (translatedNodes.has(node) || flaggedNodes.has(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return shouldSkipText(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode() && items.length < MAX_TEXT_ITEMS) {
      const node = walker.currentNode;
      items.push({
        id: `n${items.length}`,
        kind: "text",
        node,
        element: node.parentElement,
        value: node.nodeValue || "",
        isNew: false
      });
    }
  }

  function collectAttributeItems(root, items) {
    if (!root) return;
    const elements = root.querySelectorAll(ATTRIBUTE_SELECTOR);
    let added = 0;

    for (const element of elements) {
      if (added >= MAX_ATTRIBUTE_ITEMS) break;
      if (element.closest("[data-nk-ignore]")) continue;
      if (isSensitive(element)) continue;

      const add = (attr, value) => {
        if (added >= MAX_ATTRIBUTE_ITEMS) return;
        if (!value || !value.trim() || !hasLetters(value)) return;
        if (/^[A-Z]{1,4}$/.test(value.trim())) return;
        if (DO_NOT_TRANSLATE.some((term) => value.trim() === term)) return;
        if (attributeOriginals.get(element)?.has(attr)) return;
        items.push({
          id: `a${items.length}`,
          kind: "attr",
          element,
          attr,
          value,
          isNew: false
        });
        added += 1;
      };

      if (element.hasAttribute("title")) {
        add("title", element.getAttribute("title"));
      }
      if (element.hasAttribute("aria-label")) {
        add("aria-label", element.getAttribute("aria-label"));
      }
      if (
        element.hasAttribute("placeholder") &&
        element.matches("input,textarea") &&
        element.type !== "password"
      ) {
        add("placeholder", element.getAttribute("placeholder"));
      }
      if (element.tagName === "IMG" && element.hasAttribute("alt")) {
        add("alt", element.getAttribute("alt"));
      }
      if (
        element.tagName === "INPUT" &&
        BUTTON_INPUT_TYPES.has((element.type || "").toLowerCase())
      ) {
        add("value", element.value);
      }
    }
  }

  function collectTitleItem(items) {
    if (translatedTitleOriginal !== null) return;
    const title = document.title;
    if (!title || !title.trim() || !hasLetters(title)) return;
    items.push({
      id: `t${items.length}`,
      kind: "title",
      value: title,
      isNew: false
    });
  }

  function collectItems(root = document.body) {
    const items = [];
    if (!root) return items;
    collectTitleItem(items);
    collectTextItems(root, items);
    collectAttributeItems(root, items);
    return items;
  }

  /* ------------------------------------------------------------------ */
  /* Pseudonymisation des données sensibles                             */
  /* ------------------------------------------------------------------ */

  function looksLikeName(candidate) {
    const words = candidate
      .split(/\s+/)
      .map((word) => word.toLocaleLowerCase("fr"));
    if (words.length === 0) return false;
    if (words.every((word) => NAME_STOPWORDS.has(word))) return false;
    if (words.every((word) => word === word.toUpperCase())) return false;
    return words.some((word) => word.length >= 2);
  }

  function capitalizeNamePrefix(candidate) {
    const kept = [];
    for (const word of String(candidate || "").split(/\s+/)) {
      if (!/^\p{Lu}/u.test(word)) break;
      kept.push(word);
    }
    return kept.join(" ");
  }

  function redact(text) {
    const tokens = [];
    let value = String(text);
    // Index par type : [[NUM_0]] et [[NAME_0]] peuvent coexister sans
    // décaler les numéros suivants. Les packs sont ainsi stables.
    const counters = { NUM: 0, URL: 0, EMAIL: 0, NAME: 0 };

    const addToken = (kind, original) => {
      // Placeholder ASCII : plus robuste avec les tokenizers multilingues.
      const token = `[[${kind}_${counters[kind]++}]]`;
      tokens.push({ token, original });
      return token;
    };

    // URLs
    value = value.replace(/https?:\/\/[^\s<>"']+/gi, (match) =>
      addToken("URL", match)
    );

    // Emails
    value = value.replace(
      /[\w.+-]+@[\w-]+\.[\w.-]+/gi,
      (match) => addToken("EMAIL", match)
    );

    // Références d'opération (SAF-2026-XXXX) : entité opaque, jamais traduite.
    value = value.replace(
      /\b[A-Z]{2,}-\d{4}-[A-Z0-9]{4,}\b/g,
      (match) => addToken("NAME", match)
    );

    // Noms de bénéficiaires et personnes : après un mot déclencheur.
    value = value.replace(NAME_TRIGGER_RE, (match, trigger, candidate) => {
      const originalCandidate = candidate;
      candidate = capitalizeNamePrefix(candidate);
      if (!/^\p{Lu}/u.test(candidate) || !looksLikeName(candidate)) {
        return match;
      }
      const start = match.indexOf(originalCandidate);
      if (start < 0) return match;
      const end = start + candidate.length;
      return `${match.slice(0, start)}${addToken("NAME", candidate)}${match.slice(end)}`;
    });

    // Séquences de deux mots capitalisés ou plus (Jean Pierre, Marie-Claire).
    value = value.replace(NAME_SEQUENCE_RE, (match, candidate, offset) => {
      if (!looksLikeName(candidate)) return match;
      const prefix = match.slice(0, match.indexOf(candidate));
      return `${prefix}${addToken("NAME", candidate)}`;
    });

    // Nombres, montants, numéros de compte, téléphones.
    // On protège tous les chiffres : un montant ne doit jamais changer.
    value = value.replace(
      /\b\d+(?:[ \u00A0]\d+)+(?:[.,]\d+)?\b|\b\d+(?:[.,]\d+)?\b/g,
      (match) => addToken("NUM", match)
    );

    return { text: value, tokens };
  }

  function restoreTokens(text, tokens) {
    let value = String(text || "");

    // Certains modèles insèrent des espaces dans les placeholders.
    value = value.replace(
      /\[\s*\[\s*(NUM|URL|EMAIL|NAME)\s*_\s*(\d+)\s*\]\s*\]/gi,
      (_match, kind, number) => `[[${kind.toUpperCase()}_${number}]]`
    );

    for (const { token, original } of tokens) {
      const occurrences = value.split(token).length - 1;
      if (occurrences !== 1) return null;
      value = value.split(token).join(original);
    }
    return value;
  }

  /* ------------------------------------------------------------------ */
  /* Application et restauration                                        */
  /* ------------------------------------------------------------------ */

  function markElement(element, targetCode) {
    if (!element) return;
    translatedElements.add(element);
    element.setAttribute("lang", targetCode);
    element.setAttribute("data-nk-translated", "true");
  }

  function applyTextTranslation(item, text, targetCode) {
    const node = item.node;
    if (!translated.has(node)) {
      translated.set(node, node.nodeValue);
    }

    const original = translated.get(node) || "";
    const leading = original.match(/^\s*/)?.[0] || "";
    const trailing = original.match(/\s*$/)?.[0] || "";
    const clean = String(text || "").trim();

    if (!clean) return;

    node.nodeValue = `${leading}${clean}${trailing}`;
    translatedNodes.add(node);
    markElement(node.parentElement, targetCode);
  }

  function applyAttributeTranslation(item, text, targetCode) {
    const element = item.element;
    const attr = item.attr;
    const clean = String(text || "").trim();
    if (!clean) return;

    let originals = attributeOriginals.get(element);
    if (!originals) {
      originals = new Map();
      attributeOriginals.set(element, originals);
    }

    if (!originals.has(attr)) {
      originals.set(attr, item.value);
      translatedAttributes.push({ element, attr, original: item.value });
    }

    if (attr === "value" && element.tagName === "INPUT") {
      element.value = clean;
    } else {
      element.setAttribute(attr, clean);
    }

    markElement(element, targetCode);
  }

  function applyItemTranslation(item, text, targetCode) {
    if (item.kind === "text") {
      applyTextTranslation(item, text, targetCode);
    } else if (item.kind === "title") {
      const clean = String(text || "").trim();
      if (!clean) return;
      if (translatedTitleOriginal === null) {
        translatedTitleOriginal = item.value;
      }
      document.title = clean;
    } else {
      applyAttributeTranslation(item, text, targetCode);
    }
  }

  function restoreAll() {
    for (const node of translatedNodes) {
      const original = translated.get(node);
      if (typeof original === "string") {
        node.nodeValue = original;
      }
    }

    for (const { element, attr, original } of translatedAttributes) {
      if (attr === "value" && element.tagName === "INPUT") {
        element.value = original;
      } else {
        element.setAttribute(attr, original);
      }
    }

    if (translatedTitleOriginal !== null) {
      document.title = translatedTitleOriginal;
      translatedTitleOriginal = null;
    }

    for (const element of translatedElements) {
      element.removeAttribute("lang");
      element.removeAttribute("data-nk-translated");
    }

    // Marqueurs de niveau A non traduit.
    for (const element of document.querySelectorAll(
      "[data-nk-untranslated], [data-nk-demo-critical], " +
        "[data-nk-human-reviewed]"
    )) {
      element.removeAttribute("data-nk-untranslated");
      element.removeAttribute("data-nk-demo-critical");
      element.removeAttribute("data-nk-human-reviewed");
    }
    document.getElementById("nk-badge-style")?.remove();

    translatedNodes.clear();
    translatedAttributes.length = 0;
    translatedElements.clear();
    flaggedNodes.clear();
    translated = new WeakMap();
    attributeOriginals = new WeakMap();
    active = false;
    stopObserver();
    showToast("Original restauré.");
  }

  /* ------------------------------------------------------------------ */
  /* Traduction de la page                                              */
  /* ------------------------------------------------------------------ */

  function chunks(items, size) {
    const output = [];
    for (let i = 0; i < items.length; i += size) {
      output.push(items.slice(i, i + size));
    }
    return output;
  }

  function pageText() {
    return (
      document.body?.innerText ||
      document.documentElement?.textContent ||
      ""
    ).slice(0, 20000);
  }

  async function translatePage(target) {
    if (applying) return;

    const targetCode = target || currentTarget;
    const spec = LANG.getTarget(targetCode);
    if (!spec) {
      showToast("Langue cible inconnue.");
      return;
    }

    applying = true;
    active = true;
    stopObserver();
    showToast(
      `Traduction en ${spec.label}… ` +
        (spec.engine === "pack"
          ? "Seules les phrases validées du pack seront appliquées."
          : "Le modèle local peut prendre quelques secondes.")
    );

    let translatedCount = 0;

    try {
      const items = collectItems();
      if (items.length === 0) {
        showToast("Aucun nouveau texte à traduire.");
        return;
      }

      // Le titre peut être dans une autre langue que la page (site FR +
      // bascule EN). On le traduit séparément pour ne pas appliquer la
      // détection globale de la page à un titre français.
      const titleItem = items.find((item) => item.kind === "title") || null;
      const bodyItems = items.filter((item) => item.kind !== "title");

      const sourceInfo = detectSourceLanguage(pageText());
      const source = sourceInfo.code === "en" ? "en" : "fr";

      const segments = bodyItems.map((item) => {
        const { text, tokens } = redact(item.value || "");
        return {
          id: item.id,
          item,
          tokens,
          text
        };
      });

      let provider = null;
      let flaggedCount = 0;
      let criticalCount = 0;
      let demoCriticalCount = 0;
      let humanReviewedCount = 0;

      if (titleItem) {
        const titleRedaction = redact(titleItem.value || "");
        // Ne pas utiliser le hint `lang` de la page : justement, le titre
        // peut être dans l'autre langue (site FR basculé en EN).
        const titleInfo = LANG.detectLanguage
          ? LANG.detectLanguage(titleItem.value || "", "")
          : { code: "fr" };
        const titleSource = titleInfo.code === "en" ? "en" : "fr";
        try {
          const titleResponse = await api.runtime.sendMessage({
            type: "NK_TRANSLATE_TEXT",
            target: targetCode,
            source: titleSource,
            demo: DEMO_PAGE,
            text: titleRedaction.text
          });
          if (titleResponse?.translation?.ok) {
            const restoredTitle = restoreTokens(
              titleResponse.translation.text,
              titleRedaction.tokens
            );
            if (restoredTitle) {
              applyItemTranslation(titleItem, restoredTitle, targetCode);
              translatedCount += 1;
              provider = titleResponse.provider || provider;
              if (titleResponse.translation.demoCritical) {
                demoCriticalCount += 1;
              }
              if (titleResponse.translation.humanReviewed) {
                humanReviewedCount += 1;
              }
            } else {
              flaggedCount += 1;
            }
          } else {
            flaggedCount += 1;
          }
        } catch {
          flaggedCount += 1;
        }
      }

      for (const batch of chunks(segments, BATCH_SIZE)) {
        const response = await api.runtime.sendMessage({
          type: "NK_TRANSLATE_SEGMENTS",
          target: targetCode,
          source,
          demo: DEMO_PAGE,
          segments: batch.map(({ id, text }) => ({
            id,
            text
          }))
        });

        if (!response) {
          showToast(
            "Service de traduction indisponible. Vérifiez la connexion ou lancez le backend local."
          );
          break;
        }
        const batchTranslations = Array.isArray(response.translations)
          ? response.translations
          : [];
        if (response.error && batchTranslations.length === 0) {
          showToast(response.error);
          break;
        }
        if (response.error) {
          // Le pack a déjà répondu : on applique ses hits avant de signaler
          // que le moteur MT n'a pas pu compléter.
          showToast(response.error);
        }

        provider = response.provider || provider;
        const byId = new Map(
          (response.translations || []).map((item) => [item.id, item])
        );

        for (const segment of batch) {
          const result = byId.get(segment.id);
          if (!result || !result.ok) {
            if (
              result?.reason === "untranslated_critical" ||
              result?.reason === "critical_pack_only"
            ) {
              criticalCount += 1;
              const element = segment.item.element;
              if (element) {
                ensureBadgeStyle();
                element.setAttribute("data-nk-untranslated", "A");
              }
            } else if (
              result?.reason === "pack_miss" ||
              result?.reason === "empty_translation"
            ) {
              const visible = String(segment.item.value || "")
                .replace(/\[\[[^\]]+\]\]/g, "")
                .replace(/[^A-Za-zÀ-ÖØ-öø-ÿɓɗŋƴɔɛə]/g, "");
              if (visible.length >= 2 && segment.item.element) {
                ensureBadgeStyle();
                segment.item.element.setAttribute(
                  "data-nk-untranslated",
                  "B"
                );
              }
            }
            flaggedNodes.add(segment.item.node || segment.item.element);
            flaggedCount += 1;
            continue;
          }

          const restored = restoreTokens(result.text, segment.tokens);
          if (!restored) {
            flaggedNodes.add(segment.item.node || segment.item.element);
            flaggedCount += 1;
            continue;
          }

          if (result.humanReviewed) {
            humanReviewedCount += 1;
            // On ne badge que les segments critiques pour ne pas saturer
            // l'écran ; le récapitulatif compte toutes les entrées humaines.
            if (result.criticality === "A" && segment.item.element) {
              ensureBadgeStyle();
              const packLabel =
                result.provenance === "editorial" ||
                result.reviewLevel === "lexicon-assisted"
                  ? "editorial"
                  : result.packStatus === "reviewed"
                    ? "reviewed"
                    : "draft";
              segment.item.element.setAttribute(
                "data-nk-human-reviewed",
                packLabel
              );
            }
          }

          if (result.demoCritical) {
            demoCriticalCount += 1;
            const element = segment.item.element;
            if (element) {
              ensureBadgeStyle();
              element.setAttribute("data-nk-demo-critical", "A");
            }
          }

          applyItemTranslation(segment.item, restored, targetCode);
          translatedCount += 1;
        }
      }

      const sourceText =
        `${sourceLabel(sourceInfo.code)}` +
        (sourceInfo.confidence
          ? `, ${Math.round(sourceInfo.confidence * 100)} %`
          : "");
      const engine =
        provider === "pack"
          ? humanReviewedCount
            ? "pack non validé"
            : "pack communautaire"
          : provider === "flagship"
            ? "flagship-ai (brouillon)"
            : provider === "mixed"
              ? "pack humain + MT (démo)"
              : provider === "hybrid"
              ? "MyMemory + flagship-ai (démo)"
              : provider === "nllb" || provider === "local"
                ? "backend local"
                : "cloud";

      if (spec.engine === "pack" && translatedCount === 0) {
        showToast(
          `Pack ${spec.label} : aucune phrase validée pour cette page. ` +
            `Les textes restent en ${sourceLabel(sourceInfo.code)}. ` +
            `Contribuez via data/language-packs/${spec.code}.csv.`
        );
      } else if (translatedCount === 0 && criticalCount > 0) {
        showToast(
          `Aucune phrase traduite en ${spec.label} : ` +
            `${criticalCount} phrase(s) critique(s) sans pack validé. ` +
            "Elles restent en français ; le niveau A exige une validation native."
        );
      } else {
        showToast(
          (DEMO_PAGE ? "Mode démo SAFINUM (données fictives) — " : "") +
            `${translatedCount} segment(s) traduits en ${spec.label} ` +
            `(source : ${sourceText} · ${engine}` +
            (flaggedCount ? ` · ${flaggedCount} non traduit(s)` : "") +
            (criticalCount
              ? ` · ${criticalCount} critique(s) laissée(s) en français`
              : "") +
            (demoCriticalCount
              ? ` · ${demoCriticalCount} critique(s) en MT démo non validée`
              : "") +
            (humanReviewedCount
              ? ` · ${humanReviewedCount} entrée(s) de pack non validée(s)`
              : "") +
            "). Les montants et entités ont été préservés."
        );
      }

      currentTarget = targetCode;
      if (spec.engine === "pack" && translatedCount === 0) {
        active = false;
      }
    } catch (error) {
      console.error("[NkapLingua]", error);
      showToast("Erreur de traduction. Vérifiez la connexion ou le backend local.");
    } finally {
      applying = false;
      if (active) startObserver();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contenu dynamique                                                  */
  /* ------------------------------------------------------------------ */

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
      if (!active || applying) return;
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => translatePage(currentTarget), 900);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(pendingTimer);
  }

  /* ------------------------------------------------------------------ */
  /* Traduction de la sélection                                         */
  /* ------------------------------------------------------------------ */

  async function translateSelection(target) {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text) {
      showToast("Sélectionnez d'abord du texte.");
      return;
    }

    const targetCode = target || currentTarget;
    const spec = LANG.getTarget(targetCode);
    if (!spec) {
      showToast("Langue cible inconnue.");
      return;
    }

    let anchorRect = null;
    try {
      anchorRect = selection.getRangeAt(0).getBoundingClientRect();
    } catch {
      // La sélection peut être vide ou non textuelle.
    }

    const { text: redacted, tokens } = redact(text);
    const sourceInfo = detectSourceLanguage(text);

    try {
      const response = await api.runtime.sendMessage({
        type: "NK_TRANSLATE_TEXT",
        target: targetCode,
        source: sourceInfo.code === "en" ? "en" : "fr",
        demo: DEMO_PAGE,
        text: redacted
      });

      if (!response || response.error) {
        showToast(response?.error || "Traduction impossible pour cette sélection.");
        return;
      }

      if (!response.translation?.ok) {
        if (
          response.translation?.reason === "untranslated_critical" ||
          response.translation?.reason === "critical_pack_only"
        ) {
          showToast(
            `Phrase critique : aucun pack ${spec.label} validé. ` +
              "Elle reste en français ; le niveau A exige une validation native."
          );
        } else if (response.translation?.reason === "pack_miss") {
          showToast(
            `Phrase non validée dans le pack ${spec.label}. ` +
              `Ajoutez-la dans data/language-packs/${spec.code}.csv.`
          );
        } else {
          showToast("Traduction non fiable : montants ou entités modifiés.");
        }
        return;
      }

      let restored = null;
      if (
        response.translation?.packRaw &&
        !/\[\[[^\]]+\]\]/.test(response.translation.text)
      ) {
        restored = response.translation.text;
        for (const token of tokens) {
          if (!restored.includes(token.original)) {
            restored = null;
            break;
          }
        }
      } else {
        restored = restoreTokens(response.translation.text, tokens);
      }
      if (!restored) {
        showToast("Traduction non fiable : montants ou entités modifiés.");
        return;
      }

      showSelectionTooltip(
        text,
        restored,
        anchorRect,
        spec,
        response.provider,
        response.translation?.demoCritical === true,
        response.translation || {}
      );
    } catch (error) {
      console.error("[NkapLingua]", error);
      showToast("Erreur de traduction de la sélection.");
    }
  }

  function showSelectionTooltip(
    original,
    translation,
    rect,
    spec,
    provider,
    demoCritical = false,
    translationMeta = {}
  ) {
    selectionHost?.remove();

    let top = 24;
    let left = 24;
    if (rect) {
      top = Math.min(rect.bottom + 8, window.innerHeight - 220);
      left = Math.min(rect.left, window.innerWidth - 440);
    }

    const host = document.createElement("div");
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.top = `${Math.max(8, top)}px`;
    host.style.left = `${Math.max(8, left)}px`;
    host.style.zIndex = "2147483647";

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = `
      .box {
        width: min(420px, calc(100vw - 24px));
        background: #fffdf8;
        color: #14201b;
        border: 1px solid #e3dbcd;
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(20,32,27,.18);
        font: 14px/1.45 "Noto Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
        padding: 15px 17px;
      }
      .tag {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .1em;
        text-transform: uppercase;
        color: #7a5a22;
        margin-bottom: 9px;
      }
      .original {
        color: #5d6d64;
        font-size: 12px;
        border-left: 3px solid #e8d5ad;
        padding-left: 9px;
        margin-bottom: 11px;
        max-height: 70px;
        overflow: auto;
      }
      .translation {
        font-size: 16px;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .note {
        margin-top: 9px;
        color: #5d6d64;
        font-size: 10px;
        line-height: 1.4;
      }
      button {
        border: 0;
        background: #123b2e;
        color: #fbf7ee;
        border-radius: 999px;
        padding: 5px 11px;
        font: inherit;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      button:hover {
        background: #174a39;
      }
    `;

    const box = document.createElement("div");
    box.className = "box";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Traduction NkapLingua");

    const tag = document.createElement("div");
    tag.className = "tag";
    const tagText = document.createElement("span");
    tagText.textContent =
      translationMeta.humanReviewed
        ? `${spec.label} · pack humain non validé`
        : spec.engine === "pack"
          ? `${spec.label} · pack`
          : `${spec.label} · MT brouillon`;
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Fermer";
    close.addEventListener("click", () => host.remove());
    tag.append(tagText, close);

    const originalEl = document.createElement("div");
    originalEl.className = "original";
    originalEl.textContent = original;

    const translationEl = document.createElement("div");
    translationEl.className = "translation";
    translationEl.lang = spec.code;
    translationEl.textContent = translation;

    box.append(tag, originalEl, translationEl);

    if (translationMeta.humanReviewed) {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent =
        `Pack non validé (${translationMeta.packStatus || "draft"}` +
        (translationMeta.reviewLevel
          ? `, ${translationMeta.reviewLevel}`
          : "") +
        "). Relecture native indépendante requise avant usage réel.";
      box.append(note);
    } else if (demoCritical) {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent =
        "Mode démo SAFINUM — phrase critique traduite par MT, non validée. " +
        "Données fictives, aucune transaction réelle.";
      box.append(note);
    } else if (spec.engine === "pack" || provider === "pack") {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent =
        "Phrase issue du pack communautaire. Validation native requise avant usage réel.";
      box.append(note);
    } else {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = DEMO_PAGE
        ? "Mode démo SAFINUM — traduction automatique non validée, à relire."
        : "Traduction automatique (brouillon) — à relire par un natif. " +
          "Les phrases critiques (solde, frais, PIN/OTP) ne sont pas traduites automatiquement.";
      box.append(note);
    }

    shadow.append(style, box);
    document.documentElement.appendChild(host);
    selectionHost = host;
  }

  /* ------------------------------------------------------------------ */
  /* Toast de statut                                                    */
  /* ------------------------------------------------------------------ */

  function showToast(message) {
    toastHost?.remove();

    const host = document.createElement("div");
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.right = "16px";
    host.style.bottom = "16px";
    host.style.zIndex = "2147483647";

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .toast {
        max-width: 380px;
        background: #123b2e;
        color: #f8f4ec;
        border: 1px solid rgba(232,213,173,.24);
        border-left: 3px solid #c9a45c;
        border-radius: 14px;
        box-shadow: 0 14px 34px rgba(13,42,32,.24);
        padding: 11px 14px;
        font: 13px/1.45 "Noto Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
      }
    `;

    const box = document.createElement("div");
    box.className = "toast";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.textContent = message;
    shadow.append(style, box);
    document.documentElement.appendChild(host);
    toastHost = host;

    setTimeout(() => {
      if (toastHost === host) {
        host.remove();
        toastHost = null;
      }
    }, 7000);
  }

  /* ------------------------------------------------------------------ */
  /* Messages                                                           */
  /* ------------------------------------------------------------------ */

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "NK_TRANSLATE_PAGE") {
      translatePage(message.target);
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "NK_RESTORE") {
      restoreAll();
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "NK_TRANSLATE_SELECTION") {
      translateSelection(message.target);
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "NK_SET_TARGET") {
      if (LANG.getTarget(message.target)) {
        currentTarget = message.target;
        sendResponse({ ok: true, target: currentTarget });
      } else {
        sendResponse({ ok: false, error: "unknown_target" });
      }
      return true;
    }

    return false;
  });

  // Restaurer la dernière langue choisie dans le popup.
  (async () => {
    try {
      const stored = await api.storage?.local?.get("nkTarget");
      if (stored?.nkTarget && LANG.getTarget(stored.nkTarget)) {
        currentTarget = stored.nkTarget;
      }
    } catch {
      // storage peut être indisponible sur certaines pages.
    }
  })();
})();
