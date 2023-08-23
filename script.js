// import Dot.js
import Dot from "./Dot.js";

const input_img_element = document.getElementById("input-image");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaCanvas = document.getElementById("dots-area");
const dotsAreaCanvasContext = dotsAreaCanvas.getContext("2d");

let uploadedImageData;
const CELL_SIZE = 10;
const grid = {};

input_img_element.addEventListener("change", (e) => {
  createReader(e.target.files[0], function () {
    // Loop through each pixel
    uploadedImageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    const data = uploadedImageData.data; // pixel data in a one-dimensional array

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

    canvasContext.putImageData(uploadedImageData, 0, 0);
    addDots();
    moveDots();
    // console.log(getApproximatePixelColor(0.5, 0.5, uploadedImageData));
  });
});

function createReader(file, whenReady) {
  const reader = new FileReader();
  reader.onload = function (evt) {
    const image = new Image();
    image.onload = function (evt) {
      canvas.width = image.width;
      canvas.height = image.height;

      // match aspect ratio of canvas
      dotsAreaCanvas.width = window.innerWidth;
      dotsAreaCanvas.height =
        (window.innerWidth / canvas.width) * canvas.height;

      canvasContext.drawImage(image, 0, 0);

      if (whenReady) whenReady();
    };
    image.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

const dotDictionary = {};
const dotsToAdd = 10000;
const dotSpeed = 2;
const maxDotRadius = 3;
const minDotRadius = 0.01;
const bounceDamper = 0.1;
const acceleration = 0.001;
const radiusChangeRate = 0.1;

function addDots() {
  createGrid();
  for (let i = 0; i < dotsToAdd; i++) {
    const pos = {
      x: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.width,
      y: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.height,
    };

    const velocity = {
      x: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
      y: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
    };

    const dotObject = new Dot(
      i,
      velocity,
      pos,
      minDotRadius,
      maxDotRadius,
      CELL_SIZE
    );

    const gridKey = `${dotObject.gridPosition.x},${dotObject.gridPosition.y}`;
    grid[gridKey].push(dotObject);

    dotDictionary[i] = dotObject;
  }
}

// move dots every frame
function moveDots() {
  if (Object.keys(dotDictionary).length === 0) {
    return;
  }

  // clear canvas
  dotsAreaCanvasContext.clearRect(
    0,
    0,
    dotsAreaCanvas.width,
    dotsAreaCanvas.height
  );

  for (const [key, value] of Object.entries(dotDictionary)) {
    const { velocity, position, lastPosition } = value;
    let { radius, collisionRadius, gridPosition } = value;
    value.updatePosition();

    const lastGridPosition = { ...gridPosition };
    value.updateGridPosition();
    const newGridPosition = { ...gridPosition };

    // if the dot has moved to a new grid position
    if (
      lastGridPosition.x !== newGridPosition.x ||
      lastGridPosition.y !== newGridPosition.y
    ) {
      // remove dot from old grid position
      const oldGridKey = `${lastGridPosition.x},${lastGridPosition.y}`;
      const oldGridArray = grid[oldGridKey];
      const index = oldGridArray.findIndex((dot) => dot.id === value.id);
      oldGridArray.splice(index, 1);

      // add dot to new grid position
      const newGridKey = `${newGridPosition.x},${newGridPosition.y}`;
      grid[newGridKey]?.push(value) ?? (grid[newGridKey] = [value]);
    }

    // console.log(velocity);
    // console.log(VectorMagnitude(velocity.x, velocity.y));
    if (Math.abs(velocity.x) < dotSpeed) {
      velocity.x += acceleration * (velocity.x < 0 ? -1 : 1);
    }
    if (Math.abs(velocity.y) < dotSpeed) {
      velocity.y += acceleration * (velocity.y < 0 ? -1 : 1);
    }

    // if (VectorMagnitude(velocity.x, velocity.y) < dotSpeed) {
    //   if (velocity.x < 0) {
    //     velocity.x -= acceleration;
    //   } else {
    //     velocity.x += acceleration;
    //   }
    //   if (velocity.y < 0) {
    //     velocity.y -= acceleration;
    //   } else {
    //     velocity.y += acceleration;
    //   }
    // }

    // const yPercent = position.y / dotsAreaCanvas.height;

    const pixelValue = getPixelValue(
      position.x / dotsAreaCanvas.width,
      position.y / dotsAreaCanvas.height,
      uploadedImageData
    );

    const desiredRadius =
      minDotRadius + (maxDotRadius - minDotRadius) * pixelValue;
    value.radius += (desiredRadius - radius) * radiusChangeRate;

    // this is to debug the collision radius
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
      null,
      2
    );

    const neighboringDots = getDotsInNeighboringCells(value);

    // bounce off other dots
    // for (const [key2, dot] of Object.entries(dotDictionary)) {
    for (const dot of neighboringDots) {
      if (value === dot) continue;

      const { position: position2, radius: radius2 } = dot;

      const distance = Math.sqrt(
        (position.x - position2.x) ** 2 + (position.y - position2.y) ** 2
      );

      if (distance < collisionRadius + radius2) {
        const overlap = collisionRadius + radius2 - distance;
        const direction = NormalizeVector(
          position.x - position2.x,
          position.y - position2.y
        );

        position.x += direction.x * overlap * bounceDamper;
        position.y += direction.y * overlap * bounceDamper;

        position2.x -= direction.x * overlap * bounceDamper;
        position2.y -= direction.y * overlap * bounceDamper;

        const yDiff = position.y - position2.y;
        const xDiff = position.x - position2.x;

        // normalize vector for difference between the two dots
        const normalized = NormalizeVector(xDiff, yDiff);
        // velocity.x = normalized.x * Math.abs(velocity.x) * bounceDamper;
        // velocity.y = normalized.y * Math.abs(velocity.y) * bounceDamper;
        velocity.x = normalized.x * dotSpeed;
        velocity.y = normalized.y * dotSpeed;

        velocity.x *= bounceDamper;
        velocity.y *= bounceDamper;
      }
    }

    // bounce off walls
    if (position.x - radius < 0) {
      velocity.x = Math.abs(velocity.x);
    } else if (position.x + radius > dotsAreaCanvas.width)
      velocity.x = -Math.abs(velocity.x);

    if (position.y - radius < 0) {
      velocity.y = Math.abs(velocity.y);
    } else if (position.y + radius > dotsAreaCanvas.height)
      velocity.y = -Math.abs(velocity.y);

    value.velocity = velocity;
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

function getApproximatePixelColor(xPercent, yPercent, imageData) {
  const x = Math.floor(xPercent * imageData.width);
  const y = Math.floor(yPercent * imageData.height);
  const index = (y * imageData.width + x) * 4;
  const red = imageData.data[index];
  const green = imageData.data[index + 1];
  const blue = imageData.data[index + 2];
  const alpha = imageData.data[index + 3];
  return { red, green, blue, alpha };
}

function getPixelValue(xPercent, yPercent, imageData) {
  const x = Math.floor(xPercent * imageData.width);
  const y = Math.floor(yPercent * imageData.height);
  const index = (y * imageData.width + x) * 4;

  // return value 0 1
  return imageData.data[index] / 255;
}

function NormalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  return {
    x: x / length,
    y: y / length,
  };
}

function VectorMagnitude(x, y) {
  return Math.sqrt(x * x + y * y);
}

function createGrid() {
  for (let i = 0; i < dotsAreaCanvas.width / CELL_SIZE; i++) {
    for (let j = 0; j < dotsAreaCanvas.height / CELL_SIZE; j++) {
      grid[`${i},${j}`] = [];
    }
  }

  console.log(grid);
}

function getDotsInNeighboringCells(dot) {
  const { gridPosition } = dot;
  const neighboringCells = [
    `${gridPosition.x},${gridPosition.y}`,
    `${gridPosition.x},${gridPosition.y - 1}`,
    `${gridPosition.x},${gridPosition.y + 1}`,
    `${gridPosition.x - 1},${gridPosition.y}`,
    `${gridPosition.x - 1},${gridPosition.y - 1}`,
    `${gridPosition.x - 1},${gridPosition.y + 1}`,
    `${gridPosition.x + 1},${gridPosition.y}`,
    `${gridPosition.x + 1},${gridPosition.y - 1}`,
    `${gridPosition.x + 1},${gridPosition.y + 1}`,
  ];

  const dotsInNeighboringCells = [];

  for (const cell of neighboringCells) {
    const dotsInCell = grid[cell] ?? [];
    dotsInNeighboringCells.push(...dotsInCell);
  }

  return dotsInNeighboringCells;
}
