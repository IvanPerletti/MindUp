/* =========================
   RIFERIMENTI DOM
========================= */

const definitions = document.getElementById("definitions");
const words = document.getElementById("words");
const connectionsLayer = document.getElementById("connections-layer");
const verifyBtn = document.getElementById("verifyBtn");
const reloadBtn = document.getElementById("reloadBtn");

/* =========================
   STATO GLOBALE
========================= */

let data = [];

let state = {
  links: {},        // leftId -> rightId
  linkColors: {},   // leftId -> rgb()
  activeLeft: null,
  verified: false
};

/* =========================
   BUILD ESERCIZIO
========================= */

function buildExercise() {
  state = {
    links: {},
    linkColors: {},
    activeLeft: null,
    verified: false
  };

  clearUI();
  clearConnections();

  const sample = shuffle([...data]).slice(0, 5);

  const leftItems = sample.map(item => ({
    id: item.id,
    text: randomOne(item.definitions)
  }));

  const rightItems = shuffle(
    sample.map(item => ({
      id: item.id,
      text: item.word
    }))
  );

  renderList(definitions, leftItems, "left");
  renderList(words, rightItems, "right");
}

/* =========================
   RENDERING LISTE
========================= */

function renderList(container, items, side) {
  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "item";
    el.textContent = item.text;
    el.dataset.id = item.id;
    el.dataset.side = side;
    el.addEventListener("click", () => onSelect(el));
    container.appendChild(el);
  });
}

/* =========================
   SELEZIONE / COLLEGAMENTO
========================= */

function onSelect(el) {
  if (state.verified) return;

  const side = el.dataset.side;
  const id = el.dataset.id;

  // tap su definizione
  if (side === "left") {
    clearSelection("left");
    el.classList.add("selected");
    state.activeLeft = id;
    return;
  }

  // tap su nome → crea collegamento
  if (side === "right" && state.activeLeft) {
    state.links[state.activeLeft] = id;

    if (!state.linkColors[state.activeLeft]) {
      state.linkColors[state.activeLeft] = randomVisibleColor();
    }

    state.activeLeft = null;
    clearSelection("left");
    drawConnections();
  }
}

/* =========================
   VERIFICA
========================= */

function verify() {
  state.verified = true;

  document.querySelectorAll('.item[data-side="right"]').forEach(el => {
    const rightId = el.dataset.id;
    const ok = Object.entries(state.links)
      .some(([leftId, linkedRight]) =>
        leftId === rightId && linkedRight === rightId
      );

    el.classList.add(ok ? "correct" : "wrong");
  });
}

/* =========================
   SVG CONNECTIONS
========================= */

function drawConnections() {
  connectionsLayer.innerHTML = "";

  Object.entries(state.links).forEach(([leftId, rightId]) => {
    const leftEl = document.querySelector(
      `.item[data-side="left"][data-id="${leftId}"]`
    );
    const rightEl = document.querySelector(
      `.item[data-side="right"][data-id="${rightId}"]`
    );
    if (!leftEl || !rightEl) return;

    const p1 = getRightCenter(leftEl);
    const p2 = getLeftCenter(rightEl);
    const dx = (p2.x - p1.x) * 0.5;

    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    path.setAttribute(
      "d",
      `M ${p1.x} ${p1.y}
       C ${p1.x + dx} ${p1.y},
         ${p2.x - dx} ${p2.y},
         ${p2.x} ${p2.y}`
    );

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", state.linkColors[leftId]);
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");

    connectionsLayer.appendChild(path);
  });
}

function clearConnections() {
  connectionsLayer.innerHTML = "";
}

function getRightCenter(el) {
  const r = el.getBoundingClientRect();
  const s = connectionsLayer.getBoundingClientRect();
  return { x: r.right - s.left, y: r.top + r.height / 2 - s.top };
}

function getLeftCenter(el) {
  const r = el.getBoundingClientRect();
  const s = connectionsLayer.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top + r.height / 2 - s.top };
}

/* =========================
   UTILITY
========================= */

function randomVisibleColor() {
  const rnd = () => 64 + Math.floor(Math.random() * 129);
  return `rgb(${rnd()}, ${rnd()}, ${rnd()})`;
}

function clearUI() {
  definitions.innerHTML = "";
  words.innerHTML = "";
}

function clearSelection(side) {
  document
    .querySelectorAll(`.item[data-side="${side}"]`)
    .forEach(el => el.classList.remove("selected"));
}

const shuffle = arr => arr.sort(() => Math.random() - 0.5);
const randomOne = arr => arr[Math.floor(Math.random() * arr.length)];

/* =========================
   EVENTI GLOBALI
========================= */

verifyBtn.addEventListener("click", verify);
reloadBtn.addEventListener("click", () => loadJSON());
window.addEventListener("resize", drawConnections);
