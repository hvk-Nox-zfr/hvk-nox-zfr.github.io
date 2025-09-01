function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const toggleBtn = document.getElementById("menuToggle");

  menu.classList.toggle("open");
  toggleBtn.classList.toggle("open");
}
