(function initDedicaces() {
  const db = firebase.database();

  const form = document.getElementById('dedicaceForm');
  const feed = document.getElementById('dedicaceFeed');
  const marquee = document.getElementById('dedicaceMarquee');
  const msgInput = document.getElementById('message');
  const nomInput = document.getElementById('nom');
  const charCount = document.getElementById('charCount');
  const file = [];
  const affichées = new Set();

  if (!form || !feed || !marquee || !msgInput || !nomInput) return;

  // compteur de caractères
  msgInput.addEventListener('input', () => {
    const max = parseInt(msgInput.getAttribute('maxlength') || '60', 10);
    const rem = Math.max(0, max - msgInput.value.length);
    charCount.textContent = rem + ' caractères restants';
  });

  // échappement simple
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // affichage d'une dédicace validée
  function displayDedicace(obj) {
    const id = `${obj.nom}::${obj.message}`;
    if (affichées.has(id)) return;
    affichées.add(id);

    const div = document.createElement('div');
    div.className = 'dedicace-entry';
    div.innerHTML = `<strong>${escapeHtml(obj.nom)} :</strong> ${escapeHtml(obj.message)}`;
    feed.prepend(div);

    file.push(` 🎙️ ${obj.nom} : ${obj.message} `);
    if (file.length === 1) lancerDefilement();
  }

  // lecture initiale : uniquement les "accepted"
  db.ref('dedicaces').orderByChild('date').limitToLast(100).once('value')
    .then(snap => {
      const items = [];
      snap.forEach(child => {
        const d = child.val();
        if (d && d.nom && d.message && d.status === "accepted") items.push(d);
      });
      items.reverse().forEach(displayDedicace);
    })
    .catch(err => console.warn('Erreur lecture initiale dedicaces:', err));

  // écoute des nouveaux ajouts validés
  db.ref('dedicaces').orderByChild('date').limitToLast(10).on('child_added', snap => {
    const d = snap.val();
    if (!d || !d.nom || !d.message || d.status !== "accepted") return;
    displayDedicace(d);
  });

  // envoi : stocke en "pending"
  form.addEventListener('submit', e => {
    e.preventDefault();
    const nom = nomInput.value.trim();
    const message = msgInput.value.trim();
    if (!nom || !message) return alert('Nom et message requis.');

    // blacklist courte
    const blacklist = ["con","connard","merde","putain","salope","enculé","fdp","tg","nique","bite","couille"];
    if (blacklist.some(m => message.toLowerCase().includes(m))) {
      return alert('Ton message contient un mot interdit. Merci de rester respectueux !');
    }

    const today = new Date().toISOString().split('T')[0];
    const last = localStorage.getItem('dedicaceDate');
    if (last === today) return alert("Tu as déjà envoyé une dédicace aujourd'hui.");

    const payload = { nom, message, date: Date.now(), status: "pending" };

    db.ref('dedicaces').push(payload, err => {
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
