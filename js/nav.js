const menuBtn = document.querySelector(".menu_btn");
const menuBody = document.querySelector(".menu_body");

menuBtn.addEventListener("click", () => {
  menuBody.classList.toggle("active");
});

const menuBodyPartCtrls = document.querySelectorAll(".menu_body_part_ctrl");

menuBodyPartCtrls.forEach(ctrlBtn => {
  const menuBodyPartBody = ctrlBtn.closest(".menu_body_part").querySelector(".menu_body_part_body");
  ctrlBtn.addEventListener("click", () => {
    menuBodyPartBody.classList.toggle("active");
  });
});