/* =========================
   STATO GLOBALE
========================= */

let data = [];
const connectionsLayer = document.getElementById("connections-layer");
let state = {
  links: {},        // leftId -> rightId
  activeLeft: null, // definizione selezionata
  verified: false
};

/* =========================
   BUILD ESERCIZIO
========================= */

function buildExercise() {
  state = { links: {}, activeLeft: null, verified: false };
  clearUI();
  clearConnections();

  const sample = shuffle([...data]).slice(0, 7);

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

  renderList("definitions", leftItems, "left");
  renderList("words", rightItems, "right");
}

/* =========================
   RENDERING LISTE
========================= */

function renderList(containerId, items, side) {
  const container = document.getElementById(containerId);

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

  // TAP SU DEFINIZIONE
  if (side === "left") {
    clearSelection("left");
    el.classList.add("selected");
    state.activeLeft = id;
    return;
  }

  // TAP SU NOME → CREA FRECCIA
  if (side === "right" && state.activeLeft) {
    state.links[state.activeLeft] = id;
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

  document
    .querySelectorAll('.item[data-side="right"]')
    .forEach(el => {
      const rightId = el.dataset.id;
      const ok = Object.entries(state.links)
        .some(([leftId, linkedRight]) => leftId === rightId && linkedRight === rightId);
      el.classList.add(ok ? "correct" : "wrong");
    });
}

/* =========================
   SVG CONNECTIONS
========================= */

function drawConnections() {
  const svg = document.getElementById("connections-layer");
  svg.innerHTML = "";

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
    path.setAttribute("stroke", "#6b85ff");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("stroke-linecap", "round");

    svg.appendChild(path);
  });
}

function clearConnections() {
  const svg = document.getElementById("connections-layer");
  if (svg) svg.innerHTML = "";
}

function getRightCenter(el) {
  const rect = el.getBoundingClientRect();
  const svgRect = connectionsLayer.getBoundingClientRect();

  return {
    x: rect.right - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top
  };
}

function getLeftCenter(el) {
  const rect = el.getBoundingClientRect();
  const svgRect = connectionsLayer.getBoundingClientRect();

  return {
    x: rect.left - svgRect.left,
    y: rect.top + rect.height / 2 - svgRect.top
  };
}

/* =========================
   UTILITY
========================= */

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
