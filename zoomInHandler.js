// this helped: https://stackoverflow.com/questions/2916081/zoom-in-on-a-point-using-scale-and-translate
import * as help from "./helper.js";

const input_img_element = document.getElementById("input-image");
const dotsAreaSection = document.querySelector(".dots-area-section");
const canvas = document.getElementById("dots-area");
const context = canvas.getContext("2d");
const fpsSlider = document.getElementById("fps-slider");
let mousePosOnCanvas = { x: 0, y: 0 };

const zoomIntensity = 0.2;
let visibleWidth = canvas.width;
let visibleHeight = canvas.height;
let scale = 1;
let originx = 0;
let originy = 0;

let middleMouseDelta = 0;
let holdingMiddleMouse = false;
let middleMouseStart = { x: 0, y: 0 };

let draggingCanvas = false;

// detect mouse wheel click in
document.addEventListener("mousedown", (event) => {
  if (event.button === 0 && scale > 1) {
    draggingCanvas = true;
  }
  if (event.button === 1) {
    holdingMiddleMouse = true;
    middleMouseStart = { x: event.clientX, y: event.clientY };
  }
});
document.addEventListener("mouseup", (event) => {
  if (event.button === 0) draggingCanvas = false;
  if (event.button === 1) holdingMiddleMouse = false;
});

function ListenForMiddleMouse() {
  if (holdingMiddleMouse) {
    zoomInOnMiddle({ deltaY: -1 }, middleMouseDelta / 1000);
  }

  setTimeout(ListenForMiddleMouse, 1000 / parseInt(fpsSlider.dataset.value));
}
ListenForMiddleMouse();

document.addEventListener("mousemove", (event) => {
  if (draggingCanvas) {
    dragCanvasWithMouse(event);
    // return;
  }

  if (holdingMiddleMouse) middleMouseDelta = middleMouseStart.y - event.clientY;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const percent = {
    x: x / rect.width,
    y: y / rect.height,
  };
  mousePosOnCanvas = {
    x: percent.x * visibleWidth + originx,
    y: percent.y * visibleHeight + originy,
  };

  // DrawMousePosition();
});

canvas.addEventListener("wheel", (event) => {
  zoomInOnMouse(event);
});

// check if canvas changed
input_img_element.addEventListener("change", (e) => {
  if (e.target.files.length === 0) return;
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      console.log("loaded");
      // wait for canvas to update
      setTimeout(() => {
        // set the origin
        originx = 0;
        originy = 0;

        // set the visible width and height
        visibleWidth = canvas.width / scale;
        visibleHeight = canvas.height / scale;
      }, 100);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function zoomInOnMouse(event, increment = 1) {
  // Get mouse offset.
  const width = canvas.width;
  const height = canvas.height;

  const mousex = mousePosOnCanvas.x;
  const mousey = mousePosOnCanvas.y;

  // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
  const wheel = event.deltaY < 0 ? increment : -increment;

  // Compute zoom factor.
  const zoom = Math.exp(wheel * zoomIntensity);

  // Translate so the visible origin is at the context's origin.
  context.translate(originx, originy);

  // Compute the new visible origin. Originally the mouse is at a
  // distance mouse/scale from the corner, we want the point under
  // the mouse to remain in the same place after the zoom, but this
  // is at mouse/new_scale away from the corner. Therefore we need to
  // shift the origin (coordinates of the corner) to account for this.
  originx -= mousex / (scale * zoom) - mousex / scale;
  originy -= mousey / (scale * zoom) - mousey / scale;

  // Scale it (centered around the origin due to the translate above).
  context.scale(zoom, zoom);
  // Offset the visible origin to it's proper position.
  context.translate(-originx, -originy);

  // Update scale and others.
  scale *= zoom;
  visibleWidth = width / scale;
  visibleHeight = height / scale;

  // prevent canvas from zooming out too far
  preventZoomOut(width, height);
}

function preventZoomOut(width, height) {
  // prevent canvas from zooming out too far
  if (scale < 1) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    scale = 1;
    visibleWidth = width / scale;
    visibleHeight = height / scale;
    originx = 0;
    originy = 0;
  }
}
function zoomInOnMiddle(event, increment = 1) {
  const width = canvas.width;
  const height = canvas.height;
  const mousex = canvas.width / 2;
  const mousey = canvas.height / 2;
  const wheel = event.deltaY < 0 ? increment : -increment;
  const zoom = Math.exp(wheel * zoomIntensity);
  context.translate(originx, originy);
  originx -= mousex / (scale * zoom) - mousex / scale;
  originy -= mousey / (scale * zoom) - mousey / scale;

  context.scale(zoom, zoom);
  context.translate(-originx, -originy);
  scale *= zoom;
  visibleWidth = width / scale;
  visibleHeight = height / scale;

  // prevent canvas from zooming out too far
  preventZoomOut(width, height);
}

function dragCanvasWithMouse(event) {
  if (draggingCanvas) {
    // clamp dragging to canvas

    const mousex = event.movementX;
    const mousey = event.movementY;

    const maxWidth = canvas.width - visibleWidth;
    const maxHeight = canvas.height - visibleHeight;

    const lastOriginX = originx;
    const lastOriginY = originy;
    originx = help.Clamp(originx - mousex, 0, maxWidth);
    originy = help.Clamp(originy - mousey, 0, maxHeight);

    const changeX = originx - lastOriginX;
    const changeY = originy - lastOriginY;

    context.translate(-changeX, -changeY);
  }
}

function DrawMousePosition() {
  // draw red circle where mouse is on canvas
  context.beginPath();
  context.arc(mousePosOnCanvas.x, mousePosOnCanvas.y, 5, 0, 2 * Math.PI);
  context.fillStyle = "red";
  context.fill();
}

function drawOrigin() {
  // big green circle at origin
  context.beginPath();
  context.arc(originx, originy, 100, 0, 2 * Math.PI);
  context.fillStyle = "green";
  context.fill();
  // console.log(originx, originy);

  requestAnimationFrame(drawOrigin);
}
// drawOrigin();

export { mousePosOnCanvas, scale };
