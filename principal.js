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

  // 🔁 Sondage local
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

  // ✅ Firebase
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
  const marquee = document.getElementById("dedicaceMarquee");
  const messageInput = document.getElementById("message");
  const charCount = document.getElementById("charCount");

  const file = [];

  if (messageInput && charCount) {
    messageInput.addEventListener("input", () => {
      const max = messageInput.getAttribute("maxlength");
      const current = messageInput.value.length;
      charCount.textContent = `${max - current} caractères restants`;
    });
  }

  if (dedicaceForm && dedicaceFeed && marquee) {
    dedicaceForm.addEventListener("submit", e => {
      e.preventDefault();
      const nom = document.getElementById("nom")?.value.trim();
      const message = messageInput?.value.trim();

      if (nom && message) {
        db.ref("dedicaces").push({ nom, message });
        dedicaceForm.reset();
        charCount.textContent = "50 caractères restants";
      }
    });

    db.ref("dedicaces").on("child_added", snapshot => {
      const data = snapshot.val();

      const div = document.createElement("div");
      div.classList.add("dedicace-entry");
      div.innerHTML = `<strong>${data.nom} :</strong> ${data.message}`;
      dedicaceFeed.prepend(div);

      file.push(` 🎙️ ${data.nom} : ${data.message} `);
      if (file.length === 1) {
        afficherUneDedicace();
      }
    });

    function afficherUneDedicace() {
      if (file.length === 0) return;

      marquee.textContent = file[0];
      marquee.style.animation = "defilement 30s linear";

      setTimeout(() => {
        file.shift();
        afficherUneDedicace();
      }, 30000);
    }
  }

  // 🔁 Chargement des articles
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
dedicaceForm.addEventListener("submit", e => {
  e.preventDefault();
  const nom = document.getElementById("nom")?.value.trim();
  const message = document.getElementById("message")?.value.trim();

  const blacklist = ["con", "merde", "putain", "salope", "enculé", "fdp", "ntm", "tg"];
  const contientGrosMot = blacklist.some(mot => message.toLowerCase().includes(mot));

  if (contientGrosMot) {
    alert("Ton message contient un mot interdit. Merci de rester respectueux !");
    return;
  }

  if (nom && message) {
    db.ref("dedicaces").push({ nom, message });
    dedicaceForm.reset();
    charCount.textContent = "50 caractères restants";
  }
});
