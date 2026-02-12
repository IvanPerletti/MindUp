let topicData = null;
let currentExercise = null;

const sceneState = {
  verified: false,
  hintLevel: {},
  items: []
};

document.addEventListener("DOMContentLoaded", bootstrap);

async function bootstrap() {

  const params = new URLSearchParams(window.location.search);
  const topicId = params.get("topic");

  if (!topicId) return;

  const res = await fetch(`../../data/exercises/${topicId}.json`);
  if (!res.ok) return;

  topicData = await res.json();

  if (!Array.isArray(topicData.sceneSpelling) || topicData.sceneSpelling.length === 0)
    return;

  currentExercise = topicData.sceneSpelling[0];

  bindStaticEvents();
  initSceneSpelling(currentExercise);
}


function bindStaticEvents() {

  document.getElementById("verifyBtn")
    .addEventListener("click", verifyScene);

  document.getElementById("nextBtn")
    .addEventListener("click", goNext);

  // Delegation per hint
  document.getElementById("sceneList")
    .addEventListener("click", handleSceneListClick);
}

function initSceneSpelling(exercise) {

  document.getElementById("exerciseTitle").textContent =
    exercise.title || "Osserva e scrivi";

  document.getElementById("sceneImage").src = exercise.asset;

  sceneState.items = [...exercise.items].sort((a,b)=>a.num-b.num);
  sceneState.hintLevel = {};
  sceneState.verified = false;

  const list = document.getElementById("sceneList");
  list.innerHTML = "";

  sceneState.items.forEach(item => {

    sceneState.hintLevel[item.num] = 0;

    const row = document.createElement("div");
    row.className = "scene-row";

    row.innerHTML = `
      <div class="scene-num">${item.num}</div>
      <input 
        type="text" 
        class="scene-input" 
        data-num="${item.num}"
        autocomplete="off"
      />
      <button class="hint-btn" data-num="${item.num}" type="button">?</button>
      <span class="solution-text" id="sol-${item.num}" style="display:none;"></span>
    `;

    list.appendChild(row);
  });

  document.getElementById("verifyBtn").disabled = false;
  document.getElementById("nextBtn").disabled = true;
}
function handleSceneListClick(e) {

  const hintBtn = e.target.closest(".hint-btn");
  if (!hintBtn || sceneState.verified) return;

  const num = hintBtn.dataset.num;
  const item = sceneState.items.find(i => i.num == num);
  const input = document.querySelector(`.scene-input[data-num="${num}"]`);

  let level = sceneState.hintLevel[num];

  if (level === 0) {
    input.placeholder = hintDashes(item.answer);
    sceneState.hintLevel[num] = 1;
  } 
  else if (level === 1) {
    input.placeholder = hintEdges(item.answer);
    sceneState.hintLevel[num] = 2;
  }
}
function verifyScene() {

  if (sceneState.verified) return;

  let correct = 0;
  let wrong = 0;
  let unknown = 0;

  sceneState.items.forEach(item => {

    const input = document.querySelector(`.scene-input[data-num="${item.num}"]`);
    const solutionEl = document.getElementById(`sol-${item.num}`);

    const userValue = normalize(input.value);
    const correctValue = normalize(item.answer);

    input.disabled = true;

    if (!userValue) {
      unknown++;
      input.classList.add("wrong");
      showSolution(solutionEl, item.answer);
    }
    else if (userValue === correctValue) {
      correct++;
      input.classList.add("correct");
    }
    else {
      wrong++;
      input.classList.add("wrong");
      showSolution(solutionEl, item.answer);
    }

  });

  sceneState.verified = true;

  document.getElementById("verifyBtn").disabled = true;
  document.getElementById("nextBtn").disabled = false;

  // Qui integri SessionTracker
}
function goNext() {

  if (!topicData) return;

  const list = topicData.sceneSpelling;
  const index = list.indexOf(currentExercise);

  const nextIndex = (index + 1) % list.length;
  currentExercise = list[nextIndex];

  initSceneSpelling(currentExercise);
}
function showSolution(el, text) {
  el.textContent = text;
  el.style.display = "inline";
}

function normalize(str) {
  return str.trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hintDashes(answer) {
  return answer.split(" ")
    .map(w => "-".repeat(w.length))
    .join(" ");
}

function hintEdges(answer) {
  return answer.split(" ")
    .map(w => {
      if (w.length <= 2) return w;
      return w[0] + "-".repeat(w.length - 2) + w[w.length - 1];
    })
    .join(" ");
}
