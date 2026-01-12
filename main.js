import { openDB } from "./core/db.js";

let contentIndex = null;
let topicData = null;

const state = {
  animal: null,
  subject: null,
  topic: null
};

// =========================
// BOOTSTRAP
// =========================

async function bootstrap() {
  await openDB();

  const r = await fetch("data/content-index.json");
  contentIndex = await r.json();

  renderAnimals();
}

bootstrap();


// =========================
// RENDER FLOW
// =========================

function renderAnimals() {
  const el = document.getElementById("animals");
  el.innerHTML = "";

  for (const [id, a] of Object.entries(contentIndex.animals)) {
    const btn = document.createElement("button");
    btn.textContent = a.label;

    btn.onclick = () => {
      selectButton("animals", btn);

      state.animal = id;
      state.subject = null;
      state.topic = null;

      hideFrom("subjects-section");
      renderSubjects();
    };

    el.appendChild(btn);
  }
}


function renderSubjects() {
  const el = document.getElementById("subjects");
  el.innerHTML = "";
  show("subjects-section");

  for (const [id, s] of Object.entries(contentIndex.subjects)) {
    const btn = document.createElement("button");
    btn.textContent = s.label;

    btn.onclick = () => {
      selectButton("subjects", btn);

      state.subject = id;
      state.topic = null;

      hideFrom("topics-section");
      renderTopics();
    };

    el.appendChild(btn);
  }
}


function renderTopics() {
  const el = document.getElementById("topics");
  el.innerHTML = "";
  show("topics-section");

  for (const [id, t] of Object.entries(contentIndex.topics)) {
    if (t.animal === state.animal && t.subject === state.subject) {
      const btn = document.createElement("button");
      btn.textContent = t.label;

      btn.onclick = async () => {
        selectButton("topics", btn);

        state.topic = id;
        await loadTopic(id);
        renderCapabilities();
      };

      el.appendChild(btn);
    }
  }
}


// =========================
// TOPIC HANDLING
// =========================

async function loadTopic(topicId) {
  const res = await fetch(`/data/exercises/${topicId}.json`);
  if (!res.ok) throw new Error("Topic JSON not found");
  topicData = await res.json();
}

function renderCapabilities() {
  show("modes-section");

  const meta = document.getElementById("meta-info");
  meta.textContent =
    `${topicData.subject} · difficoltà ${topicData.difficulty}`;

  setupModeButton(
    "association",
    !!topicData.associations,
    "associations"
  );

  setupModeButton(
    "truefalse",
    !!topicData.trueFalseQuestions,
    "trueFalseQuestions"
  );
}

function setupModeButton(id, enabled, page) {
  const btn = document.getElementById(`btn-${id}`);
  btn.disabled = !enabled;

  if (enabled) {
    btn.onclick = () => {
      location.href =
        `/pages/${page}/${page}.html?topic=${state.topic}`;
    };
  } else {
    btn.onclick = null;
  }
}

// =========================
// UI HELPERS
// =========================

function show(id) {
  document.getElementById(id).classList.remove("hidden");
}

function hideFrom(id) {
  const sections = ["subjects-section", "topics-section", "modes-section"];
  const start = sections.indexOf(id);
  for (let i = start; i < sections.length; i++) {
    document.getElementById(sections[i]).classList.add("hidden");
  }
}

// =========================
// SELECTION STATE
// =========================

function selectButton(containerId, btn) {
  const container = document.getElementById(containerId);
  container.querySelectorAll("button").forEach(b => {
    b.classList.remove("is-selected");
    b.classList.add("is-dimmed");
  });

  btn.classList.remove("is-dimmed");
  btn.classList.add("is-selected");
}
