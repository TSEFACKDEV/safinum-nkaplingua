const api = globalThis.browser ?? globalThis.chrome;
const LANG = globalThis.NK_LANGUAGES;

const $ = (id) => document.getElementById(id);

let target = "fub";

function setStatus(message) {
  $("status").textContent = message;
}

function spec() {
  return LANG.getTarget(target) || LANG.getTarget("fub");
}

function providerLabel(provider) {
  if (provider === "pack") return "pack communautaire";
  if (provider === "local") return "backend local NLLB";
  if (provider === "cloud") return "MyMemory (cloud)";
  return "moteur inconnu";
}

function updateLanguageUI() {
  const current = spec();

  $("targetCode").textContent = current.shortLabel;
  const hero = $("heroTitle");
  hero.textContent = "";
  hero.append(
    "Votre page,",
    document.createElement("br"),
    `en ${current.label}.`
  );
  $("targetNote").textContent = `${current.statusLabel} · ${current.region}`;
  $("targetNote").dataset.engine = current.engine;
  $("language").value = current.code;
}

function populateLanguages() {
  const select = $("language");
  select.textContent = "";

  for (const item of LANG.listTargets()) {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent =
      item.engine === "pack"
        ? `${item.label} — pack communautaire`
        : `${item.label} — traduction automatique`;
    select.append(option);
  }

  select.disabled = false;
}

async function getActiveTab() {
  const [tab] = await api.tabs.query({
    active: true,
    currentWindow: true
  });
  return tab;
}

async function ensureContentScript(tabId) {
  try {
    await api.scripting.executeScript({
      target: { tabId },
      files: ["languages.js", "content.js"]
    });
  } catch (error) {
    // L'injection peut échouer sur les pages chrome://, PDF, Web Store, etc.
    throw new Error(
      "Impossible d'injecter le script sur cette page. Utilisez une page web classique."
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
  setStatus(`Prêt. Langue cible : ${spec().label}. Détection FR/EN active.`);
}

$("language").addEventListener("change", async () => {
  const next = $("language").value;
  if (!LANG.getTarget(next)) return;

  target = next;
  updateLanguageUI();

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

  setStatus(
    `Langue cible : ${spec().label}. ${spec().statusLabel}.`
  );
});

$("translatePage").addEventListener("click", async () => {
  try {
    setStatus(`Traduction de la page en ${spec().label}…`);
    await sendToPage({ type: "NK_TRANSLATE_PAGE", target });
    setStatus("Traduction lancée. Le résultat apparaît sur la page.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("restore").addEventListener("click", async () => {
  try {
    await sendToPage({ type: "NK_RESTORE" });
    setStatus("Page restaurée à l'original.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("translateSelection").addEventListener("click", async () => {
  try {
    setStatus("Traduction de la sélection…");
    await sendToPage({ type: "NK_TRANSLATE_SELECTION", target });
    setStatus("Sélection traduite dans une bulle sur la page.");
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
  setStatus("Détection de la langue et traduction du texte inédit…");

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
    setStatus("Texte inédit traduit avec contrôle des montants et des noms.");
  } catch (error) {
    setStatus(`Erreur : ${error.message}`);
  }
});

loadTarget();
