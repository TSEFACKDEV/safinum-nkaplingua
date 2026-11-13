/**
 * Widget flottant NkapLingua.
 *
 * Vit dans un Shadow DOM : aucune règle CSS du site ne peut le déformer,
 * et il ne lit jamais les champs, mots de passe, PIN ou valeurs de formulaire.
 * Le widget ne fait qu'appeler l'API locale exposée par content.js.
 */
(() => {
  "use strict";

  if (globalThis.__NK_WIDGET__) return;
  const api = globalThis.__NK_WIDGET_API__;
  if (!api) return;
  globalThis.__NK_WIDGET__ = true;

  const pageIsEnglish = () =>
    String(document.documentElement?.lang || "").toLowerCase().startsWith("en");

  const copy = () =>
    pageIsEnglish()
      ? {
          open: "Open NkapLingua",
          close: "Close",
          title: "Translate this page",
          language: "Target language",
          translate: "Translate page",
          restore: "Restore",
          selection: "Translate selection",
          testTitle: "Test a text",
          testPlaceholder: "Paste a financial text…",
          testAction: "Translate this text",
          ready: "Ready.",
          working: "Translation in progress…",
          translated: "Page translated.",
          restored: "Original restored.",
          selected: "Selection translated.",
          languageChanged: "Language updated.",
          textTranslated: "Text translated.",
          noSelection: "Select some text on the page first.",
          noText: "Paste a text first.",
          error: "Action could not be completed.",
          sensitive: "This sentence concerns money or security. It stays in French.",
          unavailable: "This sentence is not available yet. It stays in French.",
          moved: "Move NkapLingua"
        }
      : {
          open: "Ouvrir NkapLingua",
          close: "Fermer",
          title: "Traduire cette page",
          language: "Langue cible",
          translate: "Traduire la page",
          restore: "Restaurer",
          selection: "Traduire la sélection",
          testTitle: "Tester un texte",
          testPlaceholder: "Collez un texte financier…",
          testAction: "Traduire ce texte",
          ready: "Prêt.",
          working: "Traduction en cours…",
          translated: "Page traduite.",
          restored: "Original restauré.",
          selected: "Sélection traduite.",
          languageChanged: "Langue mise à jour.",
          textTranslated: "Texte traduit.",
          noSelection: "Sélectionnez d'abord du texte sur la page.",
          noText: "Collez d'abord un texte.",
          error: "Action impossible.",
          sensitive: "Cette phrase touche à l'argent ou à la sécurité. Elle reste en français.",
          unavailable: "Cette phrase n'est pas encore disponible. Elle reste en français.",
          moved: "Déplacer NkapLingua"
        };

  const host = document.createElement("div");
  host.id = "nk-widget-host";
  host.style.cssText =
    "all:initial;position:fixed;right:20px;bottom:20px;width:48px;height:48px;" +
    "z-index:2147483000;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host { color-scheme: light; }
      *, *::before, *::after { box-sizing: border-box; }
      button, select, textarea { font: inherit; }
      button { -webkit-tap-highlight-color: transparent; }
      .root {
        --forest: #123B2E; --forest-700: #1D5A45; --forest-100: #DCEBE3;
        --gold: #C9A45C; --cream: #F8F4EC; --ink: #10231C;
        pointer-events: auto; font: 13px/1.45 "Noto Sans", system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink);
      }
      .launcher {
        display: block; width: 48px; height: 48px; padding: 0;
        border: 0; border-radius: 14px; background: transparent;
        cursor: grab; box-shadow: 0 10px 26px rgba(18,59,46,.28);
        touch-action: none;
        transition: transform 120ms cubic-bezier(.2,0,0,1), box-shadow 120ms cubic-bezier(.2,0,0,1);
      }
      .launcher:hover { transform: translateY(-1px); box-shadow: 0 13px 30px rgba(18,59,46,.34); }
      .launcher:active { transform: translateY(1px); cursor: grabbing; }
      .launcher:focus-visible {
        outline: 2px solid var(--gold); outline-offset: 3px;
        box-shadow: 0 0 0 5px rgba(248,244,236,.9), 0 10px 26px rgba(18,59,46,.3);
      }
      .launcher svg { display: block; width: 48px; height: 48px; border-radius: 14px; }
      .panel {
        position: absolute; right: 0; bottom: 60px;
        width: min(320px, calc(100vw - 24px)); max-height: calc(100vh - 96px);
        overflow: auto; overscroll-behavior: contain;
        border: 1px solid var(--forest-100); border-radius: 14px; background: #fff;
        box-shadow: 0 18px 44px rgba(18,59,46,.2);
        scrollbar-width: thin; scrollbar-color: var(--forest-100) transparent;
        animation: panel-in 160ms cubic-bezier(.2,0,0,1) both;
      }
      .panel[hidden] { display: none; }
      @keyframes panel-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      .header {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        min-height: 48px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--forest-100);
        cursor: grab; user-select: none; touch-action: none;
      }
      .header:active { cursor: grabbing; }
      .brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .mark { display: block; width: 24px; height: 24px; flex: none; }
      .mark svg { display: block; width: 24px; height: 24px; border-radius: 7px; }
      .name { color: var(--forest); font-size: 13px; font-weight: 700; letter-spacing: -.01em; white-space: nowrap; }
      .header-actions { display: flex; align-items: center; gap: 2px; flex: none; }
      .icon-button {
        display: grid; place-items: center; width: 44px; height: 44px; padding: 0;
        border: 0; border-radius: 8px; background: transparent; color: var(--forest-700); cursor: pointer;
      }
      .icon-button:hover { background: var(--cream); color: var(--forest); }
      .icon-button:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }
      .icon-button svg { width: 16px; height: 16px; }
      .body { padding: 14px; }
      .field { display: grid; gap: 6px; margin-bottom: 10px; }
      .label { color: var(--forest-700); font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .select {
        width: 100%; height: 44px; padding: 0 34px 0 11px;
        border: 1px solid var(--forest-100); border-radius: 8px; background: #fff; color: var(--ink);
        font-size: 13px; font-weight: 600; cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M5 7.5l5 5 5-5' fill='none' stroke='%23666' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat; background-position: right 11px center; background-size: 14px;
      }
      .select:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }
      .status {
        min-height: 18px; margin: 0 0 10px; color: var(--forest-700); font-size: 12px; line-height: 1.4;
      }
      .status[data-tone="danger"] { color: #b42318; }
      .primary {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        width: 100%; height: 44px; padding: 0 12px 0 14px;
        border: 0; border-radius: 8px; background: var(--forest); color: #fff;
        font-size: 13px; font-weight: 600; cursor: pointer;
        transition: background-color 120ms cubic-bezier(.2,0,0,1), transform 120ms cubic-bezier(.2,0,0,1);
      }
      .primary:hover { background: var(--forest-700); }
      .primary:active { transform: translateY(1px); }
      .primary:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .primary svg { width: 16px; height: 16px; flex: none; }
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; }
      .secondary {
        height: 44px; padding: 0 8px; border: 1px solid var(--forest-100); border-radius: 8px;
        background: #fff; color: var(--forest); font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .secondary:hover { background: var(--cream); border-color: var(--gold); }
      .secondary:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      button:disabled { opacity: .55; cursor: default; }
      .primary:disabled:hover, .secondary:disabled:hover { background: inherit; }
      .test { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--forest-100); }
      .test > summary {
        display: flex; align-items: center; gap: 8px; min-height: 44px;
        color: var(--forest); font-size: 12px; font-weight: 600; cursor: pointer; list-style: none;
      }
      .test > summary::-webkit-details-marker { display: none; }
      .test > summary::after {
        content: ""; width: 6px; height: 6px; margin-left: auto;
        border-right: 1.5px solid var(--forest-700); border-bottom: 1.5px solid var(--forest-700);
        transform: rotate(45deg);
      }
      .test[open] > summary::after { transform: rotate(-135deg); }
      .test > summary:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; border-radius: 6px; }
      .textarea {
        width: 100%; min-height: 68px; margin-top: 4px; padding: 9px 10px;
        border: 1px solid var(--forest-100); border-radius: 8px; background: #fff; color: var(--ink);
        font-size: 12px; line-height: 1.5; resize: vertical;
      }
      .textarea:focus-visible { outline: 2px solid var(--gold); outline-offset: 1px; }
      .run {
        width: 100%; height: 44px; margin-top: 6px;
        border: 1px solid var(--forest-100); border-radius: 8px; background: var(--cream);
        color: var(--forest); font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .run:hover { background: #F1E8D6; }
      .run:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
      .error { margin: 6px 0 0; color: #b42318; font-size: 12px; line-height: 1.4; }
      .result { margin-top: 8px; color: var(--ink); font-size: 12px; line-height: 1.5; white-space: pre-wrap; }
      .result:not(:empty) { padding: 8px 9px; border: 1px solid var(--forest-100); border-radius: 8px; background: var(--cream); }
      .grip { display: grid; place-items: center; width: 24px; height: 24px; color: var(--gold); flex: none; }
      .grip svg { width: 14px; height: 14px; }
      @media (prefers-reduced-motion: reduce) {
        .panel { animation: none; }
        *, *::before, *::after { transition-duration: 1ms !important; }
      }
    </style>
    <div class="root" data-busy="false">
      <button class="launcher" id="launcher" type="button" aria-expanded="false" aria-controls="panel">
        <svg viewBox="0 0 128 128" aria-hidden="true">
          <rect width="128" height="128" rx="30" fill="#123B2E"/>
          <path d="M28 94V34h14l26 35V34h14v60H68L42 59v35H28z" fill="#C9A45C"/>
          <path d="M94 43c8 5 13 13 13 22s-5 17-13 22" fill="none" stroke="#F8F4EC" stroke-width="6" stroke-linecap="round"/>
          <circle cx="101" cy="66" r="4.5" fill="#F8F4EC"/>
        </svg>
      </button>
      <section class="panel" id="panel" role="dialog" aria-modal="false" aria-labelledby="widget-name" hidden>
        <header class="header" id="drag">
          <div class="brand">
            <span class="mark" aria-hidden="true">
              <svg viewBox="0 0 128 128">
                <rect width="128" height="128" rx="30" fill="#123B2E"/>
                <path d="M28 94V34h14l26 35V34h14v60H68L42 59v35H28z" fill="#C9A45C"/>
                <path d="M94 43c8 5 13 13 13 22s-5 17-13 22" fill="none" stroke="#F8F4EC" stroke-width="6" stroke-linecap="round"/>
                <circle cx="101" cy="66" r="4.5" fill="#F8F4EC"/>
              </svg>
            </span>
            <span class="name" id="widget-name">NkapLingua</span>
          </div>
          <div class="header-actions">
            <span class="grip" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <circle cx="5" cy="4" r="1.1"/><circle cx="11" cy="4" r="1.1"/>
                <circle cx="5" cy="8" r="1.1"/><circle cx="11" cy="8" r="1.1"/>
                <circle cx="5" cy="12" r="1.1"/><circle cx="11" cy="12" r="1.1"/>
              </svg>
            </span>
            <button class="icon-button" id="close" type="button">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </header>
        <div class="body">
          <div class="field">
            <label class="label" id="language-label" for="language"></label>
            <select class="select" id="language"></select>
          </div>
          <p class="status" id="status" role="status" aria-live="polite" data-tone="ok"></p>
          <button class="primary" id="translate" type="button">
            <span id="translate-label"></span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="actions">
            <button class="secondary" id="restore" type="button"></button>
            <button class="secondary" id="selection" type="button"></button>
          </div>
          <details class="test" id="test">
            <summary id="test-title"></summary>
            <textarea class="textarea" id="unseen" rows="3"></textarea>
            <p class="error" id="test-error" role="alert" hidden></p>
            <button class="run" id="translate-text" type="button"></button>
            <div class="result" id="result" aria-live="polite"></div>
          </details>
        </div>
      </section>
    </div>
  `;

  document.documentElement.appendChild(host);

  const $ = (id) => shadow.getElementById(id);
  const launcher = $("launcher");
  const panel = $("panel");
  const closeButton = $("close");
  const drag = $("drag");
  const language = $("language");
  const status = $("status");
  const translateButton = $("translate");
  const restoreButton = $("restore");
  const selectionButton = $("selection");
  const unseen = $("unseen");
  const testError = $("test-error");
  const testButton = $("translate-text");
  const result = $("result");
  const root = shadow.querySelector(".root");

  let busy = false;
  let dragState = null;
  let launcherDrag = null;
  let suppressLauncherClick = false;

  function setTextCopy() {
    const c = copy();
    launcher.setAttribute("aria-label", c.open);
    launcher.setAttribute("title", c.open);
    closeButton.setAttribute("aria-label", c.close);
    closeButton.setAttribute("title", c.close);
    $("language-label").textContent = c.language;
    $("translate-label").textContent = c.translate;
    restoreButton.textContent = c.restore;
    selectionButton.textContent = c.selection;
    $("test-title").textContent = c.testTitle;
    unseen.placeholder = c.testPlaceholder;
    testButton.textContent = c.testAction;
  }

  function setStatus(message, tone = "ok") {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function setBusy(value) {
    busy = value;
    root.dataset.busy = value ? "true" : "false";
    for (const node of [translateButton, language, restoreButton, selectionButton, testButton]) {
      node.disabled = value;
    }
    panel.setAttribute("aria-busy", value ? "true" : "false");
  }

  function syncState() {
    const state = api.getState?.() || {};
    restoreButton.disabled = busy || !state.translated;
    if (!state.translated && !busy && !status.textContent) {
      setStatus(copy().ready);
    }
  }

  function populateLanguages() {
    const current = api.getTarget();
    language.textContent = "";
    for (const item of api.getLanguages()) {
      const option = document.createElement("option");
      option.value = item.code;
      option.textContent = item.label;
      if (item.code === current.code) option.selected = true;
      language.append(option);
    }
  }

  function positionPanel() {
    const rect = host.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    if (rect.top < panelRect.height + 76) {
      panel.style.bottom = "auto";
      panel.style.top = "60px";
    } else {
      panel.style.bottom = "60px";
      panel.style.top = "auto";
    }
  }

  function openPanel() {
    setTextCopy();
    populateLanguages();
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    const state = api.getState?.() || {};
    setStatus(state.translated ? copy().translated : copy().ready);
    syncState();
    positionPanel();
    requestAnimationFrame(() => language.focus({ preventScroll: true }));
  }

  function closePanel(refocus = true) {
    if (panel.hidden) return;
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    if (refocus) launcher.focus({ preventScroll: true });
  }

  async function quietly(action) {
    globalThis.__NK_WIDGET_QUIET__ = true;
    try {
      return await action();
    } finally {
      globalThis.__NK_WIDGET_QUIET__ = false;
    }
  }

  async function translatePage() {
    if (busy) return;
    setBusy(true);
    setStatus(copy().working);
    try {
      const response = await quietly(() => api.translatePage());
      if (!response?.ok) {
        setStatus(response?.error || copy().error, "danger");
        return;
      }
      setStatus(copy().translated);
      syncState();
    } catch (error) {
      setStatus(error?.message || copy().error, "danger");
    } finally {
      setBusy(false);
      syncState();
    }
  }

  function restorePage() {
    if (busy) return;
    globalThis.__NK_WIDGET_QUIET__ = true;
    let response;
    try {
      response = api.restore();
    } finally {
      globalThis.__NK_WIDGET_QUIET__ = false;
    }
    if (!response?.ok) {
      setStatus(response?.error || copy().error, "danger");
      return;
    }
    setStatus(copy().restored);
    syncState();
  }

  async function translateSelection() {
    if (busy) return;
    const text = api.getSelection?.() || "";
    if (!text.trim()) {
      setStatus(copy().noSelection, "danger");
      return;
    }
    setBusy(true);
    setStatus(copy().working);
    try {
      const response = await quietly(() => api.translateSelection(undefined, text));
      if (!response?.ok) {
        setStatus(response?.error || copy().error, "danger");
        return;
      }
      setStatus(copy().selected);
    } catch (error) {
      setStatus(error?.message || copy().error, "danger");
    } finally {
      setBusy(false);
    }
  }

  async function translateText() {
    const text = unseen.value.trim();
    if (!text) {
      testError.textContent = copy().noText;
      testError.hidden = false;
      unseen.focus();
      return;
    }
    testError.hidden = true;
    result.textContent = "";
    testButton.disabled = true;
    setStatus(copy().working);
    try {
      const response = await api.translateText(text);
      if (response?.error) {
        testError.textContent = response.error;
        testError.hidden = false;
        setStatus(copy().error, "danger");
        return;
      }
      const translation = response?.translation;
      if (!translation?.ok) {
        testError.textContent =
          translation?.reason === "untranslated_critical"
            ? copy().sensitive
            : copy().unavailable;
        testError.hidden = false;
        setStatus(copy().error, "danger");
        return;
      }
      result.textContent = translation.text;
      setStatus(copy().textTranslated);
    } catch (error) {
      testError.textContent = error?.message || copy().error;
      testError.hidden = false;
      setStatus(copy().error, "danger");
    } finally {
      testButton.disabled = false;
    }
  }

  launcher.addEventListener("click", (event) => {
    if (suppressLauncherClick) {
      suppressLauncherClick = false;
      event.preventDefault();
      return;
    }
    if (panel.hidden) openPanel();
    else closePanel();
  });
  closeButton.addEventListener("click", () => closePanel());
  translateButton.addEventListener("click", translatePage);
  restoreButton.addEventListener("click", restorePage);
  selectionButton.addEventListener("click", translateSelection);
  testButton.addEventListener("click", translateText);
  unseen.addEventListener("input", () => {
    testError.hidden = true;
  });
  language.addEventListener("change", async () => {
    setBusy(true);
    setStatus(copy().working);
    try {
      const response = await quietly(() => api.setTarget(language.value));
      setStatus(response?.ok ? copy().languageChanged : response?.error || copy().error, response?.ok ? "ok" : "danger");
      if (response?.ok) syncState();
    } finally {
      setBusy(false);
    }
  });

  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      event.stopPropagation();
      closePanel();
    }
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (panel.hidden) return;
      if (!event.composedPath().includes(host)) closePanel(false);
    },
    true
  );

  window.addEventListener("resize", () => {
    const rect = host.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - 56);
    const top = Math.min(Math.max(8, rect.top), window.innerHeight - 56);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  });

  // Le launcher est déplaçable même quand le panneau est fermé.
  launcher.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Un nouveau geste annule un éventuel clic de drag non émis.
    suppressLauncherClick = false;
    const rect = host.getBoundingClientRect();
    launcherDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    launcher.setPointerCapture?.(event.pointerId);
  });
  launcher.addEventListener("pointermove", (event) => {
    if (!launcherDrag || launcherDrag.pointerId !== event.pointerId) return;
    const dx = event.clientX - launcherDrag.startX;
    const dy = event.clientY - launcherDrag.startY;
    if (!launcherDrag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    launcherDrag.moved = true;
    const left = Math.min(Math.max(8, launcherDrag.left + dx), window.innerWidth - 56);
    const top = Math.min(Math.max(8, launcherDrag.top + dy), window.innerHeight - 56);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
    event.preventDefault();
  });
  const endLauncherDrag = async (event) => {
    if (!launcherDrag || launcherDrag.pointerId !== event.pointerId) return;
    const moved = launcherDrag.moved;
    launcherDrag = null;
    if (moved) {
      suppressLauncherClick = true;
      const storage = (globalThis.browser ?? globalThis.chrome)?.storage?.local;
      const rect = host.getBoundingClientRect();
      try {
        await storage?.set({
          nkWidgetPosition: { left: Math.round(rect.left), top: Math.round(rect.top) }
        });
      } catch {
        // La position reste valable pour la session.
      }
    }
  };
  launcher.addEventListener("pointerup", endLauncherDrag);
  launcher.addEventListener("pointercancel", endLauncherDrag);

  // Déplacement au pointeur depuis l'en-tête.
  drag.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("button")) return;
    const rect = host.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    drag.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  drag.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
    dragState.moved = true;
    const left = Math.min(Math.max(8, dragState.left + dx), window.innerWidth - 56);
    const top = Math.min(Math.max(8, dragState.top + dy), window.innerHeight - 56);
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.right = "auto";
    host.style.bottom = "auto";
  });
  const endDrag = async (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const moved = dragState.moved;
    dragState = null;
    if (moved) {
      const storage = (globalThis.browser ?? globalThis.chrome)?.storage?.local;
      const rect = host.getBoundingClientRect();
      try {
        await storage?.set({
          nkWidgetPosition: { left: Math.round(rect.left), top: Math.round(rect.top) }
        });
      } catch {
        // La position reste valable pour la session.
      }
    }
  };
  drag.addEventListener("pointerup", endDrag);
  drag.addEventListener("pointercancel", endDrag);

  setTextCopy();

  (async () => {
    const storage = (globalThis.browser ?? globalThis.chrome)?.storage?.local;
    try {
      const stored = await storage?.get("nkWidgetPosition");
      const position = stored?.nkWidgetPosition;
      if (
        position &&
        Number.isFinite(position.left) &&
        Number.isFinite(position.top)
      ) {
        host.style.left = `${Math.min(Math.max(8, position.left), window.innerWidth - 56)}px`;
        host.style.top = `${Math.min(Math.max(8, position.top), window.innerHeight - 56)}px`;
        host.style.right = "auto";
        host.style.bottom = "auto";
      }
    } catch {
      // Position par défaut.
    }
    setTextCopy();
    syncState();
  })();
})();
