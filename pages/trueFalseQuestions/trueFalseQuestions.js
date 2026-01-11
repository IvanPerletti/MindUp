/* =========================
   TRUE / FALSE – CORE LOGIC
   ========================= */
   function debug(msg) {
  const el = document.getElementById("debug");
  if (el) el.textContent += "\n" + msg;
}
debug("JS LOADED");

import { openDB } from "../../core/db.js";
import { SessionTracker } from "../../core/sessionTracker.js";


const state = {
  sessionId: "test-id",
  profileId: "local-1",

  startTime: Date.now(),
  endTime: null,
  lastInteraction: Date.now(),

  subject: "",
  difficulty: "",

  questions: [],
  index: 0,

  correct: 0,
  wrong: 0,
  unknown: 0,

  responseTimes: [],
  inactivityTime: 0,
  errorsByCategory: {}
};

/* ---------- Utils ---------- */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/* ---------- Init ---------- */
async function loadJSON(topic) {
  try {
    const path = `/data/exercises/${topic}.json`;
    debug("FETCH → " + path);

    const res = await fetch(path);
    debug("STATUS → " + res.status);

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const json = await res.json();
    debug("JSON PARSED");

    if (!Array.isArray(json.trueFalseQuestions)) {
      throw new Error("trueFalseQuestions mancante");
    }

    state.subject = json.subject || topic;
    state.difficulty = json.difficulty || "";
    state.questions = json.trueFalseQuestions;

    debug("QUESTIONS → " + state.questions.length);

    shuffle(state.questions);

    SessionTracker.startSession({
      profileId: "local-1",
      subject: state.subject,
      cognitiveArea: "true_false",
      difficulty: state.difficulty
    });

    debug("SESSION STARTED");
    renderQuestion();
    debug("FIRST QUESTION RENDERED");

  } catch (err) {
    debug("❌ loadJSON ERROR → " + err.message);
  }
}


/* ---------- Render ---------- */

function renderQuestion() {
  const q = state.questions[state.index];
  if (!q) return endSession();

  document.getElementById("vf-progress").textContent =
    `${state.index + 1} / ${state.questions.length}`;

  document.getElementById("vf-statement").textContent = q.statement;
  document.getElementById("vf-feedback").textContent = "";

  state.lastInteraction = Date.now();
}

/* ---------- Answer handling ---------- */

function handleAnswer(value) {
  const q = state.questions[state.index];
  const now = Date.now();

  const responseTime = now - state.lastInteraction;
  state.responseTimes.push(responseTime);

  let isCorrect = false;


  if (value === "unknown") {
    state.unknown++;
  } else if (value === q.answer) {
    state.correct++;
    isCorrect = true;
  } else {
    state.wrong++;
    const cat = q.categoryId || "unspecified";
    state.errorsByCategory[cat] =
      (state.errorsByCategory[cat] || 0) + 1;

  }
  SessionTracker.recordAnswer({
    correct: isCorrect,
    responseTimeMs: responseTime,
    errorCategory: isCorrect ? null : (q.categoryId || "unspecified")
  });
  showFeedback(value, isCorrect, q.explanation);

  setTimeout(() => {
    state.index++;
    renderQuestion();
  }, 700);
}

/* ---------- Feedback ---------- */

function showFeedback(response, correct, explanation) {
  const el = document.getElementById("vf-feedback");

  if (response === "unknown") {
    el.textContent = "🤔 " + explanation;
    el.className = "feedback neutral";
    return;
  }

  el.textContent = (correct ? "✔ " : "✖ ") + explanation;
  el.className = "feedback " + (correct ? "success" : "error");
}

/* ---------- CTA binding ---------- */

document
  .getElementById("vf-cta")
  .addEventListener("click", e => {
    const v = e.target.dataset.answer;
    if (!v) return;

    handleAnswer(
      v === "true" ? true :
      v === "false" ? false :
      "unknown"
    );
  });

/* ---------- End session + KPI ---------- */

async function endSession() {
  state.endTime = Date.now();

  const total =
    state.correct + state.wrong + state.unknown;

  const avgResponseTime =
    state.responseTimes.reduce((a, b) => a + b, 0) /
    state.responseTimes.length;

  const variance =
    state.responseTimes.reduce(
      (a, b) => a + Math.pow(b - avgResponseTime, 2),
      0
    ) / state.responseTimes.length;

  const session = {
    sessionId: state.sessionId,
    profileId: state.profileId,
    startTime: state.startTime,
    endTime: state.endTime,
    subject: state.subject,
    difficulty: state.difficulty,
    blocksCompleted: total,
    correct: state.correct,
    total,
    avgResponseTime: Math.round(avgResponseTime),
    responseTimeVariance: Math.round(variance),
    inactivityTime: state.inactivityTime,
    errorsByCategory: state.errorsByCategory
  };

await SessionTracker.endSession();



const correct = state.correct;
const wrong = state.wrong;
const unknown = state.unknown;

const params = new URLSearchParams({
  correct,
  wrong,
  unknown,
  total
});

window.location.href =
  `/pages/results/result.html?${params.toString()}`;
}

/* ---------- Boot ---------- */
(async function init() {
  debug("INIT START");

  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic");

  debug("TOPIC = " + topic);

  if (!topic) {
    debug("❌ topic mancante");
    return;
  }

  try {
    debug("OPEN DB");
    await openDB();
    debug("DB OK");

    await loadJSON(topic);
    debug("LOAD JSON OK");
  } catch (e) {
    debug("❌ INIT ERROR: " + e.message);
  }
})();



