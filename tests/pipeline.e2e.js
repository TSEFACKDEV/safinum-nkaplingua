/**
 * Pipeline e2e — M9.
 *
 * Modes :
 *   --mode=pack   : mémoire de traduction validée, zéro réseau, latence.
 *   --mode=edge   : jetons, références, pack miss, entrée vide, texte long.
 *   --mode=all    : pack + edge (défaut CI).
 *   --mode=unseen : bloqué sans modèle NLLB.
 *   --mode=demo   : bloqué sans pack 102/102.
 *
 * Les résultats sont écrits dans docs/test-results/pipeline-<mode>.json.
 * Fixtures fictives ; fetch simulé ; aucun appel réseau réel.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const languagesSource = read("extension/languages.js");
const backgroundSource = read("extension/background.js");
const resultsDir = path.join(root, "docs", "test-results");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function createBackground(storage = {}) {
  const calls = [];
  let listener = null;
  const chrome = {
    runtime: {
      onInstalled: { addListener() {} },
      onMessage: { addListener(fn) { listener = fn; } },
      getURL: (pack) => `chrome-extension://test/${pack}`
    },
    contextMenus: {
      removeAll: () => Promise.resolve(),
      create: () => Promise.resolve(),
      onClicked: { addListener() {} }
    },
    tabs: {
      sendMessage: () => Promise.resolve(),
      query: () => Promise.resolve([])
    },
    scripting: { executeScript: () => Promise.resolve() },
    storage: { local: { get: async () => storage, set: async () => {} } }
  };

  globalThis.browser = undefined;
  globalThis.chrome = chrome;
  globalThis.__NK_PACK_OVERRIDES__ = {};
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return { ok: false, json: async () => ({}) };
  };

  eval(languagesSource);
  eval(backgroundSource);

  const send = (message) => new Promise((resolve) => listener(message, {}, resolve));
  return { send, calls, overrides: globalThis.__NK_PACK_OVERRIDES__ };
}

function writeResult(name, payload) {
  fs.mkdirSync(resultsDir, { recursive: true });
  const file = path.join(resultsDir, `pipeline-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return file;
}

const EWO_PACK = {
  entries: [
    {
      source: "Votre solde est disponible.",
      target: "Nde nje woni.",
      status: "validated"
    },
    {
      source: "Le bénéficiaire [[NAME_0]] reçoit [[NUM_0]] FCFA.",
      target: "Nafoore [[NAME_0]] ina heɓa [[NUM_0]] FCFA.",
      status: "validated"
    },
    {
      source: "Opération [[NAME_0]].",
      target: "Nde [[NAME_0]].",
      status: "validated"
    },
    {
      source: "La ligne [[NUM_0]] est disponible.",
      target: "Nde disponible.",
      status: "validated"
    },
    {
      source: "Le total [[NUM_0]] FCFA.",
      target: "Nde FCFA.",
      status: "validated"
    }
  ]
};

async function runPack() {
  const background = createBackground({});
  background.overrides.dua = JSON.parse(JSON.stringify(EWO_PACK));

  const started = process.hrtime.bigint();
  const response = await background.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "dua",
    source: "fr",
    segments: [
      { id: "p0", text: "Votre solde est disponible." },
      { id: "p1", text: "Le bénéficiaire Aïcha reçoit 25 000 FCFA." },
      { id: "p2", text: "Opération SAF-2026-AB12CD." }
    ]
  });
  const latencyMs = Number(process.hrtime.bigint() - started) / 1e6;

  assert(response.provider === "pack", `provider ${response.provider}`);
  const byId = new Map((response.translations || []).map((item) => [item.id, item]));
  assert(byId.get("p0")?.ok === true, "p0 refusé");
  assert(byId.get("p0").text === "Nde nje woni.", "p0 cible inattendue");
  assert(byId.get("p1")?.ok === true, "p1 refusé");
  assert(byId.get("p1").text.includes("Aïcha"), "nom non restauré");
  assert(byId.get("p1").text.includes("25 000 FCFA"), "montant non restauré");
  assert(byId.get("p2")?.ok === true, "p2 refusé");
  assert(byId.get("p2").text.includes("SAF-2026-AB12CD"), "référence non restaurée");
  assert(background.calls.length === 0, `réseau : ${background.calls.join(", ")}`);
  assert(latencyMs < 50, `latence pack ${latencyMs.toFixed(2)} ms > 50 ms`);

  return {
    mode: "pack",
    status: "pass",
    cases: 3,
    latencyMs: Number(latencyMs.toFixed(2)),
    networkCalls: background.calls.length,
    provider: response.provider
  };
}

async function runEdge() {
  const background = createBackground({});
  background.overrides.dua = JSON.parse(JSON.stringify(EWO_PACK));
  const longText = "Le solde et les frais de cette opération doivent rester lisibles. ".repeat(6);

  const response = await background.send({
    type: "NK_TRANSLATE_SEGMENTS",
    target: "dua",
    source: "fr",
    segments: [
      { id: "e0", text: "Phrase inconnue du pack." },
      { id: "e1", text: "" },
      { id: "e2", text: longText },
      { id: "e3", text: "La ligne 1 000 est disponible." }
    ]
  });
  const byId = new Map((response.translations || []).map((item) => [item.id, item]));

  assert(byId.get("e0")?.ok === false, "pack miss accepté");
  assert(byId.get("e0").reason === "pack_miss", `raison ${byId.get("e0").reason}`);
  assert(byId.get("e1") !== undefined, "entrée vide perdue");
  assert(byId.get("e2")?.ok === false, "texte long accepté sans pack");
  assert(byId.get("e3")?.ok === false, "jeton perdu accepté");
  assert(
    byId.get("e3").reason?.startsWith("token_lost"),
    `raison jeton ${byId.get("e3").reason}`
  );
  assert(background.calls.length === 0, "réseau sur edge");

  return {
    mode: "edge",
    status: "pass",
    cases: 4,
    networkCalls: background.calls.length,
    details: { packMiss: true, empty: true, long: true, tokenLost: true }
  };
}

function runBlocked(mode) {
  const reasons = {
    unseen: "Modèle NLLB non téléchargé : pipeline réel non exécutable ici.",
    demo: "Pack 102/102 absent : couverture démo non mesurable."
  };
  return { mode, status: "blocked", reason: reasons[mode] };
}

async function main() {
  const argument = process.argv.find((value) => value.startsWith("--mode="));
  const mode = argument ? argument.split("=")[1] : "all";
  const results = [];

  if (mode === "pack" || mode === "all") results.push(await runPack());
  if (mode === "edge" || mode === "all") results.push(await runEdge());
  if (mode === "unseen" || mode === "demo") results.push(runBlocked(mode));

  for (const result of results) {
    const file = writeResult(result.mode, result);
    console.log(
      `${result.mode}: ${result.status}` +
        (result.latencyMs !== undefined ? ` (${result.latencyMs} ms)` : "") +
        ` → ${path.relative(root, file)}`
    );
  }

  const failed = results.filter((result) => result.status === "fail");
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error("FAIL", error.message);
  process.exit(1);
});
