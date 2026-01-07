function openMenu() {
  var menuBtn = document.getElementById("menu");

  if (menuBtn.className === "nav-menu") {
    menuBtn.className += " responsive";
  } else {
    menuBtn.className = "nav-menu";
  }
}

const sections = document.querySelectorAll("div[id]");

function scrollActive() {
  const scrollY = window.scrollY;

  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight,
      sectionTop = current.offsetTop - 70,
      sectionId = current.getAttribute("id");

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelector("header nav a[href*=" + sectionId + "]").classList.add("active");
    } else {
      document.querySelector("header nav a[href*=" + sectionId + "]").classList.remove("active");
    }
  });
}

window.addEventListener("scroll", scrollActive);
