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
