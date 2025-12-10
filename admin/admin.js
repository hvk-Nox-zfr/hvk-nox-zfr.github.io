
  // ⚡️ Configuration Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBsla-0z8ZyPgfJOTxabFKxBEE2y0oZDD8",
    authDomain: "vafm-admin.firebaseapp.com",
    databaseURL: "https://vafm-admin-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "vafm-admin",
    storageBucket: "vafm-admin.appspot.com",
    messagingSenderId: "323614046813",
    appId: "1:323614046813:web:15a1bceb338680abb0ebb4"
  };

  // Initialisation Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Authentification
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
      window.location.href = "login.html";
    }
  });

  function logout() {
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    });
  }

  // ✅ Script pour gérer les dédicaces
  const db = firebase.database();
  const adminFeed = document.getElementById('adminFeed');

  // Récupère uniquement les dédicaces en attente
  db.ref('dedicaces').orderByChild('status').equalTo('pending').on('child_added', snap => {
    const d = snap.val();
    const id = snap.key;

    const div = document.createElement('div');
    div.className = 'dedicace-card';
    div.innerHTML = `
      <strong>${d.nom} :</strong> ${d.message}<br>
      <button onclick="valider('${id}')">✅ Accepter</button>
      <button onclick="refuser('${id}')">❌ Refuser</button>
    `;
    adminFeed.appendChild(div);
  });

  // Actions admin
  function valider(id) {
    db.ref('dedicaces/' + id).update({ status: "accepted" });
    document.querySelector(`[onclick="valider('${id}')"]`).parentElement.remove();
  }

  function refuser(id) {
    db.ref('dedicaces/' + id).update({ status: "rejected" });
    document.querySelector(`[onclick="refuser('${id}')"]`).parentElement.remove();
  }
