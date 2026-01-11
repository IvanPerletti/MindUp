/* =========================
   ASSOCIATIONS – CORE LOGIC
========================= */

   function debug(msg) {
  const el = document.getElementById("debug");
  if (el) el.textContent += "\n" + msg;
}
debug("JS LOADED");

import { openDB } from "/core/db.js";
import { SessionTracker } from "/core/sessionTracker.js";


/* =========================
   DOM
========================= */

const definitions = document.getElementById("definitions");
const words = document.getElementById("words");
const connectionsLayer = document.getElementById("connections-layer");
const verifyBtn = document.getElementById("verifyBtn");
const reloadBtn = document.getElementById("reloadBtn");

/* =========================
   SESSION STATE
========================= */

const state = {
  sessionId: "test-id",
  profileId: "local-1",

  startTime: Date.now(),
  lastInteraction: Date.now(),

  subject: "",
  difficulty: "",

  steps: 4,
  stepIndex: 0,

  answered: 0,
  correct: 0,
  wrong: 0,
  unknown: 0,
  responseTimes: [],
  errorsByCategory: {}
};

let data = [];

let uiState = {
  links: {},
  colors: {},
  activeLeft: null,
  verified: false
};

/* =========================
   INIT
========================= */

async function loadJSON(topic) {
  try {
    const path = `/data/exercises/${topic}.json`;
    const res = await fetch(path);
    if (!res.ok) throw new Error("JSON non trovato");

    const json = await res.json();

    if (!Array.isArray(json.associations)) {
      throw new Error("associations mancanti");
    }

    state.subject = json.subject || topic;
    state.difficulty = json.difficulty || "";

    data = json.associations;

    await openDB();
    SessionTracker.startSession({
      profileId: state.profileId,
      subject: state.subject,
      cognitiveArea: "associations",
      difficulty: state.difficulty
    });

    buildExercise();

  } catch (e) {
    console.error("Errore associations:", e);
  }
}

/* =========================
   BUILD
========================= */

function buildExercise() {
  uiState = { links: {}, colors: {}, activeLeft: null, verified: false };
  clearUI();
  clearConnections();

  const sample = shuffle([...data]).slice(0, 5);

  renderList(definitions,
    sample.map(i => ({ id: i.id, text: randomOne(i.definitions) })),
    "left"
  );

  renderList(words,
    shuffle(sample.map(i => ({ id: i.id, text: i.word }))),
    "right"
  );

  reloadBtn.disabled = true;
}

/* =========================
   RENDER
========================= */

function renderList(container, items, side) {
  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "item";
    el.textContent = item.text;
    el.dataset.id = item.id;
    el.dataset.side = side;
    el.onclick = () => onSelect(el);
    container.appendChild(el);
  });
}

/* =========================
   INTERACTION
========================= */

function onSelect(el) {
  if (uiState.verified) return;

  state.lastInteraction = Date.now();

  if (el.dataset.side === "left") {
    clearSelection("left");
    uiState.activeLeft = el.dataset.id;
    el.classList.add("selected");
    return;
  }

  if (uiState.activeLeft) {
    uiState.links[uiState.activeLeft] = el.dataset.id;
    uiState.colors[uiState.activeLeft] ||= randomColor();
    uiState.activeLeft = null;
    clearSelection("left");
    drawConnections();
  }
}

/* =========================
   VERIFY
========================= */
function verify() {
  if (uiState.verified) return;
  uiState.verified = true;

  const now = Date.now();
  const responseTime = now - state.lastInteraction;
  state.responseTimes.push(responseTime);

  let stepCorrect = 0;
  let stepWrong = 0;
  let stepUnknown = 0;

  document
    .querySelectorAll('.item[data-side="right"]')
    .forEach(el => {
      const rightId = el.dataset.id;
      const linked = Object.entries(uiState.links)
        .find(([, r]) => r === rightId);

      // ❓ NON RISPOSTA
      if (!linked) {
        stepUnknown++;
        el.classList.add("wrong");

        SessionTracker.recordAnswer({
          correct: false,
          responseTimeMs: responseTime,
          errorCategory: "associations"
        });
        return;
      }

      const [leftId] = linked;
      const ok = leftId === rightId;

      if (ok) {
        stepCorrect++;
        el.classList.add("correct");
      } else {
        stepWrong++;
        el.classList.add("wrong");
        state.errorsByCategory["associations"] =
          (state.errorsByCategory["associations"] || 0) + 1;
      }

      SessionTracker.recordAnswer({
        correct: ok,
        responseTimeMs: responseTime,
        errorCategory: ok ? null : "associations"
      });
    });

  state.correct += stepCorrect;
  state.wrong += stepWrong;
  state.unknown += stepUnknown;
  state.answered += stepCorrect + stepWrong + stepUnknown;

  updateHeader();
  reloadBtn.disabled = false;
}



