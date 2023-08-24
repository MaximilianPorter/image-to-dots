// import Dot.js
import Dot from "./Dot.js";
import {
  Clamp,
  NormalizeVector,
  VectorMagnitude,
  Lerp,
  drawCircle,
} from "./helper.js";
import { createGrid } from "./grid.js";
import {
  getApproximatePixelColor,
  getPixelValue,
  getAveragePixelValue,
  getDarkestValueInImage,
} from "./imageFunctions.js";

const input_img_element = document.getElementById("input-image");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaCanvas = document.getElementById("dots-area");
const dotsAreaCanvasContext = dotsAreaCanvas.getContext("2d");

let uploadedImageData;
const CELL_SIZE = 10;
let grid = {};
let darkestPixelValue = 1;

const dotDictionary = {};
const dotsToAdd = 5000;
const dotSpeed = 0.5;
const maxDotRadius = 10;
const minDotRadius = 1;
const bounceDamper = 0.7; // 0-1 how much to dampen the bounce .1 = 90% of velocity is lost
const acceleration = 0.1; // 0-1 how fast the dot accelerates back to normal speed
const radiusChangeRate = 0.1; // 0-1 how fast the radius changes
const darknessRespawnThreshold = 0.05; // 0-1 what percentage of the radius to respawn at
const bounceOffForce = 0.4; // 0-1 how much force to bounce off other dots
const colored = false;

