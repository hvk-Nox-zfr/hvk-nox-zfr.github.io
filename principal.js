function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const toggleBtn = document.getElementById("menuToggle");

  menu.classList.toggle("open");
  toggleBtn.classList.toggle("open");
}

  function openPopup() {
    document.getElementById("popup").classList.remove("hidden");
  }

  function closePopup() {
    document.getElementById("popup").classList.add("hidden");
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
