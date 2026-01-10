import { openDB, getDB } from "./core/db.js";

let contentIndex;
const state = {
  animal: null,
  subject: null,
  topic: null
};

// =========================
// BOOTSTRAP (ONE ENTRY POINT)
// =========================

async function bootstrap() {
  // 1) Init IndexedDB once
  await openDB();

  // 2) KPI debug (safe after DB open)
  await loadKpiSnapshot("local-1");

  // 3) Load content index
  const r = await fetch("data/content-index.json");
  contentIndex = await r.json();

  // 4) Render first view
  renderAnimals();
}

bootstrap();

// =========================
// KPI SNAPSHOT (DEBUG)
// =========================

async function loadKpiSnapshot(profileId) {
  const db = getDB();

  const sessions = await new Promise((resolve, reject) => {
    const tx = db.transaction(["sessions"], "readonly");
    const req = tx.objectStore("sessions").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const mine = sessions.filter(s => s.profileId === profileId);

  console.log("KPI DEBUG", {
    totalSessions: mine.length,
    lastSession: mine.sort((a, b) => b.startTime - a.startTime)[0] || null
  });
}

// =========================
// RENDER
// =========================

function renderAnimals() {
  const el = document.getElementById("animals");
  el.innerHTML = "";

  for (const [id, a] of Object.entries(contentIndex.animals)) {
    const btn = document.createElement("button");
    btn.textContent = a.label;
    btn.onclick = () => {
      state.animal = id;
      state.subject = null;
      state.topic = null;
      renderSubjects();
    };
    el.appendChild(btn);
  }
}

function renderSubjects() {
  const el = document.getElementById("subjects");
  el.classList.remove("hidden");
  el.innerHTML = "";

  for (const [id, s] of Object.entries(contentIndex.subjects)) {
    const btn = document.createElement("button");
    btn.textContent = s.label;
    btn.onclick = () => {
      state.subject = id;
      state.topic = null;
      renderTopics();
    };
    el.appendChild(btn);
  }
}

function renderTopics() {
  const el = document.getElementById("topics");
  el.classList.remove("hidden");
  el.innerHTML = "";

  for (const [id, t] of Object.entries(contentIndex.topics)) {
    if (t.animal === state.animal && t.subject === state.subject) {
      const btn = document.createElement("button");
      btn.textContent = t.label;
      btn.onclick = () => {
        state.topic = id;
        renderSessions();
      };
      el.appendChild(btn);
    }
  }
}

function renderSessions() {
  const sessions = contentIndex.topics[state.topic].sessions;

  setupSessionButton("association", sessions.association);
  setupSessionButton("quiz", sessions.quiz);
  setupSessionButton("completion", sessions.completion);
}

function setupSessionButton(type, enabled) {
  const btn = document.getElementById(`btn-${type}`);
  btn.disabled = !enabled;
  btn.onclick = enabled ? () => startSession(type) : null;
}

// =========================
// START SESSION
// =========================

function startSession(type) {
  location.href = `/pages/${type}/index.html?topic=${state.topic}`;
}
