const api = globalThis.browser ?? globalThis.chrome;
const LANG = globalThis.NK_LANGUAGES;
const UI = globalThis.NK_UI;

const $ = (id) => document.getElementById(id);
const t = (key, vars) => (UI ? UI.t(key, vars) : key);

let target = "fub";
let actionBusy = false;

function setStatus(message) {
  const status = $("status");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = /erreur|refus|impossible|indisponible|non fiable|aucun|collez|sélectionnez|pas pu|error|failed|unavailable|not possible|could not|select some text|no new text|no phrase|no translation|not translated/i.test(
    message
  )
    ? "danger"
    : "ok";
}

function setTestError(message = "") {
  const error = $("testError");
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
  $("unseen")?.setAttribute("aria-invalid", message ? "true" : "false");
}

function failTest(message) {
  setTestError(message);
  setStatus(t("testFailed"));
}

function updatePrivacyIndicator(enabled) {
  const indicator = $("privacyMode");
  if (!indicator) return;
  indicator.textContent = t(enabled ? "cloudActive" : "local");
  indicator.dataset.cloud = enabled ? "true" : "false";
}

function setActionsBusy(busy) {
  actionBusy = busy;
  for (const id of ["translatePage", "restore", "translateSelection"]) {
    const button = $(id);
    if (button) button.disabled = busy;
  }
  document.querySelector(".app")?.setAttribute("aria-busy", busy ? "true" : "false");
}

function pageResultMessage(result) {
  const parts = [
    t("result", { n: result.translated }),
    result.untranslated ? t("remaining", { n: result.untranslated }) : null,
    result.partial ? t("partials", { n: result.partial }) : null
  ].filter(Boolean);
  return (
    `${parts.join(" · ")}.` +
    (result.truncated ? ` ${t("truncated")}.` : "")
  );
}

async function refreshPageState() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    const state = await api.tabs.sendMessage(tab.id, { type: "NK_GET_STATE" });
    if (state?.busy) {
      setStatus(t("working"));
      return;
    }
    if (state?.translated) {
      const label = state.label
        ? displayName({ label: state.label })
        : t("unknownLanguage");
      setStatus(
        t("pageTranslated", { lang: label, n: state.translated }) +
          (state.untranslated
            ? ` · ${t("remaining", { n: state.untranslated })}`
            : "") +
          (state.truncated ? ` · ${t("truncated")}` : "")
      );
      return;
    }
    setStatus(t("ready"));
  } catch {
    setStatus(t("ready"));
  }
}

function spec() {
  return LANG.getTarget(target) || LANG.getTarget("fub");
}

function hideReceipt() {
  const receipt = $("receipt");
  if (receipt) receipt.hidden = true;
}

function renderReceipt(summary) {
  const receipt = $("receipt");
  if (!receipt) return;
  if (!summary || !summary.translated) {
    hideReceipt();
    return;
  }
  $("receiptTranslated").textContent = summary.translated;
  $("receiptPartial").textContent = summary.partial || 0;
  $("receiptUntranslated").textContent = summary.untranslated || 0;
  $("receiptUnverified").textContent = summary.human || 0;
  $("receiptEngine").textContent = summary.provider
    ? providerLabel(summary.provider)
    : "";
  const notes = [];
  if (summary.demo) {
    notes.push(t("receiptDemo", { n: summary.demo }));
  }
  if (summary.truncated) notes.push(t("truncated"));
  notes.push(summary.human ? t("receiptDraft") : t("receiptValidated"));
  $("receiptNote").textContent = notes.join(" · ");
  receipt.hidden = false;
}

