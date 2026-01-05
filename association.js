/* =========================
   JSON INLINE (DEBUG MODE)
   ========================= */

const INLINE_DATA = {
  type: "association",
  items: [
    {
      id: "w1",
      word: "Fotosintesi",
      definitions: [
        "Processo con cui le piante producono energia",
        "Meccanismo che usa luce e clorofilla",
        "Trasformazione di CO₂ in zuccheri"
      ],
      categoryId: 1
    },
    {
      id: "w2",
      word: "Evaporazione",
      definitions: [
        "Passaggio da liquido a vapore",
        "Cambiamento di stato dell'acqua"
      ],
      categoryId: 1
    },
    {
      id: "w3",
      word: "Radice",
      definitions: [
        "Parte della pianta che assorbe acqua",
        "Organo sotterraneo della pianta"
      ],
      categoryId: 1
    }
  ]
};




const MAX_ITEMS = 7;
let data = [];
let state = {
  links: {},
  activeLeft: null,
  verified: false
};

async function loadJSON_server() {
  const res = await fetch("file:\\C:\Users\SPARK\Desktop\Boost School\LINK_DESCRIPTION\data.json");
  const json = await res.json();
  data = json.items;
  buildExercise();
}

function loadJSON() {
  console.log("INLINE DATA LOADED", INLINE_DATA);
  data = INLINE_DATA.items;
  buildExercise();
}

function buildExercise() {
  state = { links: {}, activeLeft: null, verified: false };
  clearUI();

  const sample = shuffle([...data]).slice(0, MAX_ITEMS);

  const leftItems = sample.map(item => ({
    id: item.id,
    text: randomOne(item.definitions)
  }));

  const rightItems = shuffle(sample.map(item => ({
    id: item.id,
    text: item.word
  })));

  renderList("definitions", leftItems, "left");
  renderList("words", rightItems, "right");
}

function renderList(containerId, items, side) {
  const el = document.getElementById(containerId);
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = item.text;
    div.dataset.id = item.id;
    div.dataset.side = side;
    div.addEventListener("pointerdown", () => onSelect(div));
    el.appendChild(div);
  });
}

function onSelect(el) {
  if (state.verified) return;

  const side = el.dataset.side;
  const id = el.dataset.id;

  if (side === "left") {
    clearSelection("left");
    el.classList.add("selected");
    state.activeLeft = id;
  } else if (side === "right" && state.activeLeft) {
    state.links[state.activeLeft] = id;
    clearSelection("left");
    state.activeLeft = null;
  }
}

function verify() {
  state.verified = true;
  document.querySelectorAll(".item").forEach(el => {
    if (el.dataset.side === "right") {
      const correct = Object.entries(state.links)
        .some(([l, r]) => r === el.dataset.id && l === el.dataset.id);
      el.classList.add(correct ? "correct" : "wrong");
    }
  });
}

function clearSelection(side) {
  document.querySelectorAll(`.item[data-side="${side}"]`)
    .forEach(el => el.classList.remove("selected"));
}

function clearUI() {
  document.getElementById("definitions").innerHTML = "";
  document.getElementById("words").innerHTML = "";
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function randomOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

document.getElementById("verify").onclick = verify;
document.getElementById("reload").onclick = buildExercise;

loadJSON();
