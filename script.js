// import Dot.js
import Dot from "./Dot.js";

const input_img_element = document.getElementById("input-image");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaCanvas = document.getElementById("dots-area");
const dotsAreaCanvasContext = dotsAreaCanvas.getContext("2d");
dotsAreaCanvas.width = window.innerWidth;
dotsAreaCanvas.height = window.innerHeight;

input_img_element.addEventListener("change", (e) => {
  createReader(e.target.files[0], function () {
    // Loop through each pixel
    const imageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const data = imageData.data; // pixel data in a one-dimensional array

    for (let i = 0; i < data.length; i += 4) {
      const red = data[i]; // Red component of the pixel
      const green = data[i + 1]; // Green component of the pixel
      const blue = data[i + 2]; // Blue component of the pixel
      const alpha = data[i + 3]; // Alpha (transparency) component of the pixel

      // Convert the pixel to grayscale
      const gray = 0.299 * red + 0.587 * green + 0.114 * blue;

      // Set the pixel to gray
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
      data[i + 3] = alpha;
    }

    canvasContext.putImageData(imageData, 0, 0);
  });
});

function createReader(file, whenReady) {
  const reader = new FileReader();
  reader.onload = function (evt) {
    const image = new Image();
    image.onload = function (evt) {
      canvas.width = image.width;
      canvas.height = image.height;

      canvasContext.drawImage(image, 0, 0);

      if (whenReady) whenReady();
    };
    image.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

const dotDictionary = {};
const dotsToAdd = 1000;
const dotSpeed = 1;
const maxDotRadius = 5;
const minDotRadius = 1;

function addDots() {
  for (let i = 0; i < dotsToAdd; i++) {
    const pos = {
      x: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.width,
      y: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.height,
    };

    const velocity = {
      x: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
      y: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
    };

    const dotObject = new Dot(i, velocity, pos, 20, maxDotRadius);

    dotDictionary[i] = dotObject;
  }
}

addDots();

// move dots every frame
function moveDots() {
  // clear canvas
  dotsAreaCanvasContext.clearRect(
    0,
    0,
    dotsAreaCanvas.width,
    dotsAreaCanvas.height
  );

  for (const [key, value] of Object.entries(dotDictionary)) {
    const { velocity, position, lastPosition, collisionRadius } = value;
    let { radius } = value;
    value.updatePosition();

    const yPercent = position.y / dotsAreaCanvas.height;

    radius = minDotRadius + (maxDotRadius - minDotRadius) * yPercent;

    // drawCircle(
    //   dotsAreaCanvasContext,
    //   position.x,
    //   position.y,
    //   collisionRadius,
    //   null,
    //   "green",
    //   2
    // );

    drawCircle(
      dotsAreaCanvasContext,
      position.x,
      position.y,
      radius,
      "white",
      "black",
      2
    );

    // bounce off other dots
    for (const [key2, value2] of Object.entries(dotDictionary)) {
      if (key === key2) continue;

      const { position: position2 } = value2;

      const distance = Math.sqrt(
        (position.x - position2.x) ** 2 + (position.y - position2.y) ** 2
      );

      if (distance < collisionRadius * 2) {
        const angle = Math.atan2(
          position2.y - position.y,
          position2.x - position.x
        );

        const overlap = collisionRadius * 2 - distance;

        const moveX = overlap * Math.cos(angle);
        const moveY = overlap * Math.sin(angle);

        position.x -= moveX;
        position.y -= moveY;

        const yDiff = position.y - position2.y;
        const xDiff = position.x - position2.x;

        // normalize vector for difference between the two dots
        const length = Math.sqrt(yDiff * yDiff + xDiff * xDiff);
        const normalized = {
          x: xDiff / length,
          y: yDiff / length,
        };
        velocity.x = normalized.x * dotSpeed;
        velocity.y = normalized.y * dotSpeed;

        // if (position2.x > position.x) {
        //   velocity.x = -Math.abs(velocity.x);
        // } else {
        //   velocity.x = Math.abs(velocity.x);
        // }

        // if (position2.y > position.y) {
        //   velocity.y = -Math.abs(velocity.y);
        // } else {
        //   velocity.y = Math.abs(velocity.y);
        // }
      }
    }

    // bounce off walls
    if (
      position.x - collisionRadius < 0 ||
      position.x + collisionRadius > dotsAreaCanvas.width
    ) {
      velocity.x = -velocity.x;
    }

    if (
      position.y - collisionRadius < 0 ||
      position.y + collisionRadius > dotsAreaCanvas.height
    ) {
      velocity.y = -velocity.y;
    }
  }

  requestAnimationFrame(moveDots);
}
moveDots();

function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
