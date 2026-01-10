function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    correct: parseInt(p.get("correct") || "0", 10),
    wrong: parseInt(p.get("wrong") || "0", 10),
    unknown: parseInt(p.get("unknown") || "0", 10),
    total: parseInt(p.get("total") || "0", 10)
  };
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderStars(count) {
  const starsEl = document.getElementById("stars");
  starsEl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const s = document.createElement("span");
    s.textContent = i < count ? "★" : "☆";
    starsEl.appendChild(s);
  }
}

function goHome() {
  window.location.href = "/index.html";
}

(function initResult() {
  const { correct, wrong, unknown, total } = getParams();

  const percent =
    total === 0 ? 0 : Math.round((correct / total) * 100);

  document.getElementById("correctCount").textContent = correct;
  document.getElementById("totalCount").textContent = total;
  document.getElementById("wrongCount").textContent = wrong;
  document.getElementById("unknownCount").textContent = unknown;

  const group = RESULT_MESSAGES.find(
    g => percent >= g.min && percent <= g.max
  ) || RESULT_MESSAGES[0];

  document.getElementById("resultTitle").textContent =
    pickRandom(group.titles);

  document.getElementById("resultSubtitle").textContent =
    pickRandom(group.subtitles);

  renderStars(group.stars);
})();
