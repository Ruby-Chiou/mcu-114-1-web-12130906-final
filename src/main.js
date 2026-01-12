function openMenu() {
  var menuBtn = document.getElementById("menu");
  if (menuBtn.className === "nav-menu") {
    menuBtn.className += " responsive";
  } else {
    menuBtn.className = "nav-menu";
  }
}

const sections = document.querySelectorAll("div[id]"); // 你用 div，保持不變

function scrollHandler() {
  // 1️⃣ 原有的 scrollActive 邏輯（球球左右移動）
  const scrollY = window.scrollY;
  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = current.offsetTop - 70;
    const sectionId = current.getAttribute("id");

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelector("header nav a[href*=" + sectionId + "]").classList.add("active");
    } else {
      document.querySelector("header nav a[href*=" + sectionId + "]").classList.remove("active");
    }
  });

  // 2️⃣ 新的高度 + 陰影邏輯
  const header = document.querySelector("header");
  if (window.scrollY > 5) {
    header.style.setProperty("--header-height", "70px");
    header.style.setProperty("--header-shadow", "0 1px 6px rgba(0,0,0,0.1)");
    header.style.setProperty("--shadow-opacity", "1");
  } else {
    header.style.setProperty("--header-height", "90px");
    header.style.setProperty("--header-shadow", "none");
    header.style.setProperty("--shadow-opacity", "0");
  }
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      scrollHandler(); // ✅ 呼叫合併函數
      ticking = false;
    });
    ticking = true;
  }
});
