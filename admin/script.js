document.addEventListener("DOMContentLoaded", () => {
  // Connexion
  window.login = function () {
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");

    if (!emailInput || !passInput) {
      alert("Champs email ou mot de passe introuvables.");
      return;
    }

    const email = emailInput.value.trim();
    const pass = passInput.value.trim();

    if (!email || !pass) {
      alert("Veuillez remplir les champs.");
      return;
    }

    firebase.auth().signInWithEmailAndPassword(email, pass)
      .then(() => window.location.href = "index.html")
      .catch(err => alert("Erreur : " + err.message));
  };

  // Déconnexion
  window.logout = function () {
    firebase.auth().signOut()
      .then(() => window.location.href = "login.html")
      .catch(err => alert("Erreur de déconnexion : " + err.message));
  };

  // Ajouter une carte glissable et éditable
  window.ajouterCarte = function () {
    const zone = document.getElementById("zone-cartes");
    if (!zone) {
      console.warn("zone-cartes introuvable");
      return;
    }

    const div = document.createElement("div");
    div.className = "carte";
    div.setAttribute("draggable", "true");
    div.setAttribute("contenteditable", "true");
    div.innerHTML = "<h3>Nouveau titre</h3><p>Contenu ici...</p>";

    zone.appendChild(div);
    activerDragDrop(div);
  };

  // Activer le glisser-déposer sur une carte donnée
  function activerDragDrop(carte) {
    carte.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", "");
      carte.classList.add("dragging");
    });

    carte.addEventListener("dragend", () => {
      carte.classList.remove("dragging");
    });

    const zone = document.getElementById("zone-cartes");
    if (!zone || zone._dragEventsAttached) return;

    zone.addEventListener("dragover", e => {
      e.preventDefault();
    });

    zone.addEventListener("drop", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      const afterElement = getDragAfterElement(zone, e.clientY);
      if (dragging) {
        if (!afterElement) {
          zone.appendChild(dragging);
        } else {
          zone.insertBefore(dragging, afterElement);
        }
      }
    });

    zone._dragEventsAttached = true;
  }

  // Trouver l’élément après lequel insérer
  function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll(".carte:not(.dragging)")];

    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset)
        ? { offset, element: child }
        : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Publier toutes les cartes dans Firebase
  window.publier = function () {
    const cartes = document.querySelectorAll(".carte");
    if (!cartes.length) {
      alert("Aucune carte à publier.");
      return;
    }

    const data = Array.from(cartes).map(carte => ({
      html: carte.innerHTML
    }));

    firebase.database().ref("articles").set(data)
      .then(() => alert("Articles publiés !"))
      .catch(err => alert("Erreur de publication : " + err.message));
  };
});