api.runtime.onMessage.addListener((message) => {
  if (message?.type !== "NK_TRANSLATION_SUMMARY") return;
  const summary = message.summary || {};
  renderReceipt(summary);
  if (!summary.translated) {
    setStatus(t("noTranslation"));
    return;
  }
  if (summary.simple) {
    setStatus(t("translationDone"));
    return;
  }
  const lang = summary.label
    ? displayName({ label: summary.label })
    : t("unknownLanguage");
  const parts = [
    t("result", { n: summary.translated }) + ` (${lang})`,
    summary.human ? t("elementsUnverified", { n: summary.human }) : null,
    summary.demo ? t("demoAlerts", { n: summary.demo }) : null,
    summary.untranslated ? t("remaining", { n: summary.untranslated }) : null,
    summary.truncated ? t("truncated") : null
  ].filter(Boolean);
  setStatus(parts.join(" · ") + ".");
});

function displayName(item) {
  return String(item?.label || "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .toLowerCase();
}

function providerLabel(provider) {
  if (provider === "pack") return t("providerPack");
  if (provider === "flagship") return t("providerFlagship");
  if (provider === "mixed") return t("providerMixed");
  if (provider === "hybrid") return t("providerHybrid");
  if (provider === "nllb" || provider === "local") return t("providerLocal");
  if (provider === "cloud") return t("providerCloud");
  if (provider === "mock") return t("providerMock");
  return t("providerUnknown");
}

function optionCheckSvg() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("option-check");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", "M3.5 8.5l3 3 6-6");
  svg.append(path);
  return svg;
}

function updateLanguageUI() {
  const current = spec();

  $("targetCode").textContent = current.shortLabel;
  $("languageLabel").textContent = current.label;
  $("languageButton").setAttribute(
    "aria-label",
    `${t("targetLabel")} : ${current.label}`
  );
  $("engineTag").textContent =
    `${current.engineLabel || (current.engine === "pack" ? t("pack") : t("mt"))}:`;
  $("targetStatus").textContent = t("drafts");
  $("targetNote").title = current.region || "";
  $("targetNote").dataset.engine = current.engine;

  for (const option of $("languageList").querySelectorAll(".lang-option")) {
    option.setAttribute(
      "aria-selected",
      option.dataset.code === current.code ? "true" : "false"
    );
  }
}

function populateLanguages() {
  const list = $("languageList");
  list.textContent = "";

  for (const item of LANG.listTargets()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lang-option";
    button.dataset.code = item.code;
    button.tabIndex = -1;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");

    const label = document.createElement("span");
    label.className = "option-label";
    label.textContent = item.label;

    const engine = document.createElement("span");
    engine.className = "option-engine";
    engine.textContent =
      item.engineLabel || (item.engine === "pack" ? "PACK" : "MT");

    button.append(label, engine, optionCheckSvg());
    button.addEventListener("click", () => selectLanguage(item.code));
    list.append(button);
  }
}

function openLanguageList() {
  const list = $("languageList");
  if (!list.hidden) return;
  list.hidden = false;
  $("languageButton").setAttribute("aria-expanded", "true");
  const rail = list.closest(".lang-rail");
  if (rail) {
    rail.style.marginBottom = `${Math.ceil(list.getBoundingClientRect().height) + 6}px`;
  }
  const selected =
    list.querySelector('[aria-selected="true"]') ||
    list.querySelector(".lang-option");
  selected?.focus({ preventScroll: true });
}

function closeLanguageList(refocus = false) {
  const list = $("languageList");
  if (list.hidden) return;
  list.hidden = true;
  $("languageButton").setAttribute("aria-expanded", "false");
  const rail = list.closest(".lang-rail");
  if (rail) rail.style.marginBottom = "";
  if (refocus) $("languageButton").focus({ preventScroll: true });
}

async function getActiveTab() {
  const [tab] = await api.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab;
}

async function selectLanguage(code) {
  const next = LANG.getTarget(code);
  if (!next) return;

  target = code;
  updateLanguageUI();
  closeLanguageList(true);

  try {
    await api.storage.local.set({ nkTarget: target });
  } catch {
    // Le stockage peut être indisponible ; la session reste utilisable.
  }

  try {
    const tab = await getActiveTab();
    if (tab?.id) {
      const response = await api.tabs.sendMessage(tab.id, {
        type: "NK_SET_TARGET",
        target
      });
      if (response?.retranslating) {
        setStatus(t("languageRetranslating", { lang: next.label }));
        return;
      }
    }
  } catch {
    // Le content script n'est peut-être pas encore injecté.
  }

  setStatus(t("languageChanged", { lang: next.label }));
}

