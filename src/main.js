function openMenu() {
  var menuBtn = document.getElementById("menu");
  if (menuBtn.className === "nav-menu") {
    menuBtn.className += " responsive";
  } else {
    menuBtn.className = "nav-menu";
  }
}

const sections = document.querySelectorAll("main.wrapper > div[id]");

function scrollHandler() {
  const scrollY = window.scrollY;
  let currentId = sections[0] ? sections[0].id : "";
  sections.forEach((current) => {
    if (scrollY >= current.offsetTop - 140) currentId = current.id;
  });
  document.querySelectorAll("header nav a").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + currentId);
  });

  //新的高度+陰影邏輯
  const header = document.querySelector("header");
  if (window.scrollY > 5) {
    header.style.setProperty("--header-height", "70px");
    header.style.setProperty("--header-shadow", "0 1px 6px rgba(0,0,0,0.1)");
    header.style.setProperty("--shadow-opacity", "1");
    document.documentElement.style.setProperty("--body-padding-top", "70px");
  } else {
    header.style.setProperty("--header-height", "90px");
    header.style.setProperty("--header-shadow", "none");
    header.style.setProperty("--shadow-opacity", "0");
    document.documentElement.style.setProperty("--body-padding-top", "90px");
  }
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      scrollHandler();
      ticking = false;
    });
    ticking = true;
  }
});

const certLightbox = document.querySelector(".cert-lightbox");
const certImage = certLightbox.querySelector("img");
const certCaption = certLightbox.querySelector("figcaption");
const certPrev = certLightbox.querySelector(".cert-nav.prev");
const certNext = certLightbox.querySelector(".cert-nav.next");
let certGallery = [];
let certCaptions = [];
let certIndex = 0;

function renderCert() {
  certImage.src = certGallery[certIndex];
  certImage.alt = certCaptions[certIndex] || "證明文件";
  const multi = certGallery.length > 1;
  certPrev.hidden = !multi;
  certNext.hidden = !multi;
  certCaption.textContent = multi
    ? `${certCaptions[certIndex] || ""}（${certIndex + 1} / ${certGallery.length}）`
    : certCaptions[certIndex] || "";
}

function openCert(images, captions) {
  certGallery = images;
  certCaptions = captions;
  certIndex = 0;
  renderCert();
  certLightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
  certLightbox.querySelector(".cert-close").focus();
}

function closeCert() {
  certLightbox.classList.remove("is-open");
  certImage.removeAttribute("src");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-cert-images]").forEach((button) => {
  button.addEventListener("click", () => {
    openCert(button.dataset.certImages.split("|"), (button.dataset.certCaptions || "").split("|"));
  });
});

certLightbox.querySelector(".cert-close").addEventListener("click", closeCert);
certPrev.addEventListener("click", () => {
  certIndex = (certIndex - 1 + certGallery.length) % certGallery.length;
  renderCert();
});
certNext.addEventListener("click", () => {
  certIndex = (certIndex + 1) % certGallery.length;
  renderCert();
});
certLightbox.addEventListener("click", (event) => {
  if (event.target === certLightbox) closeCert();
});
document.addEventListener("keydown", (event) => {
  if (!certLightbox.classList.contains("is-open")) return;
  if (event.key === "Escape") closeCert();
  if (event.key === "ArrowLeft" && certGallery.length > 1) {
    certIndex = (certIndex - 1 + certGallery.length) % certGallery.length;
    renderCert();
  }
  if (event.key === "ArrowRight" && certGallery.length > 1) {
    certIndex = (certIndex + 1) % certGallery.length;
    renderCert();
  }
});