/* =========================
   FLOW
========================= */

reloadBtn.onclick = () => {
  state.stepIndex++;

  if (state.stepIndex >= state.steps) {
    endSession();
    return;
  }

  document.getElementById("step").textContent = state.stepIndex + 1;
  buildExercise();
};

verifyBtn.onclick = verify;
window.onresize = drawConnections;

/* =========================
   END SESSION
========================= */

async function endSession() {
  const total = state.answered;

  const avgResponseTime =
    state.responseTimes.length
      ? state.responseTimes.reduce((a, b) => a + b, 0) /
        state.responseTimes.length
      : 0;

  await SessionTracker.endSession();

const params = new URLSearchParams({
  correct: state.correct,
  wrong: state.wrong,
  unknown: state.unknown,
  total: state.answered
});

  window.location.href =
    `/pages/results/result.html?${params.toString()}`;
}


/* =========================
   SVG
========================= */

function drawConnections() {
  connectionsLayer.innerHTML = "";
  Object.entries(uiState.links).forEach(([l, r]) => {
    const le = document.querySelector(`.item[data-id="${l}"][data-side="left"]`);
    const re = document.querySelector(`.item[data-id="${r}"][data-side="right"]`);
    if (!le || !re) return;

    const p1 = centerRight(le);
    const p2 = centerLeft(re);
    const dx = (p2.x - p1.x) * 0.5;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d",
      `M ${p1.x} ${p1.y}
       C ${p1.x + dx} ${p1.y},
         ${p2.x - dx} ${p2.y},
         ${p2.x} ${p2.y}`
    );
    path.setAttribute("stroke", uiState.colors[l]);
    path.setAttribute("stroke-width", 4);
    path.setAttribute("fill", "none");
    connectionsLayer.appendChild(path);
  });
}

/* =========================
   UTILS
========================= */

const shuffle = a => [...a].sort(() => Math.random() - 0.5);
const randomOne = a => a[Math.floor(Math.random() * a.length)];
const randomColor = () => `rgb(${80+Math.random()*120},${80+Math.random()*120},${80+Math.random()*120})`;

function clearUI() {
  definitions.innerHTML = "";
  words.innerHTML = "";
}
function clearConnections() {
  connectionsLayer.innerHTML = "";
}
function clearSelection(side) {
  document.querySelectorAll(`.item[data-side="${side}"]`)
    .forEach(e => e.classList.remove("selected"));
}
function centerRight(el) {
  const r = el.getBoundingClientRect();
  const s = connectionsLayer.getBoundingClientRect();
  return { x: r.right - s.left, y: r.top + r.height / 2 - s.top };
}
function centerLeft(el) {
  const r = el.getBoundingClientRect();
  const s = connectionsLayer.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top + r.height / 2 - s.top };
}
function updateHeader() {
  document.getElementById("answered").textContent = state.answered;
  document.getElementById("correct").textContent = state.correct;
  document.getElementById("progressFill").style.width =
    ((state.stepIndex + 1) / state.steps * 100) + "%";
}

/* =========================
   BOOT
========================= */

(async function init() {
  const params = new URLSearchParams(location.search);
  const topic = params.get("topic");

  if (!topic) {
    document.body.innerHTML =
      "<p style='padding:16px'>Errore: argomento mancante</p>";
    return;
  }

  await openDB();
  await loadJSON(topic);
})();

