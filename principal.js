function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("menuOverlay");

  if (menu.style.right === "0px") {
    menu.style.right = "-250px";
    overlay.style.display = "none";
  } else {
    menu.style.right = "0px";
    overlay.style.display = "block";
  }
}
