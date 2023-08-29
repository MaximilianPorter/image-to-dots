const settingsCloseButton = document.querySelector(".settings-dropdown-button");
const settingsIcon = document.querySelector(".settings-icon");
const settingsMenu = document.querySelector(".settings");
const infoButtons = document.querySelectorAll(".info-button");
const settingsInfoPopup = document.getElementById("settings-info-popup");

const debugExpanded = true;
if (debugExpanded) settingsMenu.classList.remove("settings-collapsed");

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
  if (!debugExpanded) parent.classList.add("section-hidden");
  button.addEventListener("click", (e) => {
    parent.classList.toggle("section-hidden");
  });
});

infoButtons.forEach((button) => {
  button.addEventListener("mouseover", (e) => {
    const infoText = button.closest("div").dataset.info;
    if (!infoText) return;

    settingsInfoPopup.classList.remove("hidden");
    const position = button.getBoundingClientRect();
    settingsInfoPopup.style.top = `${(position.bottom + position.top) / 2}px`;
    settingsInfoPopup.style.left = `${position.right}px`;

    settingsInfoPopup.querySelector("p").innerHTML = infoText;
  });
  button.addEventListener("mouseout", (e) => {
    settingsInfoPopup.classList.add("hidden");
  });
});
