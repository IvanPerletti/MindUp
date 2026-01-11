import { openDB, getDB } from "./core/db.js";

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

/* ---------- KPI + TREND ---------- */

function computeTrend(recent, previous, higherIsBetter = true) {
  if (!previous) return "flat";

  if (higherIsBetter) {
    if (recent > previous) return "up";
    if (recent < previous) return "down";
  } else {
    if (recent < previous) return "up";
    if (recent > previous) return "down";
  }
  return "flat";
}

function setTrend(id, trend) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  el.className = "trend " + trend;
}

function avg(list, field) {
  if (!list.length) return 0;
  return list.reduce((a, s) => a + (s[field] || 0), 0) / list.length;
}

function renderKpi(sessions) {
  const total = sessions.length;

  const avgAccuracy = avg(sessions, "accuracy");
  const avgResponse = avg(sessions, "avgResponseTimeMs");

  const recent = sessions.slice(0, 10);
  const previous = sessions.slice(10, 20);

  const accRecent = avg(recent, "accuracy");
  const accPrev = avg(previous, "accuracy");

  const rtRecent = avg(recent, "avgResponseTimeMs");
  const rtPrev = avg(previous, "avgResponseTimeMs");

  document.getElementById("kpi-sessions").textContent = total;
  document.getElementById("kpi-accuracy").textContent = Math.round(avgAccuracy * 100) + "%";
  document.getElementById("kpi-response").textContent = Math.round(avgResponse) + " ms";

  setTrend("trend-accuracy", computeTrend(accRecent, accPrev, true));
  setTrend("trend-response", computeTrend(rtRecent, rtPrev, false));

  const errorsByCategory = {};
  for (const s of sessions) {
    const map = s.errorsByCategory || {};
    for (const [cat, val] of Object.entries(map)) {
      errorsByCategory[cat] = (errorsByCategory[cat] || 0) + val;
    }
  }

  renderErrors(errorsByCategory);
  renderAccuracyBars(sessions);
}

/* ---------- ERRORS ---------- */

function renderErrors(map) {
  const ul = document.getElementById("kpi-errors");
  ul.innerHTML = "";

  const entries = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (!entries.length) {
    ul.innerHTML = "<li>Nessun dato disponibile</li>";
    return;
  }

  for (const [cat, count] of entries) {
    const li = document.createElement("li");
    li.textContent = `${cat}: ${count}`;
    ul.appendChild(li);
  }
}

/* ---------- BAR CHART ---------- */

function renderAccuracyBars(sessions) {
  const el = document.getElementById("accuracy-bars");
  if (!el) return;

  el.innerHTML = "";

  const last = sessions.slice(0, 20).reverse();

  last.forEach(s => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = Math.round((s.accuracy || 0) * 100) + "%";
    el.appendChild(bar);
  });
}
