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
