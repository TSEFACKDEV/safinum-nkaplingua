/**
 * NkapLingua — copies du popup en français et en anglais.
 * La langue est choisie d'après la langue déclarée par le site actif.
 */
(function (global) {
  "use strict";

  const STRINGS = {
    fr: {
      source: "Source",
      target: "Cible",
      heroTitle: "Traduire cette page",
      heroSub: "Sans modifier le site. Montants et noms protégés.",
      translatePage: "Traduire la page",
      restore: "Restaurer",
      translateSelection: "Traduire la sélection",
      ready: "Prêt à traduire cette page.",
      testTitle: "Tester un texte",
      testHint: "inédit",
      testPlaceholder: "Collez un message financier jamais vu…",
      testLabel: "Texte financier à traduire",
      languagesAvailable: "Langues disponibles",
      translateText: "Traduire ce texte",
      privacy: "Confidentialité",
      privacyP1:
        "Le backend local est prioritaire. MyMemory n’est utilisé que si vous l’autorisez explicitement ci-dessous : dans ce cas, montants, URLs, emails et noms de bénéficiaires sont remplacés par des jetons. Aucun mot de passe, code PIN, OTP ou valeur de formulaire n’est lu. Pour un usage réel, lancer le backend NLLB local.",
      privacyP2:
        "Les packs communautaires contiennent des traductions en cours de révision (fulfulde, ewondo, duala). En mode démo SAFINUM, elles sont appliquées avec une mention « démonstration ». Le duala ne contacte aucun service cloud.",
      cloudToggle: "Autoriser MyMemory (expérimental, opt-in)",
      local: "Local · pseudonymisé",
      cloudActive: "Cloud MyMemory · pseudonymisé",
      drafts: "démonstration",
      packMt: "Pack + MT",
      pack: "Pack",
      mt: "MT",
      working: "Traduction en cours…",
      alreadyTranslating: "Une traduction est déjà en cours.",
      nothingToRestore: "Aucune traduction à restaurer.",
      translating: "Traduction en {lang}…",
      translationDone: "Traduction terminée.",
      restoring: "Restauration de l'original…",
      restored: "Original restauré.",
      selecting: "Traduction de la sélection…",
      selectionDone: "Sélection traduite.",
      french: "français",
      english: "anglais",
      unknownLanguage: "langue indéterminée",
      providerPack: "pack communautaire",
      providerLocal: "backend local",
      providerCloud: "MyMemory (cloud)",
      providerFlagship: "flagship-ai (démo)",
      providerMixed: "pack humain + MT (démo)",
      providerHybrid: "MyMemory + flagship-ai (démo)",
      providerMock: "mode maquette",
      providerUnknown: "moteur inconnu",
      testSuccess: "Texte inédit traduit avec contrôle des montants et des noms.",
      noSelection: "Sélectionnez d'abord du texte.",
      noNewText: "Aucun nouveau texte à traduire.",
      noTranslation: "Aucune phrase n'a pu être traduite. Le texte original est conservé.",
      actionError: "Action impossible sur cette page.",
      testFailed: "Le texte n'a pas pu être traduit. Vérifiez le message sous le champ.",
      testEmpty: "Collez d'abord un texte à traduire.",
      cloudOn: "Cloud MyMemory activé : les textes peuvent quitter cet appareil.",
      cloudOff: "Mode local uniquement.",
      pageTranslated: "Page traduite en {lang} · {n} passage(s)",
      remaining: "{n} resté(s) en français",
      truncated: "page longue, 180 passages maximum",
      result: "{n} passage(s) traduit(s)",
      partials: "{n} partiel(s)",
      elementsUnverified: "{n} élément(s) de démonstration",
      demoAlerts: "{n} alerte(s) de démonstration",
      languageChanged: "Langue cible : {lang}.",
      languageRetranslating: "Langue cible : {lang}. Retraduction de la page…",
      packMiss: "Cette phrase n'est pas encore disponible en {lang}. Elle reste en français.",
      packUnverified: "Cette phrase n'est pas encore vérifiée. Elle reste en français.",
      critical: "Cette phrase touche à l'argent ou à la sécurité. Elle reste en français pour éviter une erreur.",
      lowRoundtrip: "Le contrôle de cohérence a refusé cette traduction. Le texte original est conservé.",
      tokenLost: "Un montant, un nom ou une référence aurait changé. Le texte original est conservé.",
      tooShort: "La traduction est trop courte, trop longue ou répétitive. Le texte original est conservé.",
      dntMissing: "Un terme critique (FCFA, PIN, OTP…) aurait changé. Le texte original est conservé.",
      wrongLanguage: "La traduction n'est pas dans la langue choisie. Le texte original est conservé.",
      refused: "La traduction a été refusée par sécurité. Le texte original est conservé.",
      unknownError: "Une erreur est survenue.",
      sourceDetected: "Source détectée",
      engine: "Moteur",
      targetLabel: "Cible"
    },
    en: {
      source: "Source",
      target: "Target",
      heroTitle: "Translate this page",
      heroSub: "Without changing the site. Amounts and names protected.",
      translatePage: "Translate page",
      restore: "Restore",
      translateSelection: "Translate selection",
      ready: "Ready to translate this page.",
      testTitle: "Test a text",
      testHint: "unseen",
      testPlaceholder: "Paste a financial message never seen before…",
      testLabel: "Financial text to translate",
      languagesAvailable: "Available languages",
      translateText: "Translate this text",
      privacy: "Privacy",
      privacyP1:
        "The local backend is preferred. MyMemory is used only if you explicitly allow it below: amounts, URLs, emails and beneficiary names are then replaced with tokens. No password, PIN, OTP or form value is read. For real use, run the local NLLB backend.",
      privacyP2:
        "Community packs contain translations still under review (Fulfulde, Ewondo, Duala). In SAFINUM demo mode, they are applied with a “demo” label. Duala never contacts a cloud service.",
      cloudToggle: "Allow MyMemory (experimental, opt-in)",
      local: "Local · pseudonymized",
      cloudActive: "MyMemory cloud · pseudonymized",
      drafts: "demo version",
      packMt: "Pack + MT",
      pack: "Pack",
      mt: "MT",
      working: "Translation in progress…",
      alreadyTranslating: "A translation is already in progress.",
      nothingToRestore: "No translation to restore.",
      translating: "Translating to {lang}…",
      translationDone: "Translation finished.",
      restoring: "Restoring the original…",
      restored: "Original restored.",
      selecting: "Translating the selection…",
      selectionDone: "Selection translated.",
      french: "French",
      english: "English",
      unknownLanguage: "unknown language",
      providerPack: "community pack",
      providerLocal: "local backend",
      providerCloud: "MyMemory (cloud)",
      providerFlagship: "flagship-ai (demo)",
      providerMixed: "human pack + MT (demo)",
      providerHybrid: "MyMemory + flagship-ai (demo)",
      providerMock: "mock mode",
      providerUnknown: "unknown engine",
      testSuccess: "Unseen text translated with amount and name checks.",
      noSelection: "Select some text first.",
      noNewText: "No new text to translate.",
      noTranslation: "No phrase could be translated. The original text is kept.",
      actionError: "This action is not possible on this page.",
      testFailed: "The text could not be translated. Check the message below the field.",
      testEmpty: "Paste a text to translate first.",
      cloudOn: "MyMemory cloud enabled: text may leave this device.",
      cloudOff: "Local mode only.",
      pageTranslated: "Page translated to {lang} · {n} passage(s)",
      remaining: "{n} left in French",
      truncated: "long page, 180 passages maximum",
      result: "{n} passage(s) translated",
      partials: "{n} partial",
      elementsUnverified: "{n} demo item(s)",
      demoAlerts: "{n} demo alert(s)",
      languageChanged: "Target language: {lang}.",
      languageRetranslating: "Target language: {lang}. Retranslating the page…",
      packMiss: "This sentence is not available in {lang} yet. It stays in French.",
      packUnverified: "This sentence is not verified yet. It stays in French.",
      critical: "This sentence concerns money or security. It stays in French to avoid an error.",
      lowRoundtrip: "The consistency check refused this translation. The original text is kept.",
      tokenLost: "An amount, name or reference may have changed. The original text is kept.",
      tooShort: "The translation is too short, too long or repetitive. The original text is kept.",
      dntMissing: "A critical term (FCFA, PIN, OTP…) may have changed. The original text is kept.",
      wrongLanguage: "The translation is not in the chosen language. The original text is kept.",
      refused: "The translation was refused for safety. The original text is kept.",
      unknownError: "An error occurred.",
      sourceDetected: "Detected source",
      engine: "Engine",
      targetLabel: "Target"
    }
  };

  let current = "fr";

  function format(value, vars) {
    return String(value).replace(/\{(\w+)\}/g, (_m, key) =>
      vars && vars[key] != null ? String(vars[key]) : `{${key}}`
    );
  }

  function t(key, vars) {
    return format(STRINGS[current][key] ?? STRINGS.fr[key] ?? key, vars);
  }

  function apply(lang) {
    current = lang === "en" ? "en" : "fr";
    document.documentElement.lang = current;
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const key = node.getAttribute("data-i18n");
      if (STRINGS[current][key]) node.textContent = STRINGS[current][key];
    }
    for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
      const key = node.getAttribute("data-i18n-placeholder");
      if (STRINGS[current][key]) node.placeholder = STRINGS[current][key];
    }
    for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
      const key = node.getAttribute("data-i18n-aria-label");
      if (STRINGS[current][key]) node.setAttribute("aria-label", STRINGS[current][key]);
    }
  }

  global.NK_UI = { apply, t, get lang() { return current; } };
})(globalThis);