async function ensureContentScript(tabId) {
  try {
    await api.scripting.executeScript({
      target: { tabId },
      files: ["languages.js", "content.js"]
    });
  } catch (error) {
    throw new Error(
      "Injection impossible sur cette page. Utilisez une page web classique."
    );
  }
}

async function sendToPage(message) {
  const tab = await getActiveTab();
  if (!tab?.id) throw new Error("Aucun onglet actif.");
  await ensureContentScript(tab.id);
  return api.tabs.sendMessage(tab.id, message);
}

async function detectSiteLanguage() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id || !api.scripting?.executeScript) return null;
    const results = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.documentElement.lang || ""
    });
    const declared = String(results?.[0]?.result || "").toLowerCase();
    if (declared.startsWith("en")) return "en";
    if (declared.startsWith("fr")) return "fr";
  } catch {
    // Page protégée ou permission absente : on garde le français.
  }
  return null;
}

async function loadTarget() {
  try {
    const stored = await api.storage.local.get("nkTarget");
    if (stored?.nkTarget && LANG.getTarget(stored.nkTarget)) {
      target = stored.nkTarget;
    }
  } catch {
    // On garde la valeur par défaut.
  }

  const siteLanguage = await detectSiteLanguage();
  if (siteLanguage) UI?.apply(siteLanguage);

  populateLanguages();
  updateLanguageUI();

  try {
    const cloud = await api.storage.local.get("nkCloudFallback");
    $("cloudFallback").checked = cloud?.nkCloudFallback === true;
  } catch {
    $("cloudFallback").checked = false;
  }
  updatePrivacyIndicator($("cloudFallback").checked);

  await refreshPageState();
}

$("languageButton").addEventListener("click", (event) => {
  event.stopPropagation();
  if ($("languageList").hidden) {
    openLanguageList();
  } else {
    closeLanguageList(true);
  }
});

$("languageButton").addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    openLanguageList();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeLanguageList(true);
  }
});

$("languageList").addEventListener("keydown", (event) => {
  const options = [...document.querySelectorAll(".lang-option")];
  const index = options.indexOf(document.activeElement);

  if (event.key === "ArrowDown") {
    event.preventDefault();
    options[Math.min(index + 1, options.length - 1)]?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    options[Math.max(index - 1, 0)]?.focus();
  } else if (event.key === "Home") {
    event.preventDefault();
    options[0]?.focus();
  } else if (event.key === "End") {
    event.preventDefault();
    options[options.length - 1]?.focus();
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeLanguageList(true);
  }
});

$("languageList").addEventListener("focusout", (event) => {
  const next = event.relatedTarget;
  if (
    !next ||
    (!next.closest?.(".lang-rail") && next !== $("languageButton"))
  ) {
    closeLanguageList();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".lang-rail")) closeLanguageList();
});

$("cloudFallback").addEventListener("change", async () => {
  const enabled = $("cloudFallback").checked;
  updatePrivacyIndicator(enabled);
  try {
    await api.storage.local.set({ nkCloudFallback: enabled });
  } catch {
    // Le réglage reste valable pour la session.
  }
  setStatus(t(enabled ? "cloudOn" : "cloudOff"));
});

function localizeActionError(message) {
  if (!UI || UI.lang !== "en") return message;
  const known = {
    "Sélectionnez d'abord du texte.": "noSelection",
    "Aucun nouveau texte à traduire.": "noNewText",
    "Aucune traduction à restaurer.": "nothingToRestore",
    "Une traduction est déjà en cours.": "alreadyTranslating",
    "Aucune phrase n'a pu être traduite. Le texte original est conservé.":
      "noTranslation"
  };
  return known[message] ? t(known[message]) : t("actionError");
}

