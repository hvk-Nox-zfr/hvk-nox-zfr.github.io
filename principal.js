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
