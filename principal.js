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
function normalizeForRegex(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // retire accents
}

function hasBlacklistedWord(text) {
  const norm = normalizeForRegex(text);
  if (!norm) return false;
  // construit une regex du type: \b(con|merde|putain)\b
  const pattern = '\\b(' + blacklist.map(w => w.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')).join('|') + ')\\b';
  const re = new RegExp(pattern, 'i');
  return re.test(norm);
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
  // Firebase init
  // ------------------------
  const firebaseConfig = {
    apiKey: "AIzaSyBiMcAmaOy9g-5Ail2lmj4adxNBNzW4IGk",
    authDomain: "vafm-dedicaces.firebaseapp.com",
    databaseURL: "https://vafm-dedicaces-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vafm-dedicaces",
    storageBucket: "vafm-dedicaces.appspot.com",
    messagingSenderId: "553720861929",
    appId: "1:553720861929:web:87739d3bfa41ed5b50cc78"
  };
  if (window.firebase && !firebase.apps.length) {
    try { firebase.initializeApp(firebaseConfig); } catch (e) { log("Firebase init error", e); }
  }
  const db = window.firebase ? firebase.database() : null;

  // ------------------------
  // Dédicaces : configuration de modération et règles
  // ------------------------
  // Si moderationEnabled = true -> les dédicaces vont dans 'dedicaces_pending'
  // et doivent être approuvées manuellement pour apparaître dans 'dedicaces'.
  const moderationEnabled = false; // passe à true si tu veux modération manuelle

  const MAX_MESSAGE_CHARS = 60;
  const MAX_NOM_CHARS = 20;
  const DAILY_LIMIT_LOCAL = true; // bloque par localStorage une dédicace par jour
  const RATE_LIMIT_MS = 30 * 1000; // intervalle min entre deux envois depuis même navigateur (ms)
  const MIN_MESSAGE_LENGTH = 3;

  // blacklist simple (étendre si nécessaire)
  const blacklist = [
    "con", "connard", "connasse", "merde", "putain", "salope", "enculé",
    "fdp", "ntm", "tg", "ta gueule", "nique", "batard", "bâtard", "bite",
    "couille", "pétasse", "enfoiré", "gros con", "fils de", "chier", "débile",
    "abruti", "crétin", "dégueulasse", "trou de balle"
  ];

  // détection URL / email / mentions
  function containsUrlOrEmail(s) {
    return /(https?:\/\/|www\.)/i.test(s) || /[\w.+-]+@[\w-]+\.[\w.-]+/.test(s);
  }

  function isSpamPattern(s) {
    if (/^(.)\1{6,}$/.test(s)) return true; // same char repeated 7+
    if (/([^\s])\1{6,}/.test(s)) return true; // char repeats inside
    if (s.length > 20 && /([A-Za-z])\1{4,}/.test(s)) return true; // letter spam
    if (s.split(" ").length > 12) return true; // too many words
    return false;
  }

  function hasBlacklistedWord(s) {
    const t = s.toLowerCase();
    return blacklist.some(w => t.includes(w));
  }

  function validateDedicace(nomRaw, msgRaw) {
    const nom = cleanText(nomRaw || "");
    const message = cleanText(msgRaw || "");

    if (!nom || !message) return { ok: false, reason: "Nom et message requis." };
    if (nom.length > MAX_NOM_CHARS) return { ok: false, reason: `Pseudo trop long (${MAX_NOM_CHARS} max).` };
    if (message.length < MIN_MESSAGE_LENGTH) return { ok: false, reason: "Message trop court." };
    if (message.length > MAX_MESSAGE_CHARS) return { ok: false, reason: `Message trop long (${MAX_MESSAGE_CHARS} max).` };
    if (containsUrlOrEmail(nom) || containsUrlOrEmail(message)) return { ok: false, reason: "Les liens et adresses ne sont pas autorisés." };
    if (hasBlacklistedWord(nom) || hasBlacklistedWord(message)) return { ok: false, reason: "Mot interdit détecté." };
    if (isSpamPattern(message)) return { ok: false, reason: "Message spam détecté." };

    // safe fallback trimming
    return { ok: true, nom, message };
  }

  // ------------------------
  // Nettoyage automatique des vieilles dédicaces (3 jours)
  // ------------------------
  function nettoyerDedicaces() {
    if (!db) return;
    const maintenant = now();
    const troisJours = 3 * 24 * 60 * 60 * 1000;
    db.ref("dedicaces").once("value").then(snapshot => {
      snapshot.forEach(child => {
        const d = child.val();
        if (d && typeof d.date === "number" && maintenant - d.date > troisJours) {
          db.ref("dedicaces").child(child.key).remove().catch(e => log("remove error", e));
        }
      });
    }).catch(e => log("nettoyage error", e));
  }
  nettoyerDedicaces();

  // ------------------------
  // Gestion UI Dédicaces
  // ------------------------
  const dedicaceForm = document.getElementById("dedicaceForm");
  const dedicaceFeed = document.getElementById("dedicaceFeed");
  const marquee = document.getElementById("dedicaceMarquee");
  const msgInput = document.getElementById("message");
  const nomInput = document.getElementById("nom");
  const charCountEl = document.getElementById("charCount");
  const marqueePool = [];

  if (msgInput && charCountEl) {
    msgInput.setAttribute("maxlength", MAX_MESSAGE_CHARS);
    charCountEl.textContent = `${MAX_MESSAGE_CHARS} caractères restants`;
    msgInput.addEventListener("input", () => {
      const remaining = Math.max(0, MAX_MESSAGE_CHARS - msgInput.value.length);
      charCountEl.textContent = `${remaining} caractères restants`;
    });
  }

  function showLocalDedicace(obj) {
    if (!dedicaceFeed) return;
    const div = document.createElement("div");
    div.className = "dedicace-entry";
    div.innerHTML = `<strong>${escapeHtml(obj.nom)} :</strong> ${escapeHtml(obj.message)}`;
    dedicaceFeed.prepend(div);
  }

  // push helper: writes either to pending or directly to dedicaces based on moderationEnabled
  function pushDedicaceToFirebase(payload) {
    if (!db) return Promise.reject(new Error("Firebase non initialisé"));
    const refPath = moderationEnabled ? "dedicaces_pending" : "dedicaces";
    return db.ref(refPath).push(payload);
  }

  // Rate limit local check
  function canSendNowLocal() {
    try {
      const lastTs = parseInt(localStorage.getItem("lastDedicaceTs") || "0", 10);
      return now() - lastTs > RATE_LIMIT_MS;
    } catch (e) { return false; }
  }
  function recordSendLocal() {
    try { localStorage.setItem("lastDedicaceTs", String(now())); } catch (e) { /* ignore */ }
  }

  if (dedicaceForm && dedicaceFeed) {
    dedicaceForm.addEventListener("submit", e => {
      e.preventDefault();
      const nomVal = nomInput ? nomInput.value : "";
      const msgVal = msgInput ? msgInput.value : "";

      // Validation
      const v = validateDedicace(nomVal, msgVal);
      if (!v.ok) {
        alert(v.reason);
        return;
      }

      // daily local limit (one per day) + short rate limit
      const today = new Date().toISOString().split("T")[0];
      const lastDate = localStorage.getItem("dedicaceDate");
      if (DAILY_LIMIT_LOCAL && lastDate === today) {
        alert("Tu as déjà envoyé une dédicace aujourd'hui. Reviens demain !");
        return;
      }
      if (!canSendNowLocal()) {
        alert("Veuillez attendre un peu avant d'envoyer une autre dédicace.");
        return;
      }

      // Payload and server push
      const payload = { nom: v.nom, message: v.message, date: now() };

      // optimistic UI: show but mark as pending if moderationActive
      if (moderationEnabled) {
        showLocalDedicace({ nom: `${v.nom} (en attente)`, message: v.message });
      } else {
        showLocalDedicace(payload);
      }

      pushDedicaceToFirebase(payload)
        .then(() => {
          recordSendLocal();
          localStorage.setItem("dedicaceDate", today);
          if (dedicaceForm) dedicaceForm.reset();
          if (charCountEl) charCountEl.textContent = `${MAX_MESSAGE_CHARS} caractères restants`;
        })
        .catch(err => {
          console.error("Erreur push dedicace", err);
          alert("Problème d'envoi, réessaie plus tard.");
        });
    });

    // Real-time listener: listens to approved dedications only
    if (db) {
      db.ref("dedicaces").on("child_added", snapshot => {
        try {
          const data = snapshot.val();
          if (!data || !data.nom || !data.message) return;
          showLocalDedicace(data);

          // add to marquee pool
          marqueePool.push(` 🎙️ ${data.nom} : ${data.message} `);
          if (marqueePool.length === 1) startMarquee();
        } catch (e) { log("child_added error", e); }
      });
    }
  }

  // ------------------------
  // Marquee (défilement)
  // ------------------------
  let marqueeAnimating = false;
  function startMarquee() {
    if (!marquee || marqueeAnimating || marqueePool.length === 0) return;
    marqueeAnimating = true;
    marquee.textContent = marqueePool.join(" • ");
    marquee.style.transition = "none";
    marquee.style.transform = "translateX(100%)";
    // allow layout
    setTimeout(() => {
      const width = marquee.scrollWidth;
      const speed = 100; // px/sec
      const duration = (width + marquee.offsetWidth) / speed;
      marquee.style.transition = `transform ${duration}s linear`;
      marquee.style.transform = `translateX(-${width}px)`;
      setTimeout(() => {
        marqueeAnimating = false;
        // restart if still content
        if (marqueePool.length > 0) startMarquee();
      }, duration * 1000 + 100);
    }, 60);
  }

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
