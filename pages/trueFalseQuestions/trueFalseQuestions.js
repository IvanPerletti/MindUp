/* =========================
   TRUE / FALSE – CORE LOGIC
   ========================= */

const state = {
  sessionId: crypto.randomUUID(),
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

async function initTrueFalse() {
  const res = await fetch("trueFalseQuestions.json");
  const json = await res.json();

  state.subject = json.subject || "";
  state.difficulty = json.difficulty || "";
  state.questions = json.trueFalseQuestions || [];

  shuffle(state.questions);
  renderQuestion();
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
    state.errorsByCategory[q.categoryId] =
      (state.errorsByCategory[q.categoryId] || 0) + 1;
  }

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

function endSession() {
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

  console.log("VF SESSION KPI", session);
  // TODO: save to IndexedDB + redirect result.html
}

/* ---------- Boot ---------- */
initTrueFalse();
