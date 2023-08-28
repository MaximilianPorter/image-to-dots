const settingsCloseButton = document.querySelector(".settings-dropdown-button");
const settingsIcon = document.querySelector(".settings-icon");
const settingsMenu = document.querySelector(".settings");
settingsIcon.addEventListener("click", (e) => {
  settingsMenu.classList.remove("settings-collapsed");
});
settingsCloseButton.addEventListener("click", (e) => {
  settingsMenu.classList.add("settings-collapsed");
});

const settingsDropdownButtons = document.querySelectorAll(
  ".settings-section--title"
);
settingsDropdownButtons.forEach((button) => {
  const parent = button.closest(".settings-section");
  // set height to offset height
  parent.style.height = `${parent.offsetHeight}px`;
  parent.classList.add("section-hidden");
  button.addEventListener("click", (e) => {
    parent.classList.toggle("section-hidden");
  });
});
