document.addEventListener("DOMContentLoaded", function () {
  const playBtn = document.getElementById("playBtn");
  const audio = document.getElementById("miniAudio");
  const trackEl = document.getElementById("currentTrack");
  const playIcon = playBtn.querySelector('.icon-play');
  const pauseIcon = playBtn.querySelector('.icon-pause');
  const METADATA_URL = "https://manager10.streamradio.fr:1555/status-json.xsl";

  async function togglePlay(){
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch(e){
      console.error("Erreur lecture :", e);
    }
  }

  function updatePlayUI(){
    if (!audio.paused) {
      playBtn.classList.add('playing');
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
      playBtn.setAttribute('aria-pressed','true');
    } else {
      playBtn.classList.remove('playing');
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      playBtn.setAttribute('aria-pressed','false');
    }
  }

  playBtn.addEventListener('click', togglePlay);
  audio.addEventListener('play', updatePlayUI);
  audio.addEventListener('pause', updatePlayUI);
  audio.addEventListener('ended', updatePlayUI);

  async function fetchCurrentTrack(){
    try {
      const res = await fetch(METADATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      let title = null;
      if (data.icestats) {
        const src = data.icestats.source;
        if (Array.isArray(src)) title = src[0] && (src[0].title || src[0].server_description);
        else if (src && typeof src === 'object') title = src.title || src.server_description;
      }
      if (!title && data.name) title = data.name;
      trackEl.textContent = title || "VAFM — En direct";
    } catch(err){
      console.error("Erreur meta :", err);
      trackEl.textContent = "Titre indisponible";
    }
  }

  fetchCurrentTrack();
  setInterval(fetchCurrentTrack,15000);

  // déplacer le lecteur dans body si besoin (évite ancêtre transform/overflow)
  (function ensureInBody(){
    const zone = document.querySelector('.mini-player-zone');
    if (zone && zone.parentElement !== document.body) document.body.appendChild(zone);
  })();

  // état initial
  updatePlayUI();
});

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
  
function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[^a-z0-9_\-\s]/g, ' ')                 // garde lettres, chiffres, _, -, espaces
    .replace(/\s+/g, ' ')
    .trim();
}

function hasBlacklistedWord(text) {
  const clean = normalizeText(text);
  if (!clean) return false;
  const words = new Set(clean.split(' '));
  return blacklist.some(b => words.has(b));
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
// ---------- PSEUDO VALIDATION & UTIL ----------
const PSEUDO_MIN = 3;
const PSEUDO_MAX = 20;

// autorise: lettres, chiffres, espaces simples, -, _
const PSEUDO_ALLOWED_RE = /^[A-Za-z0-9 _-]+$/;
const EMOJI_RE = /[\p{Emoji}\u200D]/u; // tentative de détection d'emoji (ES2018+)
const REPEATED_CHAR_RE = /(.)\1{6,}/; // 7+ times same char

function cleanPseudo(s) {
  let t = String(s || "").trim();
  // collapse multiple spaces into one
  t = t.replace(/\s+/g, " ");
  // remove leading/trailing non-printable
  t = t.replace(/^\s+|\s+$/g, "");
  // capitaliser la première lettre (optionnel)
  if (t.length) t = t.charAt(0).toUpperCase() + t.slice(1);
  return t;
}

function isPseudoFormatValid(pseudo) {
  if (!pseudo) return { ok: false, reason: "Pseudo vide" };
  if (pseudo.length < PSEUDO_MIN) return { ok: false, reason: `Pseudo trop court (${PSEUDO_MIN} caractères min)` };
  if (pseudo.length > PSEUDO_MAX) return { ok: false, reason: `Pseudo trop long (${PSEUDO_MAX} caractères max)` };
  if (EMOJI_RE.test(pseudo)) return { ok: false, reason: "Les emoji ne sont pas autorisés dans le pseudo" };
  if (!PSEUDO_ALLOWED_RE.test(pseudo)) return { ok: false, reason: "Caractères autorisés : lettres, chiffres, espace, - et _" };
  if (REPEATED_CHAR_RE.test(pseudo)) return { ok: false, reason: "Pseudo contenant répétitions suspectes" };
  if (containsUrlOrEmail(pseudo)) return { ok: false, reason: "Les liens et emails ne sont pas autorisés dans le pseudo" };
  if (hasBlacklistedWord(pseudo)) return { ok: false, reason: "Pseudo contenant mot interdit" };
  return { ok: true };
}

// Vérifie soft-uniqueness dans la DB : retourne Promise<boolean>
// true = existe déjà
function pseudoExistsInDb(pseudo) {
  if (!db) return Promise.resolve(false);
  // normalize for check: lowercase and trim
  const key = pseudo.toLowerCase();
  return db.ref("dedicaces").orderByChild("nom_lower").equalTo(key).limitToFirst(1).once("value")
    .then(snap => !!snap.exists())
    .catch(() => false);
}

// Si tu n'as pas d'index nom_lower, on peut scanner (moins optimal):
// return db.ref("dedicaces").once("value").then(snap => { ... })

// ---------- Mise à jour push helper pour inclure nom_lower ----------
function pushDedicaceToFirebase(payload) {
  if (!db) return Promise.reject(new Error("Firebase non initialisé"));
  // add a lowercase index for easier checks (and set DB rules accordingly)
  payload.nom_lower = payload.nom.toLowerCase();
  const refPath = moderationEnabled ? "dedicaces_pending" : "dedicaces";
  return db.ref(refPath).push(payload);
}

// ---------- Exemple d'utilisation dans ton handler existant ----------
// Remplace la portion de submission où tu fais validateDedicace par ce bloc asynchrone

dedicaceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nomRaw = nomInput ? nomInput.value : "";
  const msgRaw = msgInput ? msgInput.value : "";

  const nomClean = cleanPseudo(nomRaw);
  const vMsg = validateDedicace(null, msgRaw); // adapte ta fonction validateDedicace pour accepter null nom
  if (!vMsg.ok) { alert(vMsg.reason); return; }

  const vPseudo = isPseudoFormatValid(nomClean);
  if (!vPseudo.ok) { alert(vPseudo.reason); return; }

  // check uniqueness soft
  const exists = await pseudoExistsInDb(nomClean);
  if (exists) {
    alert("Ce pseudo est déjà utilisé. Merci d'en choisir un autre ou d'ajouter un chiffre.");
    return;
  }

  // ready to push
  const payload = { nom: nomClean, message: vMsg.message || vMsg.msg || vMsg.message, date: Date.now() };
  pushDedicaceToFirebase(payload)
    .then(() => {
      // succès UI
      localStorage.setItem("dedicaceDate", new Date().toISOString().split("T")[0]);
      dedicaceForm.reset();
      if (charCountEl) charCountEl.textContent = `${MAX_MESSAGE_CHARS} caractères restants`;
      showLocalDedicace(payload);
    })
    .catch(err => { console.error(err); alert("Erreur lors de l'envoi."); });
});
