// Script JavaScript consolidé et corrigé
// Copie-colle ce fichier pour remplacer ton principal.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------------------
  //  Utilitaires
  // ---------------------
  const safeQuery = (sel, root = document) => root.querySelector(sel);
  const safeGet = id => document.getElementById(id);

  // ---------------------
  //  Menu latéral
  // ---------------------
  const toggleBtn = safeGet("menuToggle");
  const sideMenu = safeGet("sideMenu");
  if (toggleBtn && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    });
  }

  // ---------------------
  //  Popups globales
  // ---------------------
  window.openPopup = function (id) {
    const el = safeGet(id);
    if (el) el.classList.remove("hidden");
  };
  window.closePopup = function (id) {
    const el = safeGet(id);
    if (el) el.classList.add("hidden");
  };

  // ---------------------
  //  Animation logo audio
  // ---------------------
  const logo = document.querySelector(".clickable-logo");
  const equalizer = document.querySelector(".equalizer");
  const player = safeGet("audioPlayer");
  let isPlaying = false;

  window.togglePlay = function () {
    if (!player || !logo || !equalizer) return;
    if (!isPlaying) {
      player.play().catch(() => {}); // éviter erreur si autoplay bloqué
      equalizer.classList.remove("hidden");
      logo.classList.add("playing");
      isPlaying = true;
    } else {
      player.pause();
      equalizer.classList.add("hidden");
      logo.classList.remove("playing");
      isPlaying = false;
    }
  };

  // ---------------------
  //  Sondage local (form scoped queries)
  // ---------------------
  const sondageForm = safeGet("sondageForm");
  const sondageFeed = safeGet("sondageFeed");
  if (sondageForm && sondageFeed) {
    sondageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const prenomInput = sondageForm.querySelector('[name="prenom"]') || safeGet("prenom");
      const nomInput = sondageForm.querySelector('[name="nom"]') || safeGet("nom");
      const messageInputLocal = sondageForm.querySelector('[name="message"]') || safeGet("message");

      const prenom = prenomInput?.value?.trim() || "";
      const nom = nomInput?.value?.trim() || "";
      const message = messageInputLocal?.value?.trim() || "";

      if (prenom && nom && message) {
        const entry = document.createElement("div");
        entry.classList.add("entry");
        entry.innerHTML = `<strong>${escapeHtml(prenom)} ${escapeHtml(nom)} :</strong><br>${escapeHtml(message)}`;
        sondageFeed.prepend(entry);
        sondageForm.reset();
      }
    });
  }

  // ---------------------
  //  Session duration tracking
  // ---------------------
  const startTime = Date.now();
  window.addEventListener("beforeunload", () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    // Envoi non‑bloquant et sans throw
    try {
      navigator.sendBeacon?.('https://hugohts.goatcounter.com/count', new URLSearchParams({
        event: 'durée',
        title: 'Durée de session',
        duration: String(duration)
      }));
    } catch (e) {
      // fallback
      fetch('https://hugohts.goatcounter.com/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `event=durée&title=Durée de session&duration=${duration}`
      }).catch(() => {});
    }
  });

  // ---------------------
  //  Firebase initialisation (si firebase chargé)
  // ---------------------
  const firebaseConfig = {
    apiKey: "AIzaSyBiMcAmaOy9g-5Ail2lmj4adxNBNzW4IGk",
    authDomain: "vafm-dedicaces.firebaseapp.com",
    databaseURL: "https://vafm-dedicaces-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vafm-dedicaces",
    storageBucket: "vafm-dedicaces.appspot.com",
    messagingSenderId: "553720861929",
    appId: "1:553720861929:web:87739d3bfa41ed5b50cc78"
  };

  let db = null;
  if (typeof firebase !== "undefined" && firebase && !firebase.apps?.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
    } catch (err) {
      // firebase déjà initialisé ou erreur d'init
      try { db = firebase.database(); } catch (e) { db = null; }
    }
  } else if (typeof firebase !== "undefined") {
    try { db = firebase.database(); } catch (e) { db = null; }
  }

  // ---------------------
  //  Nettoyage dédicaces > 3 jours
  // ---------------------
  function nettoyerDedicaces() {
    if (!db) return;
    const maintenant = Date.now();
    const troisJours = 3 * 24 * 60 * 60 * 1000;
    db.ref("dedicaces").once("value", snapshot => {
      snapshot.forEach(child => {
        const data = child.val();
        if (data?.date) {
          const date = new Date(data.date);
          if (maintenant - date.getTime() > troisJours) {
            db.ref("dedicaces").child(child.key).remove().catch(()=>{});
          }
        }
      });
    });
  }
  nettoyerDedicaces();

  // ---------------------
  //  Dédicace en direct (scoped)
  // ---------------------
  const dedicaceForm = safeGet("dedicaceForm");
  const dedicaceFeed = safeGet("dedicaceFeed");
  const marquee = safeGet("dedicaceMarquee");
  const charCount = safeGet("charCount");
  const file = [];

  // messageInput spécifique au formulaire de dédicace pour éviter conflit d'id "message"
  const messageInputD = dedicaceForm ? (dedicaceForm.querySelector('[name="message"]') || safeGet("message")) : safeGet("message");

  if (messageInputD && charCount) {
    messageInputD.addEventListener("input", () => {
      const maxAttr = messageInputD.getAttribute("maxlength");
      const max = Number.isFinite(Number(maxAttr)) ? Number(maxAttr) : 60;
      const current = messageInputD.value.length;
      charCount.textContent = `${Math.max(0, max - current)} caractères restants`;
    });
  }

  if (dedicaceForm && dedicaceFeed && marquee && db) {
    dedicaceForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nomInput = dedicaceForm.querySelector('[name="nom"]') || safeGet("nom");
      const nom = nomInput?.value?.trim() || "";
      const message = messageInputD?.value?.trim() || "";

      const blacklist = [
        "con", "connard", "connasse", "merde", "putain", "salope", "enculé", "fdp", "ntm", "tg",
        "ta gueule", "nique", "batard", "bâtard", "bite", "couille", "pétasse", "enfoiré", "gros con",
        "fils de", "chier", "débile", "abruti", "crétin", "dégueulasse", "slp", "trou de balle"
      ];

      if (message && blacklist.some(mot => message.toLowerCase().includes(mot))) {
        alert("Ton message contient un mot interdit. Merci de rester respectueux !");
        return;
      }

      const aujourdHui = new Date().toISOString().split("T")[0];
      const derniereDedicace = localStorage.getItem("dedicaceDate");

      if (derniereDedicace === aujourdHui) {
        alert("Tu as déjà envoyé une dédicace aujourd'hui. Reviens demain !");
        return;
      }

      if (nom && message) {
        const date = new Date().toISOString();
        db.ref("dedicaces").push({ nom, message, date }).catch(()=>{});
        dedicaceForm.reset();
        if (charCount) charCount.textContent = "60 caractères restants";
        localStorage.setItem("dedicaceDate", aujourdHui);
      }
    });

    db.ref("dedicaces").on("child_added", (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const div = document.createElement("div");
      div.classList.add("dedicace-entry");
      div.innerHTML = `<strong>${escapeHtml(data.nom)} :</strong> ${escapeHtml(data.message)}`;
      dedicaceFeed.prepend(div);

      file.push(` 🎙️ ${data.nom} : ${data.message} `);
      if (file.length === 1) lancerDefilement();
    });
  }

  function lancerDefilement() {
    if (!marquee || file.length === 0) return;

    marquee.textContent = file.join(" • ");
    marquee.style.transition = "none";
    marquee.style.transform = "translateX(100%)";

    // laisser browser calculer le scrollWidth avant transition
    setTimeout(() => {
      const largeur = marquee.scrollWidth || marquee.offsetWidth || 0;
      const vitesse = 100; // px/s
      const duree = (largeur + marquee.offsetWidth) / vitesse;
      marquee.style.transition = `transform ${duree}s linear`;
      marquee.style.transform = `translateX(-${largeur}px)`;

      // relancer après la durée
      setTimeout(() => {
        // retirer l'élément affiché en tête si tu veux ; ici on boucle
        lancerDefilement();
      }, Math.max(0, duree * 1000));
    }, 50);
  }

  // ---------------------
  //  Chargement des articles
  // ---------------------
  const articlesZone = safeGet("articles");
  if (articlesZone && db) {
    db.ref("articles").on("value", snapshot => {
      const articles = snapshot.val() || [];
      articlesZone.innerHTML = "";
      // si articles est un objet, on itère ses valeurs
      const list = Array.isArray(articles) ? articles : Object.values(articles);
      list.forEach(article => {
        const div = document.createElement("div");
        div.innerHTML = article?.html || "";
        articlesZone.appendChild(div);
      });
    });
  }

  // ---------------------
  //  Popup nouveautés (localStorage)
  // ---------------------
  const alreadySeen = localStorage.getItem("popupSeen");
  if (!alreadySeen) {
    const popup = safeGet("popupNews");
    if (popup) popup.classList.remove("hidden");
    localStorage.setItem("popupSeen", "true");
  }

  // ---------------------
  //  Carousel (robuste)
  // ---------------------
  const track = document.querySelector(".carousel-track");
  const trackWrapper = document.querySelector(".carousel-track-wrapper");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");
  const dotsContainer = document.querySelector(".carousel-dots");

  let items = track ? Array.from(track.children) : [];
  let dots = [];
  let index = 0;
  let itemWidth = 0;

  function computeItemWidth() {
    if (!items.length) return 1;
    const gap = parseInt(getComputedStyle(items[0]).gap || getComputedStyle(items[0]).columnGap || 0) || 16;
    const w = items[0].getBoundingClientRect().width;
    itemWidth = w + gap;
    return itemWidth;
  }

  function visibleCount() {
    if (!trackWrapper) return 1;
    const wrapperWidth = trackWrapper.offsetWidth || window.innerWidth;
    const iw = computeItemWidth() || 1;
    return Math.max(1, Math.floor(wrapperWidth / iw));
  }

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= Math.max(0, items.length - visibleCount());
  }

  function rebuildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    dots = [];
    for (let i = 0; i < items.length; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Aller à ${i + 1}`);
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => goToSlide(i));
      dotsContainer.appendChild(dot);
      dots.push(dot);
    }
  }

  function goToSlide(i) {
    if (!track) return;
    const maxIndex = Math.max(0, items.length - visibleCount());
    index = Math.max(0, Math.min(i, maxIndex));
    const moveX = index * (itemWidth || computeItemWidth());
    track.style.transform = `translateX(-${moveX}px)`;
    dots.forEach(d => d.classList.remove("active"));
    if (dots[index]) dots[index].classList.add("active");
    updateButtons();
  }

  if (track && items.length) {
    computeItemWidth();
    rebuildDots();
    updateButtons();

    prevBtn?.addEventListener("click", () => goToSlide(index - 1));
    nextBtn?.addEventListener("click", () => goToSlide(index + 1));

    // clavier
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevBtn?.click();
      if (e.key === "ArrowRight") nextBtn?.click();
    });

    // resize handler (debounced)
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        items = track ? Array.from(track.children) : [];
        computeItemWidth();
        rebuildDots();
        goToSlide(index);
      }, 150);
    });

    // init
    goToSlide(0);
  }
}); // end DOMContentLoaded

// ---------------------
//  Fonctions utilitaires
// ---------------------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
