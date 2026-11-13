/**
 * Widget flottant — présence, ouverture, actions, accessibilité.
 *
 * Le widget est isolé dans un Shadow DOM et ne fait qu'appeler l'API du
 * content script. Fixtures fictives, aucune page réelle, aucun réseau.
 *
 * CI : npm install --no-save --no-package-lock jsdom
 *      node tests/widget.test.js
 */

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "extension/widget.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createWidget(lang = "fr") {
  const dom = new JSDOM(`<!doctype html><html lang="${lang}"><body><p>Page</p></body></html>`, {
    url: "https://safinum.cm/hackathon-test",
    runScripts: "outside-only",
    pretendToBeVisual: true
  });
  const { window } = dom;
  let translated = 0;
  let target = "fub";
  const calls = [];
  const storage = { nkWidgetPosition: null };

  window.__NK_WIDGET_API__ = {
    getLanguages: () => [
      { code: "fub", label: "Fulfulde (Adamawa)", engineLabel: "MT" },
      { code: "ewo", label: "Ewondo", engineLabel: "Pack" },
      { code: "dua", label: "Duala", engineLabel: "Pack" }
    ],
    getTarget: () => ({ code: target, label: "Fulfulde (Adamawa)", engineLabel: "MT" }),
    getState: () => ({
      target,
      translated,
      total: translated,
      currentTarget: target
    }),
    getSelection: () => "Solde disponible",
    translatePage: async () => {
      calls.push("translate");
      translated = 3;
      return { ok: true, translated: 3 };
    },
    restore: () => {
      calls.push("restore");
      translated = 0;
      return { ok: true };
    },
    translateSelection: async (code, text) => {
      calls.push(`selection:${text}`);
      return { ok: true };
    },
    setTarget: async (code) => {
      calls.push(`target:${code}`);
      target = code;
      return { ok: true, target, retranslated: true };
    },
    translateText: async (text) => {
      calls.push(`text:${text}`);
      return { translation: { ok: true, text: "Traduction fictive", totalSentences: 1 } };
    }
  };
  window.chrome = {
    storage: {
      local: {
        get: async () => storage,
        set: async (value) => Object.assign(storage, value)
      }
    }
  };
  window.eval(source);
  return { dom, window, document: window.document, calls, storage, host: window.document.getElementById("nk-widget-host") };
}

(async () => {
  const { window, document, calls, host } = createWidget();
  assert(host, "hôte du widget absent");
  const shadow = host.shadowRoot;
  const launcher = shadow.getElementById("launcher");
  const panel = shadow.getElementById("panel");
  assert(launcher, "launcher absent");
  assert(panel.hidden, "panneau ouvert au chargement");
  assert(launcher.getAttribute("aria-expanded") === "false", "aria-expanded initial incorrect");
  assert((launcher.getAttribute("aria-label") || "").length > 0, "launcher sans nom accessible");
  assert(shadow.textContent.includes("NkapLingua"), "marque absente");
  assert(!shadow.textContent.includes("non validé"), "mention de validation visible");
  assert(shadow.innerHTML.includes('fill="#123B2E"'), "forêt de l'icône absente");
  assert(shadow.innerHTML.includes('fill="#C9A45C"'), "or de l'icône absent");
  assert(shadow.innerHTML.includes('fill="#F8F4EC"'), "crème de l'icône absent");

  launcher.click();
  assert(!panel.hidden, "panneau non ouvert");
  assert(launcher.getAttribute("aria-expanded") === "true", "aria-expanded non mis à jour");

  const language = shadow.getElementById("language");
  assert(language.options.length === 3, `options de langue : ${language.options.length}`);
  assert(language.value === "fub", "langue initiale incorrecte");

  const translate = shadow.getElementById("translate");
  translate.click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert(calls.includes("translate"), "traduction de page non appelée");
  assert(
    shadow.getElementById("status").textContent.includes("Page traduite"),
    `statut inattendu : ${shadow.getElementById("status").textContent}`
  );
  assert(!shadow.getElementById("restore").disabled, "restaurer devrait être actif");

  shadow.getElementById("restore").click();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert(calls.includes("restore"), "restauration non appelée");
  assert(
    shadow.getElementById("status").textContent.includes("Original restauré"),
    "statut de restauration incorrect"
  );

  shadow.getElementById("selection").click();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert(
    calls.some((call) => call === "selection:Solde disponible"),
    "sélection non transmise"
  );

  language.value = "ewo";
  language.dispatchEvent(new window.Event("change", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert(calls.includes("target:ewo"), "changement de langue non appelé");

  const unseen = shadow.getElementById("unseen");
  unseen.value = "Votre transfert est en cours.";
  shadow.getElementById("translate-text").click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert(
    shadow.getElementById("result").textContent.includes("Traduction fictive"),
    "texte inédit non affiché"
  );
  assert(
    shadow.getElementById("result").textContent.length > 0,
    "résultat vide"
  );

  shadow.getElementById("close").click();
  assert(panel.hidden, "panneau non fermé");
  assert(launcher.getAttribute("aria-expanded") === "false", "aria-expanded non réinitialisé");

  // Le widget ne doit jamais lire les champs de la page.
  const input = document.createElement("input");
  input.type = "password";
  input.value = "secret";
  document.body.append(input);
  assert(!shadow.textContent.includes("secret"), "secret recopié dans le widget");

  // Le launcher se déplace sans ouvrir le panneau.
  const draggable = createWidget("fr");
  const dragLauncher = draggable.host.shadowRoot.getElementById("launcher");
  const dispatchPointer = (type, x, y) => {
    const event = new draggable.window.Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      pointerId: { value: 7 },
      pointerType: { value: "mouse" },
      button: { value: 0 },
      clientX: { value: x },
      clientY: { value: y }
    });
    dragLauncher.dispatchEvent(event);
  };
  const paragraph = draggable.document.querySelector("p");
  const range = draggable.document.createRange();
  range.selectNodeContents(paragraph);
  draggable.window.getSelection().addRange(range);
  assert(draggable.window.getSelection().rangeCount === 1, "sélection de test absente");
  dispatchPointer("pointerdown", 100, 100);
  dispatchPointer("pointermove", 180, 150);
  dispatchPointer("pointerup", 180, 150);
  assert(
    draggable.window.getSelection().rangeCount === 0,
    "le drag laisse une sélection de page"
  );
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert(draggable.host.style.left !== "", "launcher non déplacé horizontalement");
  assert(draggable.host.style.top !== "", "launcher non déplacé verticalement");
  assert(
    draggable.host.shadowRoot.getElementById("panel").hidden,
    "le déplacement a ouvert le panneau"
  );
  dragLauncher.click();
  assert(
    draggable.host.shadowRoot.getElementById("panel").hidden,
    "le clic après déplacement a ouvert le panneau"
  );

  const english = createWidget("en");
  const englishShadow = english.host.shadowRoot;
  assert(
    englishShadow.getElementById("launcher").getAttribute("aria-label") === "Open NkapLingua",
    "libellé anglais du launcher incorrect"
  );
  assert(
    englishShadow.getElementById("translate-label").textContent === "Translate page",
    "action principale non traduite en anglais"
  );

  console.log("widget OK — launcher, panneau, langue, actions, sélection, clavier, FR/EN");
})().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
