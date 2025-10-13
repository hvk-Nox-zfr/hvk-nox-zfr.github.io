// principal.js (version robuste pour dédicaces)
// Remplace entièrement ton fichier principal.js par ce contenu.

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------
  // Config & utilitaires
  // ------------------------
  const DEBUG = false; // true pour logs détaillés
  function log(...args) { if (DEBUG) console.log("[principal]", ...args); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  const now = () => Date.now();

  // Simple escape HTML for safe insertion
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Clean text: trim and collapse spaces
  function cleanText(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  // ------------------------
  // Menu, popups, audio
  // ------------------------
  const toggleBtn = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");
  if (toggleBtn && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    });
  }

  window.openPopup = id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  };
  window.closePopup = id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  };

  const logo = document.querySelector(".clickable-logo");
  const equalizer = document.querySelector(".equalizer");
  const player = document.getElementById("audioPlayer");
  let isPlaying = false;
  window.togglePlay = () => {
    if (!player || !logo || !equalizer) return;
    if (!isPlaying) {
      player.play();
      equalizer.classList.remove("hidden");
      logo.classList.add("playing");
    } else {
      player.pause();
      equalizer.classList.add("hidden");
      logo.classList.remove("playing");
    }
    isPlaying = !isPlaying;
  };

  // ------------------------
  // GoatCounter session duration
  // ------------------------
  const startTime = now();
  window.addEventListener("beforeunload", () => {
    try {
      const duration = Math.round((now() - startTime) / 1000);
      navigator.sendBeacon && navigator.sendBeacon("https://hugohts.goatcounter.com/count",
        `event=durée&title=Durée de session&duration=${duration}`);
    } catch (e) { /* ignore */ }
  });


  // ------------------------
  // Articles loader
  // ------------------------
  const articlesZone = document.getElementById("articles");
  if (articlesZone && db) {
    db.ref("articles").on("value", snapshot => {
      try {
        const list = snapshot.val() || [];
        articlesZone.innerHTML = "";
        if (Array.isArray(list)) {
          list.forEach(a => { const div = document.createElement("div"); div.innerHTML = a.html || ""; articlesZone.appendChild(div); });
        } else {
          Object.values(list).forEach(a => { const div = document.createElement("div"); div.innerHTML = a.html || ""; articlesZone.appendChild(div); });
        }
      } catch (e) { log("articles error", e); }
    });
  }

  // ------------------------
  // Popup nouveauté
  // ------------------------
  if (!localStorage.getItem("popupSeen")) {
    const popup = document.getElementById("popupNews");
    if (popup) popup.classList.remove("hidden");
    localStorage.setItem("popupSeen", "true");
  }

  // ------------------------
  // Carousel (dégradé si absent)
  // ------------------------
  (function initCarousel() {
    const track = document.querySelector(".carousel-track");
    if (!track) return;
    const items = Array.from(track.children || []);
    const prevBtn = document.querySelector(".carousel-btn.prev");
    const nextBtn = document.querySelector(".carousel-btn.next");
    const dotsContainer = document.querySelector(".carousel-dots");
    if (!items.length || !prevBtn || !nextBtn || !dotsContainer) return;

    let itemWidth = items[0].getBoundingClientRect().width + parseInt(getComputedStyle(items[0]).gap || 16);
    let index = 0;

    // create dots
    dotsContainer.innerHTML = "";
    items.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Aller à ${i + 1}`);
      if (i === 0) dot.classList.add("active");
      dotsContainer.appendChild(dot);
      dot.addEventListener("click", () => goToSlide(i));
    });
    const dots = Array.from(dotsContainer.children);

    function visibleCount() {
      const wrapperWidth = document.querySelector(".carousel-track-wrapper").offsetWidth;
      return Math.max(1, Math.floor(wrapperWidth / itemWidth));
    }

    function updateButtons() {
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index >= items.length - visibleCount();
    }

    function goToSlide(i) {
      index = Math.max(0, Math.min(i, items.length - visibleCount()));
      const moveX = index * itemWidth;
      track.style.transform = `translateX(-${moveX}px)`;
      dots.forEach(d => d.classList.remove("active"));
      if (dots[index]) dots[index].classList.add("active");
      updateButtons();
    }

    prevBtn.addEventListener("click", () => goToSlide(index - 1));
    nextBtn.addEventListener("click", () => goToSlide(index + 1));

    window.addEventListener("resize", () => {
      itemWidth = items[0].getBoundingClientRect().width + parseInt(getComputedStyle(items[0]).gap || 16);
      goToSlide(index);
    });

    document.addEventListener("keydown", e => {
      if (e.key === "ArrowLeft") prevBtn.click();
      if (e.key === "ArrowRight") nextBtn.click();
    });

    goToSlide(0);
  })();

  // ------------------------
  // Debug: show firebase connection state
  // ------------------------
  if (db && typeof firebase !== "undefined" && firebase.database && firebase.database().ref) {
    log("Firebase ready, DB ref available");
  } else {
    log("Firebase not available; dedications realtime features disabled");
  }
});
```
