import * as help from "./helper.js";
const sliders = document.querySelectorAll(".slider");
const sliderHandleValue = document.getElementById("slider--handle-value");

let currentDraggingSlider = null;

sliders.forEach((slider) => {
  slider.dataset.lastValue = slider.dataset.value;
  const background = slider.querySelector(".slider--background");
  const handle = slider.querySelector(".slider--handle");
  background.addEventListener(
    "mousedown",
    (e) => (currentDraggingSlider = slider)
  );
  background.addEventListener("click", (e) => {
    AdjustSliderValue(slider, e);
  });

  handle.addEventListener("mouseover", (e) => {
    if (currentDraggingSlider) return;
    ShowSliderValue(true, slider);
  });
  handle.addEventListener("mouseout", (e) => {
    if (currentDraggingSlider) return;
    ShowSliderValue(false);
  });

  UpdateVisualsToMatchValue(slider, parseFloat(slider.dataset.value));
});
document.addEventListener("mousemove", (e) => {
  if (!currentDraggingSlider) return;
  AdjustSliderValue(currentDraggingSlider, e);
});
document.addEventListener("mouseup", (e) => {
  if (currentDraggingSlider) {
    currentDraggingSlider = null;
  }
  ShowSliderValue(false);
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
  const min = parseFloat(slider.dataset.min);
  const max = parseFloat(slider.dataset.max);
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

  ShowSliderValue(true, slider);

  slider.dispatchEvent(new Event("input", { bubbles: true }));
}

function UpdateVisualsToMatchValue(slider) {
  const min = parseFloat(slider.dataset.min);
  const max = parseFloat(slider.dataset.max);
  const background = slider.querySelector(".slider--background");

  const handle = slider.querySelector(".slider--handle");
  const rect = background.getBoundingClientRect();
  const minRect = handle.getBoundingClientRect().width / 2;
  const maxRect = rect.width - minRect;
  const value = parseFloat(slider.dataset.value);
  const percentage = help.Clamp(help.InverseLerp(min, max, value), 0, 1);

  handle.style.left = `${help.Lerp(minRect, maxRect, percentage)}px`;
  const fill = slider.querySelector(".slider--fill");
  fill.style.width = `${
    (help.Lerp(minRect, maxRect, percentage) / rect.width) * 100
  }%`;

  slider.dispatchEvent(new Event("change", { bubbles: true }));
  console.log("change");
}

function ShowSliderValue(show, slider = null) {
  if (!show || slider === null) {
    sliderHandleValue.classList.add("hidden");
    return;
  }
  sliderHandleValue.classList.remove("hidden");
  const handle = slider.querySelector(".slider--handle");
  const position = handle.getBoundingClientRect();
  sliderHandleValue.style.top = `${position.top}px`;
  sliderHandleValue.style.left = `${(position.left + position.right) / 2}px`;

  // const background = slider.querySelector(".slider--background");
  // const position = background.getBoundingClientRect();
  // sliderHandleValue.style.top = `${(position.top + position.bottom) / 2}px`;
  // sliderHandleValue.style.left = `${position.right}px`;

  const sliderValue = parseFloat(slider.dataset.value);
  const fixedPlace = sliderValue < 0.01 ? 3 : 2;
  sliderHandleValue.querySelector("p").innerHTML = parseFloat(
    slider.dataset.value
  ).toFixed(fixedPlace);
}

// function InverseLerp(a, b, value) {
//   return (value - a) / (b - a);
// }