input_img_element.addEventListener("change", (e) => {
  createReader(e.target.files[0], function () {
    // Loop through each pixel
    uploadedImageData = canvasContext.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    let data = uploadedImageData.data; // pixel data in a one-dimensional array

    darkestPixelValue = getDarkestValueInImage(uploadedImageData);

    // data = greyscaleData(data);
    canvasContext.putImageData(uploadedImageData, 0, 0);
    addDots();
    moveDots();
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

function greyscaleData(data) {
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
  return data;
}

// DOT STUFF ------------------------------

function addDots() {
  grid = createGrid(dotsAreaCanvas.width, dotsAreaCanvas.height, CELL_SIZE);
  for (let i = 0; i < dotsToAdd; i++) {
    const pos = {
      x: Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.width,
      y: Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.height,
    };

    // random normalized move dir
    const moveDirection = NormalizeVector(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );

    const dotObject = new Dot(
      i,
      moveDirection,
      dotSpeed,
      pos,
      minDotRadius,
      (maxDotRadius + minDotRadius) * 0.9,
      CELL_SIZE
    );

    const gridKey = `${dotObject.gridPosition.x},${dotObject.gridPosition.y}`;
    grid[gridKey].push(dotObject);

    dotDictionary[i] = dotObject;
  }
}

let lastTimeUpdate = performance.now();

// move dots every frame
async function moveDots() {
  if (Object.keys(dotDictionary).length === 0) return;

  for (const [key, dot] of Object.entries(dotDictionary)) {
    dot.updatePosition();
    UpdateGridPosition(dot);

    UpdateDotRadius(dot);
    HandleDotCollision(dot);
  }
  requestAnimationFrame(moveDots);
}
moveDots();

let drawIterator = 0;
async function DrawDotsOnCanvas() {
  // console.log(`time update ${performance.now() - lastTimeUpdate}`);
  // lastTimeUpdate = performance.now();

  // clear canvas
  dotsAreaCanvasContext.clearRect(
    0,
    0,
    dotsAreaCanvas.width,
    dotsAreaCanvas.height
  );

  Object.entries(dotDictionary).forEach(([key, dot], i) => {
    DrawDot(dot);
  });

  drawIterator++;
  setTimeout(DrawDotsOnCanvas, 1000 / 24); // 24 fps
}
DrawDotsOnCanvas();

async function DrawDot(dot) {
  const { position, radius } = dot;
  const positionPercent = {
    x: position.x / dotsAreaCanvas.width,
    y: position.y / dotsAreaCanvas.height,
  };
  const apColor = getApproximatePixelColor(
    positionPercent.x,
    positionPercent.y,
    uploadedImageData
  );

  const colorString = `rgba(${apColor.red}, ${apColor.green}, ${apColor.blue}, ${apColor.alpha})`;

  drawCircle(
    dotsAreaCanvasContext,
    position.x,
    position.y,
    radius,
    colored ? colorString : "white",
    null,
    2
  );
}
function DrawDebug(dot) {
  const { position, collisionRadius } = dot;
  drawCircle(
    dotsAreaCanvasContext,
    position.x,
    position.y,
    collisionRadius,
    null,
    "green",
    2
  );
}

function MoveDotToOtherEdge(dot) {
  if (dot.position.y < 0) {
    dot.position.y = dotsAreaCanvas.height;
  } else if (dot.position.y > dotsAreaCanvas.height) {
    dot.position.y = 0;
  }
  if (dot.position.x < 0) {
    dot.position.x = dotsAreaCanvas.width;
  } else if (dot.position.x > dotsAreaCanvas.width) {
    dot.position.x = 0;
  }
}

function UpdateGridPosition(dot) {
  const { gridPosition } = dot;
  const lastGridPosition = { ...gridPosition };
  dot.updateGridPosition();
  const newGridPosition = { ...gridPosition };

  // if the dot has moved to a new grid position
  if (
    lastGridPosition.x !== newGridPosition.x ||
    lastGridPosition.y !== newGridPosition.y
  ) {
    // remove dot from old grid position
    const oldGridKey = `${lastGridPosition.x},${lastGridPosition.y}`;
    const oldGridArray = grid[oldGridKey];
    const index = oldGridArray.findIndex((dot) => dot.id === dot.id);
    oldGridArray.splice(index, 1);

    // add dot to new grid position
    const newGridKey = `${newGridPosition.x},${newGridPosition.y}`;
    grid[newGridKey]?.push(dot) ?? (grid[newGridKey] = [dot]);
  }
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

function UpdateDotRadius(dot) {
  const { position, radius } = dot;
  const positionPercent = {
    x: position.x / dotsAreaCanvas.width,
    y: position.y / dotsAreaCanvas.height,
  };
  const pixelValue = getPixelValue(
    positionPercent.x,
    positionPercent.y,
    uploadedImageData
  );

  if (!pixelValue) return;

  const desiredRadius = Lerp(minDotRadius, maxDotRadius, pixelValue);
  dot.radius += (desiredRadius - radius) * radiusChangeRate;

  const smallestRadiusForRespawn = Lerp(
    darkestPixelValue,
    1,
    darknessRespawnThreshold
  );

  // if (dot.radius < Lerp(minDotRadius, maxDotRadius, smallestRadiusForRespawn)) {
  //   respawnDot(dot);
  // }
}

function HandleDotCollision(dot) {
  MoveDotToOtherEdge(dot);
}

function randomPointOnOppoSideOfImage(xPercent, yPercent) {
  let x2,
    y2 = 0;
  if (xPercent < 0.5) {
    x2 = Math.random(0.5, 1) * dotsAreaCanvas.width;
  } else {
    x2 = Math.random(0, 0.5) * dotsAreaCanvas.width;
  }

  if (yPercent < 0.5) {
    y2 = Math.random(0.5, 1) * dotsAreaCanvas.height;
  } else {
    y2 = Math.random(0, 0.5) * dotsAreaCanvas.height;
  }

  return { x: x2, y: y2 };
}

function respawnDot(dot) {
  for (let i = 0; i < 100; i++) {
    const randomPos = {
      x: Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.width,
      y: Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.height,
    };
    const randomPosPercent = {
      x: randomPos.x / dotsAreaCanvas.width,
      y: randomPos.y / dotsAreaCanvas.height,
    };

    const pixelValue = getPixelValue(
      randomPosPercent.x,
      randomPosPercent.y,
      uploadedImageData
    );

    if (pixelValue > (darkestPixelValue + 1) * 0.6) {
      dot.position = randomPos;
      dot.radius = minDotRadius;
      // dot.collisionRadius = minDotRadius;
      dot.desiredPosition = randomPointOnOppoSideOfImage(
        randomPosPercent.x,
        randomPosPercent.y
      );
      break;
    }
  }
}
