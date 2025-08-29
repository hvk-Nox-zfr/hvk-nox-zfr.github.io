fetch('http://localhost:5000/api/content/latest')
  .then(res => res.json())
  .then(data => {
    document.body.style.backgroundColor = data.couleurFond;
    document.getElementById('titre').innerText = data.titre;
    document.getElementById('texte').innerText = data.texte;
    document.getElementById('image').src = data.imageURL;
  })
  .catch(err => console.error("Erreur chargement contenu :", err));
