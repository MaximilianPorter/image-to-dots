const canvas = document.getElementById("dots-area");
const context = canvas.getContext("2d");
let mousePos = { x: 0, y: 0 };
let mousePosOnCanvas = { x: 0, y: 0 };

const zoomIntensity = 0.2;
let visibleWidth = canvas.width;
let visibleHeight = canvas.height;
let scale = 1;
let originx = 0;
let originy = 0;

document.addEventListener("mousemove", (event) => {
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
  // draw red circle where mouse is on canvas
  // context.beginPath();
  // context.arc(mousePosOnCanvas.x, mousePosOnCanvas.y, 5, 0, 2 * Math.PI);
  // context.fillStyle = "red";
  // context.fill();
});

document.addEventListener("wheel", (event) => {
  zoomInOnMouse(event);
});

function zoomInOnMouse(event) {
  // Get mouse offset.
  const width = canvas.width;
  const height = canvas.height;

  const mousex = mousePosOnCanvas.x;
  const mousey = mousePosOnCanvas.y;

  // Normalize mouse wheel movement to +1 or -1 to avoid unusual jumps.
  const wheel = event.deltaY < 0 ? 1 : -1;

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
  if (scale < 1) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    scale = 1;
    visibleWidth = width / scale;
    visibleHeight = height / scale;
    originx = 0;
    originy = 0;
  }
}

export { mousePosOnCanvas, scale };
