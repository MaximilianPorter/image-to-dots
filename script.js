// import Dot.js
import Dot from "./Dot.js";
import {
  Clamp,
  NormalizeVector,
  VectorMagnitude,
  VectorDirection,
  DotProduct,
  Lerp,
  drawCircle,
  drawLine,
} from "./helper.js";
import { createGrid } from "./grid.js";
import {
  getApproximatePixelColor,
  getPixelValue,
  getAveragePixelValue,
  getDarkestValueInImage,
} from "./imageFunctions.js";
import * as valueSettings from "./settings.js";

const input_img_element = document.getElementById("input-image");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaCanvas = document.getElementById("dots-area");
const dotsAreaCanvasContext = dotsAreaCanvas.getContext("2d");

let uploadedImageData;
let grid = {};
let darkestPixelValue = 1;

const dotDictionary = {};
const {
  CELL_SIZE,
  dotsToAdd,
  dotSpeed,
  minDotRadius,
  maxDotRadius,
  radiusChangeRate,
  steeringStrength,
  decelleration,
  minSpeedPercentage,
  colored,
  darknessRespawnThreshold,
  debugDetectionRadius,
  centeringFactor,
  alignmentFactor,
  separationFactor,
  visionDotProductThreshold,
  slowDotProductThreshold,
} = valueSettings.moreDotsSettings;

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
let sdfsdf = 0;
function addDots() {
  grid = createGrid(dotsAreaCanvas.width, dotsAreaCanvas.height, CELL_SIZE);
  for (let i = 0; i < dotsToAdd; i++) {
    const pos = [
      Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.width,
      Lerp(0.1, 0.9, Math.random()) * dotsAreaCanvas.height,
    ];

    // random normalized move dir
    const moveDirection = NormalizeVector([
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ]);

    const dotObject = new Dot(
      i,
      moveDirection,
      dotSpeed,
      pos,
      minDotRadius,
      debugDetectionRadius,
      maxDotRadius / 2,
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

function DrawDot(dot) {
  UpdateGridPosition(dot);
  const { position, radius } = dot;
  const positionPercent = {
    x: position[0] / dotsAreaCanvas.width,
    y: position[1] / dotsAreaCanvas.height,
  };
  const apColor = getApproximatePixelColor(
    positionPercent.x,
    positionPercent.y,
    uploadedImageData
  );

  const colorString = `rgba(${apColor.red}, ${apColor.green}, ${apColor.blue}, ${apColor.alpha})`;

  // draw first dot red
  const dotColor = dot.id === 0 ? "red" : "white";

  drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    radius,
    colored ? colorString : dotColor,
    null,
    2
  );

  if (dot.id === 0) DrawDebug(dot);
}
function DrawDebug(dot) {
  const { position, detectionRadius, collisionRadius } = dot;
  const outlineColor = dot.id === 0 ? "red" : "green";
  drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    detectionRadius,
    null,
    outlineColor,
    1
  );

  drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    collisionRadius,
    null,
    outlineColor,
    1
  );

  drawLine(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    position[0] + dot.moveDirection[0] * 10,
    position[1] + dot.moveDirection[1] * 10,
    outlineColor,
    2
  );

  if (dot.id === 0) {
    // draw box around dot covering all the cells
    const { gridPosition } = dot;
    const cellSize = CELL_SIZE;
    const x = gridPosition.x * cellSize;
    const y = gridPosition.y * cellSize;
    drawLine(dotsAreaCanvasContext, x, y, x + cellSize, y, "red", 2);
    drawLine(dotsAreaCanvasContext, x, y, x, y + cellSize, "red", 2);
    drawLine(
      dotsAreaCanvasContext,
      x + cellSize,
      y,
      x + cellSize,
      y + cellSize,
      "red",
      2
    );
    drawLine(
      dotsAreaCanvasContext,
      x,
      y + cellSize,
      x + cellSize,
      y + cellSize,
      "red",
      2
    );

    // draw grid cells around dot
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

    neighboringCells.forEach((cell) => {
      const [x, y] = cell.split(",").map((num) => num * cellSize);
      drawLine(dotsAreaCanvasContext, x, y, x + cellSize, y, "blue", 1);
      drawLine(dotsAreaCanvasContext, x, y, x, y + cellSize, "blue", 1);
      drawLine(
        dotsAreaCanvasContext,
        x + cellSize,
        y,
        x + cellSize,
        y + cellSize,
        "blue",
        1
      );
      drawLine(
        dotsAreaCanvasContext,
        x,
        y + cellSize,
        x + cellSize,
        y + cellSize,
        "blue",
        1
      );
    });

    // draw dots in neighboring cells
    const dotsInNeighboringCells = getDotsInNeighboringCells(dot);
    dotsInNeighboringCells.forEach((otherDot) => {
      const { position: otherPosition } = otherDot;
      drawCircle(
        dotsAreaCanvasContext,
        otherPosition[0],
        otherPosition[1],
        5,
        "red",
        null,
        2
      );
    });
  }
}