async function runPageAction(button, pending, message, successText, useResult = false) {
  if (actionBusy) return;
  setActionsBusy(true);
  setStatus(pending);
  try {
    const response = await sendToPage(message);
    if (!response?.ok) {
      setStatus(localizeActionError(response?.error || t("actionError")));
      return;
    }
    if (response.simple) {
      setStatus(t("translationDone"));
    } else if (useResult && typeof response.translated === "number") {
      setStatus(pageResultMessage(response));
    } else {
      setStatus(response.message || successText);
    }
  } catch (error) {
    setStatus(localizeActionError(error.message));
  } finally {
    setActionsBusy(false);
  }
}

$("translatePage").addEventListener("click", () =>
  runPageAction(
    $("translatePage"),
    t("translating", { lang: displayName(spec()) }),
    { type: "NK_TRANSLATE_PAGE", target },
    t("translationDone"),
    true
  )
);

$("restore").addEventListener("click", () => {
  hideReceipt();
  return runPageAction(
    $("restore"),
    t("restoring"),
    { type: "NK_RESTORE" },
    t("restored")
  );
});

$("translateSelection").addEventListener("click", () =>
  runPageAction(
    $("translateSelection"),
    t("selecting"),
    { type: "NK_TRANSLATE_SELECTION", target },
    t("selectionDone")
  )
);

$("unseen").addEventListener("input", () => setTestError(""));

$("translateText").addEventListener("click", async () => {
  const text = $("unseen").value.trim();
  const result = $("result");
  const meta = $("resultMeta");

  if (!text) {
    failTest(t("testEmpty"));
    $("unseen").focus();
    return;
  }

  setTestError("");
  result.textContent = "";
  meta.textContent = "";
  setStatus(t("working"));

  const runButton = $("translateText");
  runButton.disabled = true;
  runButton.setAttribute("aria-busy", "true");

  try {
    const response = await api.runtime.sendMessage({
      type: "NK_TRANSLATE_TEXT",
      target,
      text
    });

    if (response?.error) {
      failTest(localizeActionError(response.error));
      return;
    }

    const detected = response?.detected;
    const detectedLabel =
      detected?.code === "en"
        ? `${t("english")} (${Math.round((detected.confidence || 0) * 100)} %)`
        : detected?.code === "fr"
          ? `${t("french")} (${Math.round((detected.confidence || 0) * 100)} %)`
          : t("unknownLanguage");

    if (!response?.translation?.ok) {
      const reason = String(response?.translation?.reason || "");
      let message = "La traduction a été refusée par sécurité. Le texte original est conservé.";
      if (reason === "pack_miss") {
        message = t("packMiss", { lang: spec().label });
      } else if (reason === "pack_unverified") {
        message = t("packUnverified");
      } else if (
        reason === "untranslated_critical" ||
        reason === "critical_pack_only"
      ) {
        message = t("critical");
      } else if (reason.startsWith("low_roundtrip")) {
        message = t("lowRoundtrip");
      } else if (reason.startsWith("token_lost")) {
        message = t("tokenLost");
      } else if (
        reason === "too_short" ||
        reason === "too_long" ||
        reason === "repetitive"
      ) {
        message = t("tooShort");
      } else if (reason.startsWith("dnt_missing")) {
        message = t("dntMissing");
      } else if (reason === "english_leak" || reason === "french_leak") {
        message = t("wrongLanguage");
      } else {
        message = t("refused");
      }
      failTest(message);
      return;
    }

    result.textContent = response.translation.text;
    result.lang = target;
    meta.textContent =
      `${t("sourceDetected")} : ${detectedLabel} · ` +
      `${t("engine")} : ${providerLabel(response.provider)} · ` +
      `${t("targetLabel")} : ${spec().label}`;

    if (typeof response.translation.roundtrip === "number") {
      meta.textContent +=
        ` · ${Math.round(response.translation.roundtrip * 100)} %`;
    }
    setTestError("");
    setStatus(t("testSuccess"));
  } catch (error) {
    failTest(localizeActionError(error.message));
  } finally {
    runButton.disabled = false;
    runButton.removeAttribute("aria-busy");
  }
});

loadTarget();
