function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const toggleBtn = document.getElementById("menuToggle");

  menu.classList.toggle("open");
  toggleBtn.classList.toggle("open");
}

function openPopup(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closePopup(id) {
  document.getElementById(id).classList.add("hidden");
}

function togglePlay() {
  const logo = document.querySelector('.clickable-logo');

  if (!isPlaying) {
    player.play();
    equalizer.classList.remove('hidden');
    logo.classList.add('playing'); // active l'animation
    isPlaying = true;
  } else {
    player.pause();
    equalizer.classList.add('hidden');
    logo.classList.remove('playing'); // stoppe l'animation
    isPlaying = false;
  }
}

  const form = document.getElementById("sondageForm");
  const feed = document.getElementById("sondageFeed");

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const prenom = document.getElementById("prenom").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const message = document.getElementById("message").value.trim();

    if (prenom && nom && message) {
      const entry = document.createElement("div");
      entry.classList.add("entry");
      entry.innerHTML = `<strong>${prenom} ${nom} :</strong><br>${message}`;
      feed.prepend(entry);

      form.reset();
    }
  });
    function toggleMenu() {
      const menu = document.getElementById("sideMenu");
      const toggleBtn = document.getElementById("menuToggle");
      menu.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    }

    function openPopup(id) {
      document.getElementById(id).classList.remove("hidden");
    }

    function closePopup(id) {
      document.getElementById(id).classList.add("hidden");
    }

    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
      const duration = Math.round((Date.now() - startTime) / 1000);
      fetch('https://hugohts.goatcounter.com/count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `event=durée&title=Durée de session&duration=${duration}`
      });
    });


  const firebaseConfig = {
    apiKey: "TA_CLE_API",
    authDomain: "TON_PROJET.firebaseapp.com",
    databaseURL: "https://TON_PROJET.firebaseio.com",
    projectId: "TON_PROJET",
    storageBucket: "TON_PROJET.appspot.com",
    messagingSenderId: "TON_ID",
    appId: "TON_APP_ID"
  };

  firebase.initializeApp(firebaseConfig);

  firebase.database().ref("articles").on("value", snapshot => {
    const articles = snapshot.val();
    const zone = document.getElementById("articles");
    zone.innerHTML = "";
    articles.forEach(article => {
      const div = document.createElement("div");
      div.innerHTML = article.html;
      zone.appendChild(div);
    });
  });



    // Configuration Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyBiMcAmaOy9g-5Ail2lmj4adxNBNzW4IGk",
      authDomain: "vafm-dedicaces.firebaseapp.com",
      databaseURL: "https://vafm-dedicaces-default-rtdb.firebaseio.com",
      projectId: "vafm-dedicaces",
      storageBucket: "vafm-dedicaces.firebasestorage.app",
      messagingSenderId: "553720861929",
      appId: "1:553720861929:web:87739d3bfa41ed5b50cc78",
      measurementId: "G-QNVR8XET7E"
    };

    // Initialisation Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Envoi de dédicace
    document.getElementById("dedicaceForm").addEventListener("submit", function(e) {
      e.preventDefault();
      const nom = document.getElementById("nom").value.trim();
      const message = document.getElementById("message").value.trim();
      if (nom && message) {
        db.ref("dedicaces").push({ nom, message });
        this.reset();
      }
    });

    // Affichage en direct
    db.ref("dedicaces").on("child_added", function(snapshot) {
      const data = snapshot.val();
      const div = document.createElement("div");
      div.classList.add("dedicace-entry");
      div.innerHTML = `<strong>${data.nom} :</strong> ${data.message}`;
      document.getElementById("dedicaceFeed").prepend(div);
    });
