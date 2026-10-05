(() => {
  "use strict";

  const BASE_BOARD_WIDTH = 900;
  const board = document.getElementById("board");
  const boardContainer = document.getElementById("board-container");
  const hotspotLayer = document.getElementById("hotspot-layer");
  const textLayer = document.getElementById("text-layer");
  const circleLayer = document.getElementById("circle-layer");
  const overlay = document.getElementById("overlay");
  const popupTitle = document.getElementById("popup-title");
  const popupRule = document.getElementById("popup-rule");
  const errorBox = document.getElementById("error");
  const svgNS = "http://www.w3.org/2000/svg";
  let boardData = null;
  let selectedId = null;

  function updateSelection() {
    for (const element of boardContainer.querySelectorAll("[data-hotspot-id]")) {
      const selected = element.dataset.hotspotId === selectedId;
      element.classList.toggle("selected", selected);
      element.setAttribute("aria-pressed", String(selected));
    }
  }

  const pct = (value, fallback = "50%") => {
    if (typeof value === "number") return `${value}%`;
    if (typeof value !== "string") return fallback;
    return value.endsWith("%") ? value : `${value}%`;
  };

  function showPopup(hotspot) {
    selectedId = hotspot.id;
    updateSelection();
    popupTitle.textContent = hotspot.name || "";
    popupRule.textContent = hotspot.rule || "";
    overlay.hidden = false;
  }

  function hidePopup() { overlay.hidden = true; }
  overlay.addEventListener("click", hidePopup);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") hidePopup(); });

  function render() {
    if (!boardData) return;
    hotspotLayer.replaceChildren();
    textLayer.replaceChildren();
    circleLayer.replaceChildren();

    const width = board.getBoundingClientRect().width || BASE_BOARD_WIDTH;
    const scale = width / BASE_BOARD_WIDTH;

    for (const hotspot of boardData.hotspots || []) {
      if ((hotspot.shape || "circle") === "poly") {
        const vertices = Array.isArray(hotspot.vertices) ? hotspot.vertices : [];
        if (vertices.length < 3) continue;
        const polygon = document.createElementNS(svgNS, "polygon");
        polygon.setAttribute("points", vertices.map(v => `${parseFloat(v.x)},${parseFloat(v.y)}`).join(" "));
        polygon.setAttribute("class", "poly");
        polygon.dataset.hotspotId = hotspot.id;
        polygon.setAttribute("tabindex", "0");
        polygon.setAttribute("role", "button");
        polygon.setAttribute("aria-label", hotspot.name || "Darts mező");
        polygon.addEventListener("click", () => showPopup(hotspot));
        polygon.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showPopup(hotspot); } });
        hotspotLayer.appendChild(polygon);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "circle-hotspot";
        button.dataset.hotspotId = hotspot.id;
        button.style.width = button.style.height = `${40 * scale}px`;
        button.style.left = pct(hotspot.x);
        button.style.top = pct(hotspot.y);
        button.setAttribute("aria-label", hotspot.name || "Darts mező");
        button.addEventListener("click", () => showPopup(hotspot));
        circleLayer.appendChild(button);
      }
    }

    for (const item of boardData.texts || []) {
      const el = document.createElement("div");
      el.className = "text-item";
      el.textContent = item.text || "";
      el.style.left = pct(item.x);
      el.style.top = pct(item.y);
      el.style.transform = `translate(-50%,-50%) rotate(${Number(item.rotation) || 0}deg)`;
      el.style.fontSize = `${(Number(item.fontSize) || 22) * scale}px`;
      el.style.color = item.color || "#fff";
      el.style.textAlign = item.align || "center";
      el.style.fontFamily = item.fontFamily || "Arial";
      el.style.fontWeight = item.bold ? "bold" : "normal";
      el.style.fontStyle = item.italic ? "italic" : "normal";
      el.style.textDecoration = item.underline ? "underline" : "none";
      textLayer.appendChild(el);
    }
    updateSelection();
  }

  async function init() {
    try {
      const response = await fetch("board.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`board.json betöltési hiba (${response.status})`);
      boardData = await response.json();
      render();
      if (document.fonts?.ready) document.fonts.ready.then(render);
    } catch (error) {
      console.error(error);
      errorBox.textContent = "A játéktábla adatai nem tölthetők be. GitHub Pagesen vagy helyi webszerveren nyisd meg az oldalt.";
      errorBox.hidden = false;
    }
  }

  board.addEventListener("load", render);
  window.addEventListener("resize", render);
  init();
})();
