let contentIndex;
const state = {
  animal: null,
  subject: null,
  topic: null
};

fetch("data/content-index.json")
  .then(r => r.json())
  .then(data => {
    contentIndex = data;
    renderAnimals();
  });

/* ---------- RENDER ---------- */

function renderAnimals() {
  const el = document.getElementById("animals");
  el.innerHTML = "<h3>Animale</h3>";

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
  el.innerHTML = "<h3>Materia</h3>";

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
  el.innerHTML = "<h3>Argomento</h3>";

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
  const box = document.getElementById("sessions");
  box.classList.remove("hidden");

  setupSessionButton("association", sessions.association);
  setupSessionButton("quiz", sessions.quiz);
  setupSessionButton("completion", sessions.completion);
}

function setupSessionButton(type, enabled) {
  const btn = document.getElementById(`btn-${type}`);
  btn.disabled = !enabled;
  btn.onclick = enabled
    ? () => startSession(type)
    : null;
}

/* ---------- START ---------- */

function startSession(type) {
  location.href = `../${type}/index.html?topic=${state.topic}`;
}
