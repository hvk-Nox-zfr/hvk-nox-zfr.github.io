function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const toggleBtn = document.getElementById("menuToggle");

  menu.classList.toggle("open");

  if (menu.classList.contains("open")) {
    toggleBtn.textContent = "✖";
  } else {
    toggleBtn.textContent = "☰";
  }
}
