const api = globalThis.browser ?? globalThis.chrome;
const LANG = globalThis.NK_LANGUAGES;

const $ = (id) => document.getElementById(id);

let target = "fub";

function setStatus(message) {
  const status = $("status");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = /erreur|refus|impossible|indisponible|non fiable|aucun onglet|collez/i.test(
    message
  )
    ? "danger"
    : "ok";
}

function spec() {
  return LANG.getTarget(target) || LANG.getTarget("fub");
}

function displayName(item) {
  return String(item?.label || "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .toLowerCase();
}

function providerLabel(provider) {
  if (provider === "pack") return "pack communautaire";
  if (provider === "local") return "backend local NLLB";
  if (provider === "cloud") return "MyMemory (cloud)";
  return "moteur inconnu";
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
    `Langue cible : ${current.label}`
  );
  $("heroTitle").textContent = "Traduire cette page";
  $("engineTag").textContent = current.engine === "pack" ? "PACK:" : "MT:";
  $("targetStatus").textContent = String(current.statusLabel || "")
    .replace(/^MT\s*—\s*/i, "")
    .replace(/^Pack communautaire\s*—\s*/i, "");
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
    engine.textContent = item.engine === "pack" ? "PACK" : "MT";

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
      await api.tabs.sendMessage(tab.id, {
        type: "NK_SET_TARGET",
        target
      });
    }
  } catch {
    // Le content script n'est peut-être pas encore injecté.
  }

  setStatus(`Langue cible : ${next.label}.`);
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

async function loadTarget() {
  try {
    const stored = await api.storage.local.get("nkTarget");
    if (stored?.nkTarget && LANG.getTarget(stored.nkTarget)) {
      target = stored.nkTarget;
    }
  } catch {
    // On garde la valeur par défaut.
  }

  populateLanguages();
  updateLanguageUI();

  try {
    const cloud = await api.storage.local.get("nkCloudFallback");
    $("cloudFallback").checked = cloud?.nkCloudFallback !== false;
  } catch {
    $("cloudFallback").checked = true;
  }

  setStatus("Prêt · détection FR/EN");
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
  try {
    await api.storage.local.set({ nkCloudFallback: enabled });
  } catch {
    // Le réglage reste valable pour la session.
  }
  setStatus(
    enabled
      ? "Cloud autorisé pour les phrases rejetées."
      : "Mode local uniquement."
  );
});

$("translatePage").addEventListener("click", async () => {
  try {
    setStatus(`Traduction en ${displayName(spec())}…`);
    await sendToPage({ type: "NK_TRANSLATE_PAGE", target });
    setStatus("Traduction lancée sur la page.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("restore").addEventListener("click", async () => {
  try {
    await sendToPage({ type: "NK_RESTORE" });
    setStatus("Original restauré.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("translateSelection").addEventListener("click", async () => {
  try {
    setStatus("Traduction de la sélection…");
    await sendToPage({ type: "NK_TRANSLATE_SELECTION", target });
    setStatus("Sélection traduite.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("translateText").addEventListener("click", async () => {
  const text = $("unseen").value.trim();
  const result = $("result");
  const meta = $("resultMeta");

  if (!text) {
    setStatus("Collez d'abord un texte à traduire.");
    return;
  }

  result.textContent = "";
  meta.textContent = "";
  setStatus("Traduction du texte inédit…");

  try {
    const response = await api.runtime.sendMessage({
      type: "NK_TRANSLATE_TEXT",
      target,
      text
    });

    if (response?.error) {
      setStatus(`Erreur : ${response.error}`);
      return;
    }

    const detected = response?.detected;
    const detectedLabel =
      detected?.code === "en"
        ? `anglais (${Math.round((detected.confidence || 0) * 100)} %)`
        : detected?.code === "fr"
          ? `français (${Math.round((detected.confidence || 0) * 100)} %)`
          : "langue indéterminée";

    if (!response?.translation?.ok) {
      if (response?.translation?.reason === "pack_miss") {
        setStatus(
          `Phrase absente du pack ${spec().label}. ` +
            `Ajoutez-la dans data/language-packs/${spec().code}.csv.`
        );
      } else if (response?.translation?.reason === "pack_unverified") {
        setStatus(
          "Cette phrase existe dans le pack mais n'est pas encore validée par un locuteur natif."
        );
      } else {
        setStatus(
          "Traduction refusée par le contrôle de sûreté : montants, noms ou entités non préservés."
        );
      }
      return;
    }

    result.textContent = response.translation.text;
    result.lang = target;
    meta.textContent =
      `Source détectée : ${detectedLabel} · ` +
      `Moteur : ${providerLabel(response.provider)} · ` +
      `Cible : ${spec().label}`;

    if (typeof response.translation.roundtrip === "number") {
      meta.textContent +=
        ` · cohérence ${Math.round(response.translation.roundtrip * 100)} %`;
    }
    setStatus("Texte inédit traduit avec contrôle des montants et des noms.");
  } catch (error) {
    setStatus(`Erreur : ${error.message}`);
  }
});

loadTarget();
