const api = globalThis.browser ?? globalThis.chrome;

const $ = (id) => document.getElementById(id);

const TARGET = "fub";

function setStatus(message) {
  $("status").textContent = message;
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
      files: ["content.js"]
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

$("translatePage").addEventListener("click", async () => {
  try {
    setStatus("Traduction de la page en cours…");
    await sendToPage({ type: "NK_TRANSLATE_PAGE", target: TARGET });
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
    await sendToPage({ type: "NK_TRANSLATE_SELECTION" });
    setStatus("Sélection traduite dans une bulle sur la page.");
  } catch (error) {
    setStatus(error.message);
  }
});

$("translateText").addEventListener("click", async () => {
  const text = $("unseen").value.trim();
  const result = $("result");

  if (!text) {
    setStatus("Collez d'abord un texte à traduire.");
    return;
  }

  result.textContent = "";
  setStatus("Traduction du texte inédit…");

  try {
    const response = await api.runtime.sendMessage({
      type: "NK_TRANSLATE_TEXT",
      target: TARGET,
      text
    });

    if (response?.error) {
      setStatus(`Erreur : ${response.error}`);
      return;
    }

    if (!response?.translation?.ok) {
      setStatus(
        "Traduction refusée par le contrôle de sûreté : montants ou entités non préservés."
      );
      return;
    }

    result.textContent = response.translation.text;
    setStatus("Texte inédit traduit.");
  } catch (error) {
    setStatus(`Erreur : ${error.message}`);
  }
});
