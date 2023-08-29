import * as help from "./helper.js";
const sliders = document.querySelectorAll(".slider");

let currentDraggingSlider = null;

sliders.forEach((slider) => {
  slider.dataset.lastValue = slider.dataset.value;
  const background = slider.querySelector(".slider--background");
  background.addEventListener(
    "mousedown",
    (e) => (currentDraggingSlider = slider)
  );
  background.addEventListener("click", (e) => {
    AdjustSliderValue(slider, e);
  });

  UpdateVisualsToMatchValue(slider, parseInt(slider.dataset.value));
});
document.addEventListener("mousemove", (e) => {
  if (!currentDraggingSlider) return;
  AdjustSliderValue(currentDraggingSlider, e);
});
document.addEventListener("mouseup", (e) => {
  if (currentDraggingSlider) {
    currentDraggingSlider = null;
  }
});

function CheckForSliderUpdate() {
  sliders.forEach((slider) => {
    if (
      slider.dataset.lastValue !== slider.dataset.value &&
      !currentDraggingSlider
    ) {
      UpdateVisualsToMatchValue(slider);
      slider.dataset.lastValue = slider.dataset.value;
    }
  });
  requestAnimationFrame(CheckForSliderUpdate);
}
CheckForSliderUpdate();

function AdjustSliderValue(slider, e) {
  const min = parseInt(slider.dataset.min);
  const max = parseInt(slider.dataset.max);
  const background = slider.querySelector(".slider--background");

  const handle = slider.querySelector(".slider--handle");
  const rect = background.getBoundingClientRect();
  const minRect = handle.getBoundingClientRect().width / 2;
  const maxRect = rect.width - minRect;
  const x = e.clientX - rect.left;
  const percentage = help.Clamp(help.InverseLerp(minRect, maxRect, x), 0, 1);
  const value = help.Lerp(min, max, percentage);
  slider.dataset.value = value;

  handle.style.left = `${help.Lerp(minRect, maxRect, percentage)}px`;
  const fill = slider.querySelector(".slider--fill");
  fill.style.width = `${
    (help.Lerp(minRect, maxRect, percentage) / rect.width) * 100
  }%`;

  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function UpdateVisualsToMatchValue(slider) {
  const min = parseInt(slider.dataset.min);
  const max = parseInt(slider.dataset.max);
  const background = slider.querySelector(".slider--background");

  const handle = slider.querySelector(".slider--handle");
  const rect = background.getBoundingClientRect();
  const minRect = handle.getBoundingClientRect().width / 2;
  const maxRect = rect.width - minRect;
  const value = parseInt(slider.dataset.value);
  const percentage = help.Clamp(help.InverseLerp(min, max, value), 0, 1);

  handle.style.left = `${help.Lerp(minRect, maxRect, percentage)}px`;
  const fill = slider.querySelector(".slider--fill");
  fill.style.width = `${
    (help.Lerp(minRect, maxRect, percentage) / rect.width) * 100
  }%`;

  slider.dispatchEvent(new Event("change", { bubbles: true }));
  console.log("change");
}

// function InverseLerp(a, b, value) {
//   return (value - a) / (b - a);
// }
