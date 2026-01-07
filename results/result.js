function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    correct: parseInt(p.get("correct") || "0", 10),
    answered: parseInt(p.get("answered") || "0", 10)
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
	
  window.location.href = "..\index.html";
}

(function initResult() {
  const { correct, answered } = getParams();
  const percent = answered === 0 ? 0 : Math.round((correct / answered) * 100);

  document.getElementById("correctCount").textContent = correct;
  document.getElementById("answeredCount").textContent = answered;

  const group = RESULT_MESSAGES.find(
    g => percent >= g.min && percent <= g.max
  ) || RESULT_MESSAGES[0];

  document.getElementById("resultTitle").textContent = pickRandom(group.titles);
  document.getElementById("resultSubtitle").textContent = pickRandom(group.subtitles);

  renderStars(group.stars);
})();
