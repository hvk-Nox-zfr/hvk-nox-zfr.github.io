document.addEventListener("DOMContentLoaded", () => {
  // 🔁 Menu latéral
  const toggleBtn = document.getElementById("menuToggle");
  const sideMenu = document.getElementById("sideMenu");

  if (toggleBtn && sideMenu) {
    toggleBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    });
  }

  // 🔁 Popups
  window.openPopup = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  };

  window.closePopup = function(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  };

  // 🔁 Animation logo audio
  let isPlaying = false;
  const logo = document.querySelector('.clickable-logo');
  const equalizer = document.querySelector('.equalizer');
  const player = document.getElementById('audioPlayer');

  window.togglePlay = function () {
    if (!player || !logo || !equalizer) return;

    if (!isPlaying) {
      player.play();
      equalizer.classList.remove('hidden');
      logo.classList.add('playing');
      isPlaying = true;
    } else {
      player.pause();
      equalizer.classList.add('hidden');
      logo.classList.remove('playing');
      isPlaying = false;
    }
  };

  // 🔁 Sondage local (non Firebase)
  const sondageForm = document.getElementById("sondageForm");
  const sondageFeed = document.getElementById("sondageFeed");

  if (sondageForm && sondageFeed) {
    sondageForm.addEventListener("submit", e => {
      e.preventDefault();
      const prenom = document.getElementById("prenom")?.value.trim();
      const nom = document.getElementById("nom")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (prenom && nom && message) {
        const entry = document.createElement("div");
        entry.classList.add("entry");
        entry.innerHTML = `<strong>${prenom} ${nom} :</strong><br>${message}`;
        sondageFeed.prepend(entry);
        sondageForm.reset();
      }
    });
  }

  // 🔁 Session duration tracking
  const startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    fetch('https://hugohts.goatcounter.com/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `event=durée&title=Durée de session&duration=${duration}`
    });
  });

  // ✅ Firebase (version 8 recommandée dans HTML)
  const firebaseConfig = {
    apiKey: "AIzaSyBiMcAmaOy9g-5Ail2lmj4adxNBNzW4IGk",
    authDomain: "vafm-dedicaces.firebaseapp.com",
    databaseURL: "https://vafm-dedicaces-default-rtdb.firebaseio.com",
    projectId: "vafm-dedicaces",
    storageBucket: "vafm-dedicaces.appspot.com",
    messagingSenderId: "553720861929",
    appId: "1:553720861929:web:87739d3bfa41ed5b50cc78"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // 🔁 Dédicace en direct
  const dedicaceForm = document.getElementById("dedicaceForm");
  const dedicaceFeed = document.getElementById("dedicaceFeed");

  if (dedicaceForm && dedicaceFeed) {
    dedicaceForm.addEventListener("submit", e => {
      e.preventDefault();
      const nom = document.getElementById("nom")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (nom && message) {
        db.ref("dedicaces").push({ nom, message });
        dedicaceForm.reset();
      }
    });

    db.ref("dedicaces").on("child_added", snapshot => {
      const data = snapshot.val();
      const div = document.createElement("div");
      div.classList.add("dedicace-entry");
      div.innerHTML = `<strong>${data.nom} :</strong> ${data.message}`;
      dedicaceFeed.prepend(div);
    });
  }

  // 🔁 Chargement des articles (si zone présente)
  const articlesZone = document.getElementById("articles");
  if (articlesZone) {
    db.ref("articles").on("value", snapshot => {
      const articles = snapshot.val();
      articlesZone.innerHTML = "";
      (articles || []).forEach(article => {
        const div = document.createElement("div");
        div.innerHTML = article.html;
        articlesZone.appendChild(div);
      });
    });
  }
});
const marquee = document.getElementById("dedicaceMarquee");

db.ref("dedicaces").on("child_added", snapshot => {
  const data = snapshot.val();
  const span = document.createElement("span");
  span.textContent = ` 🎙️ ${data.nom} : ${data.message}  • `;
  marquee.appendChild(span);
});
