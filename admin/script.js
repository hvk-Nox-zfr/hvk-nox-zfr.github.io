document.addEventListener("DOMContentLoaded", function () {
  // Connexion
  window.login = function () {
    const email = document.getElementById("email")?.value;
    const pass = document.getElementById("password")?.value;

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
    firebase.auth().signOut().then(() => {
      window.location.href = "login.html";
    });
  };

  // Ajouter une carte glissable et éditable
  window.ajouterCarte = function () {
    const div = document.createElement("div");
    div.classList.add("carte");
    div.setAttribute("draggable", "true");
    div.setAttribute("contenteditable", "true");
    div.innerHTML = "<h3>Nouveau titre</h3><p>Contenu ici...</p>";

    const zone = document.getElementById("zone-cartes");
    if (zone) {
      zone.appendChild(div);
      activerDragDrop(div);
    } else {
      console.warn("zone-cartes introuvable");
    }
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
    if (!zone._dragEventsAttached) {
      zone.addEventListener("dragover", e => {
        e.preventDefault();
      });

      zone.addEventListener("drop", e => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(zone, e.clientY);
        if (dragging) {
          if (afterElement == null) {
            zone.appendChild(dragging);
          } else {
            zone.insertBefore(dragging, afterElement);
          }
        }
      });

      zone._dragEventsAttached = true;
    }
  }

  // Trouver l’élément après lequel insérer
  function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll(".carte:not(.dragging)")];

    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Publier toutes les cartes dans Firebase
  window.publier = function () {
    const cartes = document.querySelectorAll(".carte");
    const data = [];

    cartes.forEach(carte => {
      data.push({ html: carte.innerHTML });
    });

    firebase.database().ref("articles").set(data)
      .then(() => alert("Articles publiés !"))
      .catch(err => alert("Erreur de publication : " + err.message));
  };
});

