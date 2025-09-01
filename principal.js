function toggleMenu() {
  const menu = document.getElementById("sideMenu");

  // Si le menu est ouvert, on le remet complètement hors écran
  if (menu.style.right === "0px") {
    menu.style.right = "-250px"; // complètement caché
  } else {
    menu.style.right = "0px"; // complètement visible
  }
}
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  menu.classList.toggle("open");
}

