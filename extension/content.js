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
  `;

  function ensureBadgeStyle() {
    if (DEMO_PAGE) return;
    if (document.getElementById("nk-badge-style")) return;
    const style = document.createElement("style");
    style.id = "nk-badge-style";
    style.textContent = BADGE_STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  // Mention unique et discrète : une seule pastille en bas de page au lieu
  // d'une étiquette sur chaque phrase. Le détail (nombre d'entrées non
  // validées, alertes) reste disponible au survol et dans le popup.
  let noticeHost = null;

  function clearNotice() {
    noticeHost?.remove();
    noticeHost = null;
    try {
      document.documentElement.removeAttribute("data-nk-summary");
    } catch {
      // Document sans racine : rien à nettoyer.
    }
  }

  function updateNotice({
    label,
    translated,
    human,
    demo,
    untranslated,
    partial
  }) {
    clearNotice();
    if (!translated) return;

    const host = document.createElement("div");
    host.id = "nk-notice-host";
    host.style.all = "initial";
    host.style.position = "fixed";
    host.style.left = "16px";
    host.style.bottom = "16px";
    host.style.zIndex = "2147483646";
    host.style.pointerEvents = "none";

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .notice {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 10px;
        border: 1px solid rgba(232, 213, 173, 0.28);
        border-radius: 999px;
        background: rgba(18, 59, 46, 0.9);
        color: #f8f4ec;
        box-shadow: 0 6px 18px rgba(13, 42, 32, 0.18);
        font: 500 11px/1.4 "Noto Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
        white-space: nowrap;
        opacity: 0.92;
      }
      .notice::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #c9a45c;
        flex: none;
      }
    `;

    const box = document.createElement("div");
    box.className = "notice";
    box.setAttribute("role", "status");
    box.textContent = tr(`NkapLingua · ${label} — démonstration`, `NkapLingua · ${label} — demo`);
    box.title =
      tr(`${translated} passage(s) traduits`, `${translated} passage(s) translated`) +
      (human ? tr(` · ${human} élément(s) de démonstration`, ` · ${human} demo item(s)`) : "") +
      (demo ? ` · ${demo} alerte(s) MT démo` : "") +
      (partial ? tr(` · ${partial} traduction(s) partielle(s)`, ` · ${partial} partial translation(s)`) : "") +
      (untranslated ? ` · ${untranslated} non traduit(s)` : "");
    shadow.append(style, box);
    document.documentElement.appendChild(host);
    noticeHost = host;
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
  let lastResult = null;
  let lastSelectionText = "";
  const DEMO_PAGE = LANG.isDemoPage?.() === true;
  const pageIsEnglish = () =>
    String(document.documentElement?.lang || "").toLowerCase().startsWith("en");
  const tr = (fr, en) => (pageIsEnglish() ? en : fr);

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
    if (code === "en") return tr("anglais", "English");
    if (code === "fr") return tr("français", "French");
    return tr("langue inconnue", "unknown language");
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
    clearPageSelection();
    selectionHost?.remove();
    selectionHost = null;
    const restoredCount =
      translatedNodes.size +
      translatedAttributes.length +
      (translatedTitleOriginal !== null ? 1 : 0);
    if (restoredCount === 0) {
      clearNotice();
      showToast(tr("Aucune traduction à restaurer.", "No translation to restore."));
      return { ok: false, error: "Aucune traduction à restaurer." };
    }

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
    lastResult = null;
    stopObserver();
    clearNotice();
    showToast(tr("Original restauré.", "Original restored."));
    return { ok: true, restored: restoredCount };
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

  // Découpage de secours : si un paragraphe entier n'est pas dans le pack,
  // on retente phrase par phrase. Les phrases connues sont traduites, les
  // autres restent dans la langue source — jamais de mot à mot.
  const SENTENCE_SPLIT_RE =
    /(?<=[.!?…])\s+(?=[\p{Lu}\p{N}"«(“'])/u;

  function splitSentences(value) {
    return String(value || "")
      .trim()
      .split(SENTENCE_SPLIT_RE)
      .flatMap((part) => part.split(/\n+/))
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function withSourcePunctuation(source, target) {
    const ending = (String(source).match(/[.!?…]+$/) || [""])[0];
    if (ending && !/[.!?…]$/.test(String(target).trim())) {
      return `${String(target).trim()}${ending}`;
    }
    return String(target).trim();
  }

  function pageText() {
    return (
      document.body?.innerText ||
      document.documentElement?.textContent ||
      ""
    ).slice(0, 20000);
  }

  function clearPageSelection() {
    try {
      const selection = window.getSelection?.();
      if (selection && selection.rangeCount > 0) selection.removeAllRanges();
    } catch {
      // La sélection peut ne pas être accessible sur certaines pages.
    }
    lastSelectionText = "";
  }

  async function translatePage(target) {
    if (applying) {
      showToast(tr("Une traduction est déjà en cours.", "A translation is already in progress."));
      return { ok: false, error: "Une traduction est déjà en cours." };
    }

    const targetCode = target || currentTarget;
    const spec = LANG.getTarget(targetCode);
    if (!spec) {
      showToast(tr("Langue cible inconnue.", "Unknown target language."));
      return { ok: false, error: "Langue cible inconnue." };
    }

    // Le remplacement des nœuds pendant la traduction ne doit pas laisser
    // une plage de sélection surlignée sur l'ancien texte.
    clearPageSelection();
    selectionHost?.remove();
    selectionHost = null;
    applying = true;
    active = true;
    stopObserver();
    clearNotice();
    if (DEMO_PAGE) {
      showToast(tr(`Traduction en ${spec.label}…`, `Translating to ${spec.label}…`));
    } else {
      showToast(
        tr(
          `Traduction en ${spec.label}… ` +
            (spec.engine === "pack"
              ? "Seules les phrases du pack seront appliquées."
              : "Cela peut prendre quelques secondes."),
          `Translating to ${spec.label}… ` +
            (spec.engine === "pack"
              ? "Only pack phrases will be applied."
              : "This may take a few seconds.")
        )
      );
    }

    let translatedCount = 0;
    let fatalError = null;

    try {
      const items = collectItems();
      const pageTruncated = items.length >= MAX_TEXT_ITEMS;
      if (items.length === 0) {
        showToast(tr("Aucun nouveau texte à traduire.", "No new text to translate."));
        return { ok: false, error: "Aucun nouveau texte à traduire." };
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
      let partialCount = 0;
      const sentenceCandidates = [];

      async function translateBySentences(segment) {
        const sentences = splitSentences(segment.item.value || "");
        if (sentences.length < 2 || sentences.length > 8) return null;

        const parts = sentences.map((sentence, index) => {
          const redaction = redact(sentence);
          return {
            index,
            sentence,
            text: redaction.text,
            tokens: redaction.tokens
          };
        });

        const response = await api.runtime.sendMessage({
          type: "NK_TRANSLATE_SEGMENTS",
          target: targetCode,
          source,
          demo: DEMO_PAGE,
          segments: parts.map(({ index, text }) => ({
            id: `${segment.id}#s${index}`,
            text
          }))
        });
        if (!response || !Array.isArray(response.translations)) return null;

        const byId = new Map(
          response.translations.map((result) => [result.id, result])
        );
        const pieces = [];
        let matched = 0;
        let critical = 0;
        let human = false;
        let demo = false;

        for (const part of parts) {
          const result = byId.get(`${segment.id}#s${part.index}`);
          if (result?.ok) {
            const restored = restoreTokens(result.text, part.tokens);
            if (restored) {
              pieces.push(
                withSourcePunctuation(part.sentence, restored)
              );
              matched += 1;
              human = human || Boolean(result.humanReviewed);
              demo = demo || Boolean(result.demoCritical);
              continue;
            }
          } else if (
            result?.reason === "untranslated_critical" ||
            result?.reason === "critical_pack_only"
          ) {
            critical += 1;
          }
          pieces.push(part.sentence);
        }

        if (matched === 0) return null;
        return {
          text: pieces.join(" "),
          matched,
          total: parts.length,
          critical,
          human,
          demo
        };
      }

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
          fatalError =
            tr("Service de traduction indisponible. Vérifiez la connexion ou lancez le backend local.", "Translation service unavailable. Check the connection or start the local backend.");
          showToast(fatalError);
          break;
        }
        const batchTranslations = Array.isArray(response.translations)
          ? response.translations
          : [];
        if (response.error && batchTranslations.length === 0) {
          fatalError = response.error;
          showToast(fatalError);
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
              sentenceCandidates.push({ segment, critical: true });
              const element = segment.item.element;
              if (element) {
                ensureBadgeStyle();
                element.setAttribute("data-nk-untranslated", "A");
              }
            } else if (
              result?.reason === "pack_miss" ||
              result?.reason === "empty_translation"
            ) {
              if (result?.reason === "pack_miss") {
                sentenceCandidates.push({ segment, critical: false });
              }
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

      // Repli phrase par phrase, uniquement quand le pack est le seul
      // moteur disponible. On ne mélange pas MT et pack dans un même
      // paragraphe.
      if (
        sentenceCandidates.length > 0 &&
        (provider === "pack" || provider === null)
      ) {
        for (const { segment, critical } of sentenceCandidates) {
          let partial = null;
          try {
            partial = await translateBySentences(segment);
          } catch {
            partial = null;
          }
          if (!partial) continue;

          applyItemTranslation(segment.item, partial.text, targetCode);
          translatedCount += 1;
          partialCount += 1;
          flaggedCount = Math.max(0, flaggedCount - 1);
          flaggedNodes.delete(segment.item.node || segment.item.element);
          // Le segment entier avait été compté critique : on le remplace par
          // le nombre exact de phrases critiques restées en français.
          if (critical) criticalCount = Math.max(0, criticalCount - 1);
          if (partial.human) humanReviewedCount += 1;
          segment.item.element?.removeAttribute("data-nk-untranslated");
          if (partial.critical) {
            criticalCount += partial.critical;
            segment.item.element?.setAttribute("data-nk-untranslated", "A");
          }
          if (partial.demo) {
            demoCriticalCount += 1;
            segment.item.element?.setAttribute(
              "data-nk-demo-critical",
              "A"
            );
          }
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
            ? "pack de démonstration"
            : "pack communautaire"
          : provider === "flagship"
            ? "flagship-ai (démo)"
            : provider === "mixed"
              ? "pack humain + MT (démo)"
              : provider === "hybrid"
              ? "MyMemory + flagship-ai (démo)"
              : provider === "nllb" || provider === "local"
                ? "backend local"
                : "cloud";

      if (DEMO_PAGE && translatedCount > 0) {
        showToast(
          tr(
            "Traduction terminée. Les montants et les noms sont préservés.",
            "Translation complete. Amounts and names are preserved."
          )
        );
      } else if (spec.engine === "pack" && translatedCount === 0) {
        showToast(
          tr(
            `Pack ${spec.label} : aucune phrase disponible pour cette page. ` +
              `Les textes restent en ${sourceLabel(sourceInfo.code)}.`,
            `Pack ${spec.label}: no phrase available for this page. ` +
              `Text stays in ${sourceLabel(sourceInfo.code)}.`
          )
        );
      } else if (translatedCount === 0 && criticalCount > 0) {
        showToast(
          tr(
            `Aucune phrase traduite en ${spec.label}. ` +
              "Les phrases qui touchent à l'argent ou à la sécurité restent en français.",
            `No phrase translated to ${spec.label}. ` +
              "Sentences involving money or security stay in French."
          )
        );
      } else if (pageIsEnglish()) {
        const bits = [
          `${translatedCount} passage(s) translated to ${spec.label}`,
          flaggedCount + criticalCount
            ? `${flaggedCount + criticalCount} left in French`
            : null,
          partialCount ? `${partialCount} partial translation(s)` : null,
          pageTruncated ? "long page, 180 passages maximum" : null
        ].filter(Boolean);
        showToast(`${bits.join(" · ")}. Amounts and names preserved.`);
      } else {
        showToast(
          (DEMO_PAGE ? "Mode démo SAFINUM (données fictives) — " : "") +
            `${translatedCount} passage(s) traduits en ${spec.label} ` +
            `(source : ${sourceText} · ${engine}` +
            (flaggedCount ? ` · ${flaggedCount} non traduit(s)` : "") +
            (criticalCount
              ? ` · ${criticalCount} critique(s) laissée(s) en français`
              : "") +
            (demoCriticalCount
              ? ` · ${demoCriticalCount} critique(s) en traduction automatique de démonstration`
              : "") +
            (humanReviewedCount
              ? ` · ${humanReviewedCount} élément(s) de démonstration`
              : "") +
            (partialCount
              ? ` · ${partialCount} traduction(s) partielle(s)`
              : "") +
            (pageTruncated
              ? " · page longue, 180 passages maximum"
              : "") +
            "). Les montants et entités ont été préservés."
        );
      }

      updateNotice({
        label: spec.label,
        translated: translatedCount,
        human: humanReviewedCount,
        demo: demoCriticalCount,
        untranslated: flaggedCount + criticalCount,
        partial: partialCount
      });

      // Reçu de traduction : données machine-lisibles (harnais, popup) et
      // carte lisible. Aucun texte de page n'est exposé, uniquement des
      // compteurs et le moteur.
      const summary = {
        label: spec.label,
        translated: translatedCount,
        human: humanReviewedCount,
        demo: demoCriticalCount,
        untranslated: flaggedCount + criticalCount,
        partial: partialCount,
        truncated: pageTruncated,
        simple: DEMO_PAGE,
        provider: provider || null,
        source,
        target: targetCode
      };
      document.documentElement.setAttribute(
        "data-nk-summary",
        JSON.stringify(summary)
      );

      // Détail pour le popup, s'il est encore ouvert.
      try {
        api.runtime.sendMessage({
          type: "NK_TRANSLATION_SUMMARY",
          summary
        });
      } catch {
        // Best-effort : le popup est souvent déjà fermé.
      }

      currentTarget = targetCode;
      if (spec.engine === "pack" && translatedCount === 0) {
        active = false;
      }

      if (fatalError) {
        active = false;
        return { ok: false, error: fatalError };
      }
      if (translatedCount === 0) {
        active = false;
        return {
          ok: false,
          error:
            "Aucune phrase n'a pu être traduite. Le texte original est conservé."
        };
      }

      lastResult = {
        translated: translatedCount,
        untranslated: flaggedCount + criticalCount,
        partial: partialCount,
        target: targetCode,
        label: spec.label,
        truncated: pageTruncated,
        active,
        summary
      };
      return {
        ok: true,
        translated: translatedCount,
        untranslated: flaggedCount + criticalCount,
        partial: partialCount,
        target: targetCode,
        label: spec.label,
        truncated: pageTruncated,
        simple: DEMO_PAGE
      };
    } catch (error) {
      console.error("[NkapLingua]", error);
      const message =
        "Erreur de traduction. Vérifiez la connexion ou le backend local.";
      showToast(message);
      return { ok: false, error: message };
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

  async function translateSelection(target, forcedText = "") {
    const selection = window.getSelection();
    const text = String(forcedText || selection?.toString() || "").trim();
    if (!text) {
      showToast(tr("Sélectionnez d'abord du texte.", "Select some text first."));
      return { ok: false, error: "Sélectionnez d'abord du texte." };
    }

    const targetCode = target || currentTarget;
    const spec = LANG.getTarget(targetCode);
    if (!spec) {
      showToast(tr("Langue cible inconnue.", "Unknown target language."));
      return { ok: false, error: "Langue cible inconnue." };
    }

    let anchorRect = null;
    try {
      if (selection && selection.rangeCount > 0) {
        anchorRect = selection.getRangeAt(0).getBoundingClientRect();
      }
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
        const message =
          response?.error ||
          tr("Traduction impossible pour cette sélection.", "Translation failed for this selection.");
        showToast(message);
        return { ok: false, error: message };
      }

      if (!response.translation?.ok) {
        let message;
        if (
          response.translation?.reason === "untranslated_critical" ||
          response.translation?.reason === "critical_pack_only"
        ) {
          message = tr(
            "Cette phrase touche à l'argent ou à la sécurité. " +
              "Elle reste en français pour éviter une erreur.",
            "This sentence involves money or security. " +
              "It stays in French to avoid an error."
          );
        } else if (response.translation?.reason === "pack_miss") {
          message = tr(
            `Cette phrase n'est pas encore disponible en ${spec.label}. ` +
              "Elle reste en français.",
            `This sentence is not available in ${spec.label} yet. ` +
              "It stays in French."
          );
        } else {
          message = tr(
            "Traduction non fiable : les montants ou les noms pourraient être modifiés.",
            "Unreliable translation: amounts or names may have changed."
          );
        }
        showToast(message);
        return { ok: false, error: message };
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
        const message =
          "Traduction non fiable : les montants ou les noms pourraient être modifiés.";
        showToast(message);
        return { ok: false, error: message };
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
      // L'infobulle porte déjà l'original : on retire le surlignage de la
      // page pour ne pas laisser une sélection accrochée après l'action.
      clearPageSelection();
      return { ok: true, translated: 1 };
    } catch (error) {
      console.error("[NkapLingua]", error);
      const message = tr(
        "Erreur de traduction de la sélection.",
        "Selection translation error."
      );
      showToast(message);
      return { ok: false, error: message };
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
    box.setAttribute("aria-label", tr("Traduction NkapLingua", "NkapLingua translation"));

    const tag = document.createElement("div");
    tag.className = "tag";
    const tagText = document.createElement("span");
    tagText.textContent =
      translationMeta.humanReviewed
        ? tr(`${spec.label} · pack de démonstration`, `${spec.label} · demo pack`)
        : spec.engine === "pack"
          ? tr(`${spec.label} · pack`, `${spec.label} · pack`)
          : tr(`${spec.label} · traduction automatique`, `${spec.label} · machine translation`);
    const close = document.createElement("button");
    close.type = "button";
    close.textContent = tr("Fermer", "Close");
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
      note.textContent = tr(
        `Version de démonstration (${translationMeta.packStatus || "draft"}` +
          (translationMeta.reviewLevel
            ? `, ${translationMeta.reviewLevel}`
            : "") +
          "). À confirmer avant usage réel.",
        `Demo version (${translationMeta.packStatus || "draft"}` +
          (translationMeta.reviewLevel
            ? `, ${translationMeta.reviewLevel}`
            : "") +
          "). To be confirmed before real use."
      );
      box.append(note);
    } else if (demoCritical) {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = tr(
        "Mode démo SAFINUM — phrase critique traduite automatiquement. " +
          "Données fictives, aucune transaction réelle.",
        "SAFINUM demo mode — critical sentence translated automatically. " +
          "Fictional data, no real transaction."
      );
      box.append(note);
    } else if (spec.engine === "pack" || provider === "pack") {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = tr(
        "Phrase issue du pack communautaire. Version de démonstration à confirmer avant usage réel.",
        "Sentence from the community pack. Demo version to be confirmed before real use."
      );
      box.append(note);
    } else {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent = DEMO_PAGE
        ? tr(
            "Mode démo SAFINUM — traduction automatique de démonstration.",
            "SAFINUM demo mode — demo machine translation."
          )
        : tr(
            "Traduction automatique de démonstration — à confirmer avant usage réel. " +
              "Les phrases critiques (solde, frais, PIN/OTP) ne sont pas traduites automatiquement.",
            "Demo machine translation — to be confirmed before real use. " +
              "Critical phrases (balance, fees, PIN/OTP) are not machine-translated."
          );
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
    // Le widget affiche son propre statut : pas de toast concurrent en bas
    // à droite quand une action vient du widget.
    if (globalThis.__NK_WIDGET_QUIET__) return;
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

  function getPageState() {
    const spec = LANG.getTarget(currentTarget);
    const translated = lastResult?.translated || translatedNodes.size;
    return {
      ok: true,
      active: active || translated > 0,
      busy: applying,
      translated,
      untranslated: lastResult?.untranslated || 0,
      partial: lastResult?.partial || 0,
      truncated: lastResult?.truncated === true,
      target: currentTarget,
      label: spec?.label || "",
      summary: lastResult?.summary || null,
      pageLang: document.documentElement?.lang || ""
    };
  }

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "NK_TRANSLATE_PAGE") {
      translatePage(message.target)
        .then((result) => sendResponse(result || { ok: false, error: "Action sans résultat." }))
        .catch((error) =>
          sendResponse({ ok: false, error: String(error?.message || error) })
        );
      return true;
    }

    if (message?.type === "NK_RESTORE") {
      sendResponse(restoreAll() || { ok: false, error: "Restauration impossible." });
      return true;
    }

    if (message?.type === "NK_TRANSLATE_SELECTION") {
      translateSelection(message.target)
        .then((result) => sendResponse(result || { ok: false, error: "Action sans résultat." }))
        .catch((error) =>
          sendResponse({ ok: false, error: String(error?.message || error) })
        );
      return true;
    }

    if (message?.type === "NK_GET_STATE") {
      sendResponse(getPageState());
      return true;
    }

    if (message?.type === "NK_SET_TARGET") {
      if (!LANG.getTarget(message.target)) {
        sendResponse({ ok: false, error: "unknown_target" });
        return true;
      }
      const previous = currentTarget;
      currentTarget = message.target;
      const retranslating =
        previous !== currentTarget && !applying && (lastResult?.translated || 0) > 0;
      sendResponse({ ok: true, target: currentTarget, retranslating });
      if (retranslating) {
        restoreAll();
        translatePage(currentTarget).catch(() => {});
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

  // Mémoriser la dernière sélection utile : cliquer dans le widget peut
  // replier la sélection du document avant l'appel.
  document.addEventListener(
    "selectionchange",
    () => {
      const value = window.getSelection?.()?.toString().trim();
      if (value) lastSelectionText = value;
    },
    true
  );

  // API du widget flottant. Le widget vit dans un Shadow DOM et ne lit
  // jamais les champs, mots de passe ou valeurs de formulaire.
  globalThis.__NK_WIDGET_API__ = {
    getLanguages() {
      return LANG.listTargets().map((item) => ({
        code: item.code,
        label: item.label,
        engineLabel: item.engineLabel || (item.engine === "pack" ? "Pack" : "MT")
      }));
    },
    getTarget() {
      const spec = LANG.getTarget(currentTarget) || LANG.getTarget("fub");
      return {
        code: spec.code,
        label: spec.label,
        engineLabel:
          spec.engineLabel || (spec.engine === "pack" ? "Pack" : "MT")
      };
    },
    getState: getPageState,
    getSelection() {
      const current = window.getSelection?.()?.toString().trim();
      return current || lastSelectionText;
    },
    async setTarget(code) {
      if (!LANG.getTarget(code)) {
        return { ok: false, error: "Langue cible inconnue." };
      }
      const previous = currentTarget;
      currentTarget = code;
      try {
        await api.storage?.local?.set({ nkTarget: code });
      } catch {
        // Stockage indisponible : la session reste utilisable.
      }
      if (previous !== code && (lastResult?.translated || 0) > 0) {
        restoreAll();
        const result = await translatePage(code);
        return { ...result, retranslated: true };
      }
      return { ok: true, target: code, retranslated: false };
    },
    translatePage(code) {
      return translatePage(code || currentTarget);
    },
    restore() {
      return restoreAll();
    },
    translateSelection(code, text) {
      return translateSelection(code || currentTarget, text || "");
    },
    translateText(text) {
      return api.runtime.sendMessage({
        type: "NK_TRANSLATE_TEXT",
        target: currentTarget,
        text,
        demo: DEMO_PAGE
      });
    }
  };
})();
