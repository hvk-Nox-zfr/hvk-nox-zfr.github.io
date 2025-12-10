(function initAdmin() {
  const db = firebase.database();
  const adminFeed = document.getElementById('adminFeed');

  db.ref('dedicaces').orderByChild('status').equalTo('pending').on('child_added', snap => {
    const d = snap.val();
    const id = snap.key;

    const div = document.createElement('div');
    div.className = 'dedicace-pending';
    div.innerHTML = `
      <strong>${d.nom} :</strong> ${d.message}
      <button onclick="valider('${id}')">Accepter</button>
      <button onclick="refuser('${id}')">Refuser</button>
    `;
    adminFeed.appendChild(div);
  });

  window.valider = function(id) {
    db.ref('dedicaces/' + id).update({ status: "accepted" });
  };

  window.refuser = function(id) {
    db.ref('dedicaces/' + id).update({ status: "rejected" });
  };
})();
