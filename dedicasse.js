(function initDedicaces() {
  // Évite double initialisation si ce script est inclus plusieurs fois
  const firebaseConfig = {
    apiKey: "AIzaSyBiMcAmaOy9g-5Ail2lmj4adxNBNzW4IGk",
    authDomain: "vafm-dedicaces.firebaseapp.com",
    databaseURL: "https://vafm-dedicaces-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vafm-dedicaces",
    storageBucket: "vafm-dedicaces.appspot.com",
    messagingSenderId: "553720861929",
    appId: "1:553720861929:web:87739d3bfa41ed5b50cc78",
    measurementId: "G-QNVR8XET7E"
  };
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.database();

  const form = document.getElementById('dedicaceForm');
  const feed = document.getElementById('dedicaceFeed');
  const marquee = document.getElementById('dedicaceMarquee');
  const msgInput = document.getElementById('message');
  const nomInput = document.getElementById('nom');
  const emailInput = document.getElementById('email'); // optionnel si présent dans ton HTML
  const charCount = document.getElementById('charCount');

  // File pour le défilement
  const file = [];
  // Ensemble des clés déjà affichées pour éviter les doublons
  const affichées = new Set();
  // Anti double clic
  let isSending = false;

  if (!form || !feed || !marquee || !msgInput || !nomInput) return;

  // Compteur de caractères
  msgInput.addEventListener('input', () => {
    const max = parseInt(msgInput.getAttribute('maxlength') || '60', 10);
    const rem = Math.max(0, max - msgInput.value.length);
    charCount.textContent = rem + ' caractères restants';
  });

  // Échappement simple
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Affichage d'une dédicace validée (par clé Firebase pour le de-dup)
  function displayDedicace(key, obj) {
    if (affichées.has(key)) return;
    affichées.add(key);

    const div = document.createElement('div');
    div.className = 'dedicace-entry';
    div.innerHTML = `<strong>${escapeHtml(obj.nom)} :</strong> ${escapeHtml(obj.message)}`;
    feed.prepend(div);

    file.push(` 🎙️ ${obj.nom} : ${obj.message} `);
    if (file.length === 1 && typeof lancerDefilement === 'function') {
      lancerDefilement();
    }
  }

  // Lecture initiale : affiche uniquement les "accepted"
  db.ref('dedicaces').orderByChild('date').limitToLast(200).once('value')
    .then(snap => {
      const items = [];
      snap.forEach(child => {
        const d = child.val();
        const k = child.key;
        if (d && d.nom && d.message && d.status === "accepted") {
          items.push({ key: k, data: d });
        }
      });
      // On veut du plus récent au plus ancien
      items.reverse().forEach(({ key, data }) => displayDedicace(key, data));
    })
    .catch(err => console.warn('Erreur lecture initiale dedicaces:', err));

  // Écoute des nouveaux ajouts (on n’affiche que les "accepted")
  db.ref('dedicaces').orderByChild('date').limitToLast(50).on('child_added', snap => {
    const d = snap.val();
    const k = snap.key;
    if (!d || !d.nom || !d.message) return;
    if (d.status === "accepted") displayDedicace(k, d);
  });

  // Écoute des changements de statut : quand une dédicace passe de "pending" à "accepted", on l’affiche
  db.ref('dedicaces').on('child_changed', snap => {
    const d = snap.val();
    const k = snap.key;
    if (!d || !d.nom || !d.message) return;
    if (d.status === "accepted") displayDedicace(k, d);
  });

  // Envoi : stocke en "pending" (et empêche les doubles envois)
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (isSending) return;
    isSending = true;

    const nom = nomInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : ""; // optionnel
    const message = msgInput.value.trim();

    if (!nom || !message) {
      alert('Nom et message requis.');
      isSending = false;
      return;
    }

    // Blacklist courte
    const blacklist = ["con","connard","merde","putain","salope","enculé","fdp","tg","nique","bite","couille"];
    if (blacklist.some(m => message.toLowerCase().includes(m))) {
      alert('Ton message contient un mot interdit. Merci de rester respectueux !');
      isSending = false;
      return;
    }

    // Limite d’une dédicace par jour (locale)
    const today = new Date().toISOString().split('T')[0];
    const last = localStorage.getItem('dedicaceDate');
    if (last === today) {
      alert("Tu as déjà envoyé une dédicace aujourd'hui.");
      isSending = false;
      return;
    }

    const payload = {
      nom,
      email,                  // stocké si présent
      message,
      date: Date.now(),
      status: "pending"
    };

    db.ref('dedicaces').push(payload, err => {
      isSending = false;
      if (err) {
        console.error('Erreur push dedicace', err);
        alert('Erreur lors de l\'envoi. Réessaie plus tard.');
      } else {
        form.reset();
        charCount.textContent = '60 caractères restants';
        localStorage.setItem('dedicaceDate', today);
        alert("Ta dédicace a été envoyée et attend validation !");
      }
    });
  });
})();
