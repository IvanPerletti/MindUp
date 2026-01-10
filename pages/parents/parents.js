import { openDB, getDB } from "../../core/db.js";

const PROFILE_ID = "local-1";
const MAX_SESSIONS = 30;

(async function init() {
  await openDB();
  const sessions = await loadSessions(PROFILE_ID);
  renderKpi(sessions);
})();

/* ---------- DB READ ---------- */

async function loadSessions(profileId) {
  const db = getDB();

  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction(["sessions"], "readonly");
    const req = tx.objectStore("sessions").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  return all
    .filter(s => s.profileId === profileId)
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, MAX_SESSIONS);
}

/* ---------- KPI ---------- */

function renderKpi(sessions) {
  const total = sessions.length;

  const avgAccuracy =
    total === 0
      ? 0
      : sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / total;

  const avgResponse =
    total === 0
      ? 0
      : sessions.reduce((a, s) => a + (s.avgResponseTimeMs || 0), 0) / total;

  const errorsByCategory = {};
  for (const s of sessions) {
    const map = s.errorsByCategory || {};
    for (const [cat, val] of Object.entries(map)) {
      errorsByCategory[cat] = (errorsByCategory[cat] || 0) + val;
    }
  }

  document.getElementById("kpi-sessions").textContent = total;
  document.getElementById("kpi-accuracy").textContent =
    Math.round(avgAccuracy * 100) + "%";
  document.getElementById("kpi-response").textContent =
    Math.round(avgResponse) + " ms";

  renderErrors(errorsByCategory);
}

function renderErrors(map) {
  const ul = document.getElementById("kpi-errors");
  ul.innerHTML = "";

  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (entries.length === 0) {
    ul.innerHTML = "<li>Nessun dato disponibile</li>";
    return;
  }

  for (const [cat, count] of entries) {
    const li = document.createElement("li");
    li.textContent = `${cat}: ${count}`;
    ul.appendChild(li);
  }
}
