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

  const BLOCK_SELECTOR =
    "p,li,h1,h2,h3,h4,h5,h6,td,th,button,label,figcaption,blockquote," +
    "option,div,section,article,header,footer,main,aside,nav";

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
    "gu"
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

    if (
      DO_NOT_TRANSLATE.some(
        (term) => text.trim().toLowerCase() === term.toLowerCase()
      )
    ) {
      return true;
    }

    if (element.closest("a") && /^https?:\/\//i.test(text.trim())) return true;

    return false;
  }

  function blockContext(element) {
    if (!element) return "";
    const block = element.closest(BLOCK_SELECTOR) || element;
    const text = (block.innerText || block.textContent || "").trim();
    return text.slice(0, 600);
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

  function collectItems(root = document.body) {
    const items = [];
    if (!root) return items;
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

    // Noms de bénéficiaires et personnes : après un mot déclencheur.
    value = value.replace(NAME_TRIGGER_RE, (match, trigger, candidate) => {
      if (!looksLikeName(candidate)) return match;
      const start = match.indexOf(candidate);
      if (start < 0) return match;
      return `${match.slice(0, start)}${addToken("NAME", candidate)}`;
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
      /\b\d{1,3}(?:[ \u00A0]\d{3})+(?:[.,]\d+)?\b|\b\d+(?:[.,]\d+)?\b/g,
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

    for (const element of translatedElements) {
      element.removeAttribute("lang");
      element.removeAttribute("data-nk-translated");
    }

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

      const sourceInfo = detectSourceLanguage(pageText());
      const source = sourceInfo.code === "en" ? "en" : "fr";

      const segments = items.map((item, index) => {
        const { text, tokens } = redact(item.value || "");
        return {
          id: item.id,
          item,
          tokens,
          text,
          context: blockContext(item.element)
        };
      });

      let provider = null;
      let flaggedCount = 0;

      for (const batch of chunks(segments, BATCH_SIZE)) {
        const response = await api.runtime.sendMessage({
          type: "NK_TRANSLATE_SEGMENTS",
          target: targetCode,
          source,
          segments: batch.map(({ id, text, context }) => ({
            id,
            text,
            context
          }))
        });

        if (!response || response.error) {
          showToast(
            response?.error ||
              "Service de traduction indisponible. Vérifiez la connexion ou lancez le backend local."
          );
          break;
        }

        provider = response.provider || provider;
        const byId = new Map(
          (response.translations || []).map((item) => [item.id, item])
        );

        for (const segment of batch) {
          const result = byId.get(segment.id);
          if (!result || !result.ok) {
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
          ? "pack communautaire"
          : provider === "local"
            ? "backend local"
            : "cloud";

      if (spec.engine === "pack" && translatedCount === 0) {
        showToast(
          `Pack ${spec.label} : aucune phrase validée pour cette page. ` +
            `Les textes restent en ${sourceLabel(sourceInfo.code)}. ` +
            `Contribuez via data/language-packs/${spec.code}.csv.`
        );
      } else {
        showToast(
          `${translatedCount} segment(s) traduits en ${spec.label} ` +
            `(source : ${sourceText} · ${engine}` +
            (flaggedCount ? ` · ${flaggedCount} non traduit(s)` : "") +
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
        text: redacted
      });

      if (!response || response.error) {
        showToast(response?.error || "Traduction impossible pour cette sélection.");
        return;
      }

      if (!response.translation?.ok) {
        if (response.translation?.reason === "pack_miss") {
          showToast(
            `Phrase non validée dans le pack ${spec.label}. ` +
              `Ajoutez-la dans data/language-packs/${spec.code}.csv.`
          );
        } else {
          showToast("Traduction non fiable : montants ou entités modifiés.");
        }
        return;
      }

      const restored = restoreTokens(response.translation.text, tokens);
      if (!restored) {
        showToast("Traduction non fiable : montants ou entités modifiés.");
        return;
      }

      showSelectionTooltip(text, restored, anchorRect, spec, response.provider);
    } catch (error) {
      console.error("[NkapLingua]", error);
      showToast("Erreur de traduction de la sélection.");
    }
  }

  function showSelectionTooltip(original, translation, rect, spec, provider) {
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
      spec.engine === "pack" ? `${spec.label} · pack` : spec.label;
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

    if (spec.engine === "pack" || provider === "pack") {
      const note = document.createElement("p");
      note.className = "note";
      note.textContent =
        "Phrase issue du pack communautaire. Validation native requise avant usage réel.";
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
