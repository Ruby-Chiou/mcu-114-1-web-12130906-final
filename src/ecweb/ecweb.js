const viewer = document.querySelector("#viewer");
const viewerImage = viewer.querySelector("img");
const viewerText = viewer.querySelector("p");

document.querySelectorAll(".shot").forEach((shot) => {
  shot.addEventListener("click", () => {
    const image = shot.querySelector("img");
    viewerImage.src = image.src;
    viewerImage.alt = image.alt;
    viewerText.textContent = shot.querySelector("span").textContent;
    viewer.showModal();
  });
});

viewer.querySelector(".close-shot").addEventListener("click", () => viewer.close());

viewer.addEventListener("click", (event) => {
  if (event.target === viewer) viewer.close();
});