function MoveDotToOtherEdge(dot) {
  if (dot.position[1] < 0) {
    dot.position[1] = dotsAreaCanvas.height;
  } else if (dot.position[1] > dotsAreaCanvas.height) {
    dot.position[1] = 0;
  }
  if (dot.position[0] < 0) {
    dot.position[0] = dotsAreaCanvas.width;
  } else if (dot.position[0] > dotsAreaCanvas.width) {
    dot.position[0] = 0;
  }
}

function UpdateGridPosition(dot) {
  const changedCell = dot.updateGridPosition();
  // if (dot.id === 0) console.log(dot.lastGridPosition);

  // if the dot has moved to a new grid position
  if (changedCell) {
    const { gridPosition, lastGridPosition } = dot;
    // remove dot from old grid position
    const oldGridKey = `${lastGridPosition.x},${lastGridPosition.y}`;
    const oldGrid = grid[oldGridKey];
    const index = oldGrid.findIndex((dot) => dot.id === dot.id);
    oldGrid.splice(index, 1);

    // add dot to new grid position
    const newGridKey = `${gridPosition.x},${gridPosition.y}`;
    grid[newGridKey].push(dot);
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

  for (let i = 0; i < neighboringCells.length; i++) {
    if (grid[neighboringCells[i]] === undefined) continue;
    const cell = neighboringCells[i];
    const cellDots = grid[cell];
    cellDots.forEach((dot) => {
      dotsInNeighboringCells.push(dot);
    });
  }

  return dotsInNeighboringCells;
}

function UpdateDotRadius(dot) {
  const { position, radius } = dot;
  const positionPercent = {
    x: position[0] / dotsAreaCanvas.width,
    y: position[1] / dotsAreaCanvas.height,
  };
  const pixelValue = getPixelValue(
    positionPercent.x,
    positionPercent.y,
    uploadedImageData
  );

  if (!pixelValue) return;

  const desiredRadius = Lerp(minDotRadius, maxDotRadius, pixelValue);
  dot.radius += (desiredRadius - radius) * radiusChangeRate;

  dot.detectionRadius = dot.radius + CELL_SIZE * (dot.moveSpeed / dotSpeed);
  dot.collisionRadius = dot.detectionRadius / 2;

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
  const dotsInNeighboringCells = getDotsInNeighboringCells(dot);
  // const dotsInNeighboringCells = Object.values(dotDictionary);
  const direction = SteerDirection(dot, dotsInNeighboringCells);
  dot.moveDirection = NormalizeVector(
    dot.moveDirection.map((dir, i) => dir + direction[i] * steeringStrength)
  );

  MoveDotToOtherEdge(dot);
}

function SteerDirection(dot, otherDots) {
  const { moveDirection, detectionRadius, collisionRadius } = dot;
  let direction = [0, 0];
  let xposAvg = 0;
  let yposAvg = 0;
  let dotsVisible = 0;
  for (const otherDot of otherDots) {
    if (otherDot.id === dot.id) continue;

    // // turn away from edges
    // direction = TurnAwayFromEdges(dot, direction);

    const dotsVector = VectorDirection(dot.position, otherDot.position);
    const distance = VectorMagnitude(dotsVector);

    if (distance > detectionRadius) continue;

    // check dot product between moveDirection and vector between dots
    const dotProduct = DotProduct(moveDirection, dotsVector);

    const inVisionCone = dotProduct > visionDotProductThreshold;
    if (!inVisionCone) continue;

    // average position of other dots
    xposAvg += otherDot.position[0];
    yposAvg += otherDot.position[1];
    dotsVisible++;

    // slow down if close to other dot
    if (distance <= detectionRadius && dotProduct > slowDotProductThreshold) {
      dot.moveSpeed = Clamp(
        dot.moveSpeed - decelleration * Lerp(1, 0, distance / detectionRadius),
        dotSpeed * minSpeedPercentage,
        dotSpeed
      );
    }

    if (dot.id === 0) {
      DebugDrawLinePositions(dot.position, otherDot.position);
    }

    // turn away from other dot
    const ratio = 1 - Clamp(distance / detectionRadius, 0, 1);
    direction = direction.map(
      (dir, i) => dir - dotsVector[i] * ratio * separationFactor
    );

    // align with other dot
    direction = direction.map(
      (dir, i) => dir + otherDot.moveDirection[i] * alignmentFactor
    );
  }

  if (dotsVisible > 0) {
    xposAvg /= dotsVisible;
    yposAvg /= dotsVisible;

    const desiredDirection = VectorDirection(dot.position, [xposAvg, yposAvg]);
    direction = direction.map(
      (dir, i) => dir + desiredDirection[i] * centeringFactor
    );

    if (dot.id === 0) {
      drawCircle(dotsAreaCanvasContext, xposAvg, yposAvg, 5, "yellow", null, 2);
    }
  }

  return direction;
}

function TurnAwayFromEdges(dot, direction) {
  const topEdgeVector = [dot.position[0], 0];
  const bottomEdgeVector = [dot.position[0], dotsAreaCanvas.height];
  const leftEdgeVector = [0, dot.position[1]];
  const rightEdgeVector = [dotsAreaCanvas.width, dot.position[1]];

  const closestEdgeVector = [
    topEdgeVector,
    bottomEdgeVector,
    leftEdgeVector,
    rightEdgeVector,
  ].reduce((prev, curr) => {
    const prevDistance = VectorMagnitude(VectorDirection(dot.position, prev));
    const currDistance = VectorMagnitude(VectorDirection(dot.position, curr));
    return prevDistance < currDistance ? prev : curr;
  });

  // check if dot is close to edge
  const edgeDistance = VectorMagnitude(
    VectorDirection(dot.position, closestEdgeVector)
  );
  if (edgeDistance < dot.detectionRadius) {
    const edgeVector = VectorDirection(dot.position, closestEdgeVector);
    direction = direction.map(
      (dir, i) => dir + edgeVector[i] * 0.8 * (1 - edgeDistance / dot.radius)
    );
    if (dot.id === 0) {
      drawLine(
        dotsAreaCanvasContext,
        dot.position[0],
        dot.position[1],
        closestEdgeVector[0],
        closestEdgeVector[1],
        "green",
        2
      );
    }
  }

  return direction;
}

function DebugDrawLinePositions(pos1, pos2) {
  drawLine(
    dotsAreaCanvasContext,
    pos1[0],
    pos1[1],
    pos2[0],
    pos2[1],
    "blue",
    2
  );
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
      dot.desiredPosition = randomPointOnOppoSideOfImage(
        randomPosPercent.x,
        randomPosPercent.y
      );
      break;
    }
  }
}
