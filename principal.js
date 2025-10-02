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
  const logo = document.querySelector('.clickable-logo');
  const equalizer = document.querySelector('.equalizer');
  const player = document.getElementById('audioPlayer');
  let isPlaying = false;

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
      const prenom = document.getElementById("prenom").value.trim();
      const nom = document.getElementById("nom").value.trim();
      const message = document.getElementById("message").value.trim();

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
    databaseURL: "https://vafm-dedicaces-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vafm-dedicaces",
    storageBucket: "vafm-dedicaces.appspot.com",
    messagingSenderId: "553720861929",
    appId: "1:553720861929:web:87739d3bfa41ed5b50cc78"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // 🔁 Nettoyage des dédicaces de plus de 3 jours
  function nettoyerDedicaces() {
    const maintenant = Date.now();
    const troisJours = 3 * 24 * 60 * 60 * 1000;

    db.ref("dedicaces").once("value", snapshot => {
      snapshot.forEach(child => {
        const data = child.val();
        if (data.date) {
          const date = new Date(data.date);
          if (maintenant - date.getTime() > troisJours) {
            db.ref("dedicaces").child(child.key).remove();
          }
        }
      });
    });
  }

  nettoyerDedicaces();

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
      const nom = document.getElementById("nom").value.trim();
      const message = messageInput.value.trim();

      const blacklist = [
        "con", "connard", "connasse", "merde", "putain", "salope", "enculé", "fdp", "ntm", "tg",
        "ta gueule", "nique", "batard", "bâtard", "bite", "couille", "pétasse", "enfoiré", "gros con",
        "fils de", "chier", "débile", "abruti", "crétin", "dégueulasse", "slp", "trou de balle"
      ];

      const contientGrosMot = blacklist.some(mot => message.toLowerCase().includes(mot));
      if (contientGrosMot) {
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
        db.ref("dedicaces").push({ nom, message, date });
        dedicaceForm.reset();
        charCount.textContent = "60 caractères restants";
        localStorage.setItem("dedicaceDate", aujourdHui);
      }
    });

    db.ref("dedicaces").on("child_added", snapshot => {
      const data = snapshot.val();

      const div = document.createElement("div");
      div.classList.add("dedicace-entry");
      div.innerHTML = `<strong>${data.nom} :</strong> ${data.message}`;
      dedicaceFeed.prepend(div);

      file.push(` 🎙️ ${data.nom} : ${data.message} `);
      if (file.length === 1) lancerDefilement();
    });

    function lancerDefilement() {
      if (!marquee || file.length === 0) return;

      marquee.textContent = file.join(" • ");
      marquee.style.transition = "none";
      marquee.style.transform = "translateX(100%)";

      setTimeout(() => {
        const largeur = marquee.scrollWidth;
        const vitesse = 100;
        const duree = (largeur + marquee.offsetWidth) / vitesse;

        marquee.style.transition = `transform ${duree}s linear`;
        marquee.style.transform = `translateX(-${largeur}px)`;

        setTimeout(() => {
          lancerDefilement();
        }, duree * 1000);
      }, 50);
    }
  }

  // 🔁 Chargement des articles
  const articlesZone = document.getElementById("articles");
  if (articlesZone) {
    db.ref("articles").on("value", snapshot => {
      const articles = snapshot.val() || [];
      articlesZone.innerHTML = "";
      articles.forEach(article => {
        const div = document.createElement("div");
        div.innerHTML = article.html;
        articlesZone.appendChild(div);
      });
    });
  }

  // 🔁 Popup nouveautés
  const alreadySeen = localStorage.getItem("popupSeen");
  if (!alreadySeen) {
    const popup = document.getElementById("popupNews");
    if (popup) popup.classList.remove("hidden");
    localStorage.setItem("popupSeen", "true");
  }
});

function closePopup() {
  const popup = document.getElementById("popupNews");
  if (popup) popup.classList.add("hidden");
}
document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.carousel-track');
  const items = Array.from(track.children);
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const dotsContainer = document.querySelector('.carousel-dots');

  const itemWidth = items[0].getBoundingClientRect().width + parseInt(getComputedStyle(items[0]).gap || 16);
  let index = 0;

  // crée les pastilles
  items.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Aller à ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
    dot.addEventListener('click', () => { goToSlide(i); });
  });

  const dots = Array.from(dotsContainer.children);

  function updateButtons() {
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= items.length - visibleCount();
  }

  function visibleCount() {
    const wrapperWidth = document.querySelector('.carousel-track-wrapper').offsetWidth;
    return Math.floor(wrapperWidth / itemWidth) || 1;
  }

  function goToSlide(i) {
    index = Math.max(0, Math.min(i, items.length - visibleCount()));
    const moveX = index * itemWidth;
    track.style.transform = `translateX(-${moveX}px)`;
    dots.forEach(d => d.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');
    updateButtons();
  }

  prevBtn.addEventListener('click', () => goToSlide(index - 1));
  nextBtn.addEventListener('click', () => goToSlide(index + 1));

  // adapt on resize
  window.addEventListener('resize', () => {
    // recalcule largeur et ajuste position
    const newItemWidth = items[0].getBoundingClientRect().width + parseInt(getComputedStyle(items[0]).gap || 16);
    // reposition
    goToSlide(index);
  });

  // support clavier
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });

  // initial
  goToSlide(0);
});
