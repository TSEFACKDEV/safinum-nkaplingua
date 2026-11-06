/**
 * NkapLingua — content script.
 *
 * Principe :
 *  - on ne touche jamais au HTML du site ;
 *  - on remplace uniquement des nœuds texte, un par un ;
 *  - on conserve les liens, les écouteurs d'événements et la mise en page ;
 *  - on peut restaurer l'original à tout moment ;
 *  - les champs de formulaire, mots de passe et OTP ne sont jamais lus.
 */

(() => {
  if (window.__NKAPLINGUA__) return;
  window.__NKAPLINGUA__ = true;

  // Chrome : `chrome` ; Firefox : `browser` (API à promesses).
  const api = globalThis.browser ?? globalThis.chrome;

  const TARGET = "fub";
  const BATCH_SIZE = 8;
  const MAX_NODES_PER_PASS = 90;

  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
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
    "div,section,article,header,footer,main,aside,nav";

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
    "FINAKA",
    "Aïcha"
  ];

  // Détection FR/EN volontairement simple : le challenge peut fournir une
  // interface en français ou en anglais. Le backend reçoit la langue source.
  const FRENCH_HINTS = [
    " le ", " la ", " les ", " des ", " une ", " un ", " est ", " sont ",
    " pour ", " avec ", " votre ", " vos ", " vous ", " nous ", " frais ",
    " solde ", " compte ", " transfert ", " paiement ", " code ", " confirmation ",
    " bénéficiaire ", " montant ", " transaction ", " sécurité "
  ];
  const ENGLISH_HINTS = [
    " the ", " and ", " is ", " are ", " for ", " with ", " your ", " you ",
    " we ", " account ", " balance ", " fees ", " transfer ", " payment ",
    " code ", " confirmation ", " beneficiary ", " amount ", " transaction ",
    " security "
  ];

  let translated = new WeakMap();
  const translatedNodes = new Set();
  const flaggedNodes = new Set();
  let active = false;
  let observer = null;
  let applying = false;
  let pendingTimer = null;
  let toastHost = null;
  let selectionHost = null;

  /* ------------------------------------------------------------------ */
  /* Sélection des nœuds                                                */
  /* ------------------------------------------------------------------ */

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

    if (english > french * 1.2) return "en";
    return "fr";
  }

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

  function shouldSkip(node) {
    const element = node.parentElement;
    if (!element) return true;
    if (SKIP_TAGS.has(element.tagName)) return true;
    if (element.closest("[data-nk-ignore]")) return true;
    if (element.closest('input,textarea,select,option,[contenteditable="true"]')) {
      return true;
    }
    if (isSensitive(element)) return true;

    const text = node.nodeValue || "";
    if (!text.trim()) return true;
    if (!/[A-Za-zÀ-ÿ]/.test(text)) return true;

    // Un terme isolé de la liste "ne pas traduire" reste tel quel.
    if (
      DO_NOT_TRANSLATE.some(
        (term) => text.trim().toLowerCase() === term.toLowerCase()
      )
    ) {
      return true;
    }

    // Les URL affichées telles quelles ne sont pas du texte à traduire.
    if (element.closest("a") && /^https?:\/\//i.test(text.trim())) return true;

    return false;
  }

  function collectNodes(root = document.body) {
    const nodes = [];
    if (!root) return nodes;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (translatedNodes.has(node) || flaggedNodes.has(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return shouldSkip(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      }
    });

    while (walker.nextNode() && nodes.length < MAX_NODES_PER_PASS) {
      nodes.push(walker.currentNode);
    }
    return nodes;
  }

  function blockContext(element) {
    if (!element) return "";
    const block = element.closest(BLOCK_SELECTOR) || element;
    const text = (block.innerText || block.textContent || "").trim();
    return text.slice(0, 600);
  }

  /* ------------------------------------------------------------------ */
  /* Pseudonymisation des données sensibles                             */
  /* ------------------------------------------------------------------ */

  function redact(text) {
    const tokens = [];
    let value = String(text);
    let index = 0;

    const addToken = (kind, original) => {
      // Placeholder ASCII : plus robuste avec les tokenizers multilingues.
      const token = `[[${kind}_${index++}]]`;
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
      /\[\s*\[\s*(NUM|URL|EMAIL)\s*_\s*(\d+)\s*\]\s*\]/gi,
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

  function applyTranslation(node, text) {
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

    const element = node.parentElement;
    if (element) {
      element.setAttribute("lang", "fub");
      element.setAttribute("data-nk-translated", "true");
    }
  }

  function restoreAll() {
    for (const node of translatedNodes) {
      const original = translated.get(node);
      if (typeof original === "string") {
        node.nodeValue = original;
      }
      const element = node.parentElement;
      if (element) {
        element.removeAttribute("lang");
        element.removeAttribute("data-nk-translated");
      }
    }

    translatedNodes.clear();
    flaggedNodes.clear();
    translated = new WeakMap();
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

  async function translatePage() {
    if (applying) return;
    applying = true;
    active = true;
    stopObserver();
    showToast("Traduction en cours… Le modèle local peut prendre quelques secondes.");

    try {
      const nodes = collectNodes();
      if (nodes.length === 0) {
        showToast("Aucun nouveau texte à traduire.");
        return;
      }

      const source = detectSourceLanguage(
        document.body?.innerText || document.documentElement?.textContent || ""
      );

      const segments = nodes.map((node, index) => {
        const { text, tokens } = redact(node.nodeValue || "");
        return {
          id: `n${index}`,
          node,
          tokens,
          text,
          context: blockContext(node.parentElement)
        };
      });

      let translatedCount = 0;

      for (const batch of chunks(segments, BATCH_SIZE)) {
        const response = await api.runtime.sendMessage({
          type: "NK_TRANSLATE_SEGMENTS",
          target: TARGET,
          source,
          segments: batch.map(({ id, text, context }) => ({
            id,
            text,
            context
          }))
        });

        if (!response || response.error) {
          showToast("Backend indisponible. Lancez le serveur local.");
          break;
        }

        const byId = new Map(
          (response.translations || []).map((item) => [item.id, item])
        );

        for (const segment of batch) {
          const result = byId.get(segment.id);
          if (!result || !result.ok) {
            flaggedNodes.add(segment.node);
            continue;
          }

          const restored = restoreTokens(result.text, segment.tokens);
          if (!restored) {
            flaggedNodes.add(segment.node);
            continue;
          }

          applyTranslation(segment.node, restored);
          translatedCount += 1;
        }
      }

      showToast(
        `${translatedCount} segment(s) traduit(s) en fulfulde ` +
          `(source : ${source === "en" ? "anglais" : "français"}). ` +
          "Les montants et entités ont été préservés."
      );
    } catch (error) {
      console.error("[NkapLingua]", error);
      showToast("Erreur de traduction. Vérifiez le backend local.");
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
      pendingTimer = setTimeout(() => translatePage(), 900);
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

  async function translateSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text) {
      showToast("Sélectionnez d'abord du texte.");
      return;
    }

    // Capturer la position avant l'appel async : la sélection peut disparaître.
    let anchorRect = null;
    try {
      anchorRect = selection.getRangeAt(0).getBoundingClientRect();
    } catch {
      // La sélection peut être vide ou non textuelle.
    }

    const { text: redacted, tokens } = redact(text);

    try {
      const response = await api.runtime.sendMessage({
        type: "NK_TRANSLATE_TEXT",
        target: TARGET,
        source: detectSourceLanguage(text),
        text: redacted
      });

      if (!response || response.error || !response.translation?.ok) {
        showToast("Traduction impossible pour cette sélection.");
        return;
      }

      const restored = restoreTokens(response.translation.text, tokens);
      if (!restored) {
        showToast("Traduction non fiable : montants ou entités modifiés.");
        return;
      }

      showSelectionTooltip(text, restored, anchorRect);
    } catch (error) {
      console.error("[NkapLingua]", error);
      showToast("Erreur de traduction de la sélection.");
    }
  }

  function showSelectionTooltip(original, translation, rect) {
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
    tagText.textContent = "Fulfulde (Adamawa)";
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
    translationEl.textContent = translation;

    box.append(tag, originalEl, translationEl);
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
        max-width: 360px;
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
    }, 4000);
  }

  /* ------------------------------------------------------------------ */
  /* Messages                                                           */
  /* ------------------------------------------------------------------ */

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "NK_TRANSLATE_PAGE") {
      translatePage();
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "NK_RESTORE") {
      restoreAll();
      sendResponse({ ok: true });
      return true;
    }

    if (message?.type === "NK_TRANSLATE_SELECTION") {
      translateSelection();
      sendResponse({ ok: true });
      return true;
    }

    return false;
  });
})();
