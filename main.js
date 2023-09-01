// import Dot.js
import Dot from "./Dot.js";
import * as help from "./helper.js";
import { createGrid, getNeighboringCells } from "./grid.js";
import {
  getApproximatePixelColor,
  getPixelValue,
  getAveragePixelValue,
  getDarkestValueInImage,
  getLightestValueInImage,
} from "./imageFunctions.js";
import * as valueSettings from "./settings.js";
import * as dotBezier from "./dotSizeBezier.js";
import "./settingsSection.js";
import "./handleSliderBehaviour.js";
import { mousePosOnCanvas, scale } from "./zoomInHandler.js";

const input_img_element = document.getElementById("input-image");
const input_img_label = document.getElementById("input-image-label");
const saveImageButton = document.querySelector(".save-image-button");
const saveButtonDetailsArea = document.querySelector(".save-button-details");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaCanvas = document.getElementById("dots-area");
const dotsAreaCanvasContext = dotsAreaCanvas.getContext("2d");

const dotsAreaSection = document.querySelector(".dots-area-section");

const fpsSlider = document.getElementById("fps-slider");
const minDotSizeSlider = document.getElementById("min-dot-size-slider");
const maxDotSizeSlider = document.getElementById("max-dot-size-slider");
const radiusChangeSlider = document.getElementById("radius-change-slider");

const steeringSlider = document.getElementById("steering-slider");
const separationSlider = document.getElementById("separation-slider");
const alignmentSlider = document.getElementById("alignment-slider");
const centeringSlider = document.getElementById("centering-slider");

const moveSpeedSlider = document.getElementById("move-speed-slider");
const slowSpeedSlider = document.getElementById("slow-speed-slider");

// settings elements
const isColored_element = document.getElementById("IsColoredCheck");
const debugCheckbox = document.getElementById("debug-checkbox");
const gridSizeSlider = document.getElementById("grid-size-slider");
const dotCountSlider = document.getElementById("dot-count-slider");

let uploadedImageData;
let grid = {};
let darkestPixelValue = 1;
let brightestPixelValue = 0;

let dotDictionary = {};
const {
  collisionRadiusMultiplier,
  decelleration,
  minSpeedPercentage,
  debugDetectionRadius,
  turnTowardsLightFactor,
  steerFromMouseFactor,
  visionDotProductThreshold,
  slowDotProductThreshold,
} = valueSettings.currentSettings;

// stuff you can change with ui
let {
  isDrawingDebug,
  CELL_SIZE,
  dotsToAdd,
  colored,
  dotSpeed,
  minDotRadius,
  maxDotRadius,
  radiusChangeRate,
  steeringStrength,
  centeringFactor,
  alignmentFactor,
  separationFactor,
  slownessFactor,
} = valueSettings.currentSettings;

debugCheckbox.checked = isDrawingDebug;

steeringSlider.dataset.value = steeringStrength;
separationSlider.dataset.value = separationFactor;
alignmentSlider.dataset.value = alignmentFactor;
centeringSlider.dataset.value = centeringFactor;

minDotSizeSlider.dataset.value = minDotRadius;
maxDotSizeSlider.dataset.value = maxDotRadius;
radiusChangeSlider.dataset.value = radiusChangeRate;

moveSpeedSlider.dataset.value = dotSpeed;
slowSpeedSlider.dataset.value = slownessFactor;

gridSizeSlider.dataset.value = CELL_SIZE;
dotCountSlider.dataset.value = dotsToAdd;

input_img_element.addEventListener("change", (e) => {
  if (e.target.files.length === 0) return;
  dotDictionary = {};
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
    brightestPixelValue = getLightestValueInImage(uploadedImageData);
    console.log(`darkestPixelValue: ${darkestPixelValue}, 
    brightestPixelValue: ${brightestPixelValue}`);

    // data = greyscaleData(data);
    canvasContext.putImageData(uploadedImageData, 0, 0);
    addDots();
    moveDots();
  });
});

saveImageButton.addEventListener("click", (e) => {
  e.preventDefault();

  const hasBackground = !document.getElementById("alpha-background-checkbox")
    .checked;
  if (hasBackground) {
    DrawDotsOnCanvas("black");
  }

  const link = document.createElement("a");
  link.download = "image.png";
  link.href = dotsAreaCanvas.toDataURL();
  link.click();
  link.remove();
});

minDotSizeSlider.addEventListener("input", (e) => {
  minDotRadius = parseFloat(minDotSizeSlider.dataset.value);
});
maxDotSizeSlider.addEventListener("input", (e) => {
  maxDotRadius = parseFloat(maxDotSizeSlider.dataset.value);
});
radiusChangeSlider.addEventListener("input", (e) => {
  radiusChangeRate = parseFloat(radiusChangeSlider.dataset.value);
});
steeringSlider.addEventListener("input", (e) => {
  steeringStrength = parseFloat(steeringSlider.dataset.value);
});
separationSlider.addEventListener("input", (e) => {
  separationFactor = parseFloat(separationSlider.dataset.value);
});
alignmentSlider.addEventListener("input", (e) => {
  alignmentFactor = parseFloat(alignmentSlider.dataset.value);
});
centeringSlider.addEventListener("input", (e) => {
  centeringFactor = parseFloat(centeringSlider.dataset.value);
});
moveSpeedSlider.addEventListener("input", (e) => {
  dotSpeed = parseFloat(moveSpeedSlider.dataset.value);
  for (const [key, dot] of Object.entries(dotDictionary)) {
    dot.startMoveSpeed = dotSpeed;
    dot.moveSpeed = dotSpeed;
  }
});
slowSpeedSlider.addEventListener("input", (e) => {
  slownessFactor = slowSpeedSlider.dataset.value;
});
gridSizeSlider.addEventListener("change", (e) => {
  CELL_SIZE = parseInt(e.target.dataset.value);
  ResetGrid();
});

dotCountSlider.addEventListener("change", (e) => {
  dotsToAdd = parseInt(e.target.dataset.value);
  if (Object.keys(dotDictionary).length <= 0) return;
  if (dotsToAdd < Object.keys(dotDictionary).length) {
    for (const [key, dot] of Object.entries(dotDictionary)) {
      if (dot.id >= dotsToAdd) {
        delete dotDictionary[key];
      }
    }
  } else if (dotsToAdd > Object.keys(dotDictionary).length) {
    for (let i = Object.keys(dotDictionary).length; i < dotsToAdd; i++) {
      addDotAtRandomPos(i);
    }
  }
  ResetGrid();
});

isColored_element.addEventListener("change", (e) => {
  colored = isColored_element.checked;
});
debugCheckbox.addEventListener("change", (e) => {
  isDrawingDebug = e.target.checked;
});

let canvasMousePosition = null;
let draggingMouse = false;
dotsAreaCanvas.addEventListener("mousedown", (e) => {
  if (e.button === 1) return;
  draggingMouse = true;
});
dotsAreaCanvas.addEventListener("mousemove", (e) => {
  if (!draggingMouse) return;
  // const rect = dotsAreaCanvas.getBoundingClientRect();
  // const x = e.clientX - rect.left;
  // const y = e.clientY - rect.top;
  // const percent = {
  //   x: x / rect.width,
  //   y: y / rect.height,
  // };
  // canvasMousePosition = [
  //   percent.x * dotsAreaCanvas.width,
  //   percent.y * dotsAreaCanvas.height,
  // ];
  canvasMousePosition = [mousePosOnCanvas.x, mousePosOnCanvas.y];
  // console.log(canvasMousePosition);
  help.drawCircle(
    dotsAreaCanvasContext,
    canvasMousePosition.x,
    canvasMousePosition.y,
    5,
    "red",
    null,
    2
  );
});
document.addEventListener("mouseup", (e) => {
  draggingMouse = false;
  canvasMousePosition = null;
});

let lastTimeUpdate = performance.now();
function measureApproximateFPS() {
  const now = performance.now();
  const delta = now - lastTimeUpdate;
  lastTimeUpdate = now;
  const fps = 1000 / delta;
  console.log(`fps: ${fps}`);

  requestAnimationFrame(measureApproximateFPS);
}
// measureApproximateFPS();

function createReader(file, whenReady) {
  const reader = new FileReader();
  reader.onload = function (evt) {
    const image = new Image();
    image.onload = function (evt) {
      canvas.width = image.width;
      canvas.height = image.height;

      // match aspect ratio of canvas
      const setCanvasWidth = 1518;
      dotsAreaCanvas.width = setCanvasWidth;
      dotsAreaCanvas.height = (setCanvasWidth / canvas.width) * canvas.height;
      dotsAreaCanvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
      dotsAreaCanvas.classList.add("dots-area-uploaded");
      input_img_label.classList.add("image-uploaded");
      saveButtonDetailsArea.classList.remove("hidden");

      canvasContext.drawImage(image, 0, 0);

      if (whenReady) whenReady();
    };
    image.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

document.addEventListener("keydown", (e) => {
  // key is f
  if (e.keyCode === 70) {
    dotsAreaSection.classList.add("dots-area-focused");
    dotsAreaSection.requestFullscreen();
  }
});

// on fullscreen exit
document.addEventListener("fullscreenchange", (e) => {
  if (!document.fullscreenElement) {
    dotsAreaSection.classList.remove("dots-area-focused");
  }
});

// DOT STUFF ------------------------------
function addDots() {
  grid = createGrid(dotsAreaCanvas.width, dotsAreaCanvas.height, CELL_SIZE);
  for (let i = 0; i < dotsToAdd; i++) {
    addDotAtRandomPos(i);
  }
}

function addDotAtRandomPos(id) {
  const spawnPercentFromEdgeX = 0.1;
  const spawnPercentFromEdgeY = 0.1;
  const pos = [
    help.Lerp(spawnPercentFromEdgeX, 1 - spawnPercentFromEdgeX, Math.random()) *
      dotsAreaCanvas.width,
    help.Lerp(spawnPercentFromEdgeY, 1 - spawnPercentFromEdgeY, Math.random()) *
      dotsAreaCanvas.height,
  ];

  // random normalized move dir
  const moveDirection = help.NormalizeVector([
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ]);

  const dotObject = new Dot(
    id,
    moveDirection,
    dotSpeed,
    pos,
    minDotRadius,
    debugDetectionRadius,
    maxDotRadius / 2,
    CELL_SIZE
  );

  dotObject.moveDotFunction = moveDot.bind(null, dotObject);

  const gridKey = `${dotObject.gridPosition.x},${dotObject.gridPosition.y}`;
  grid[gridKey].push(dotObject);

  dotDictionary[id] = dotObject;

  return dotObject;
}

// move dots every frame
function moveDots() {
  if (Object.keys(dotDictionary).length === 0) return;

  Object.values(dotDictionary).forEach((dot) => moveDot(dot));

  setTimeout(moveDots, 1000 / 60); // flat 60 fps
}
moveDots();

function moveDot(dot) {
  // console.log(dot.id);
  dot.updatePosition();
  UpdateDotRadius(dot);
  HandleDotCollision(dot);
}

function DrawDotsOnCanvas(backgroundColor = null) {
  // console.log(`time update ${performance.now() - lastTimeUpdate}`);
  // lastTimeUpdate = performance.now();

  if (backgroundColor) {
    dotsAreaCanvasContext.fillStyle = backgroundColor;
    dotsAreaCanvasContext.fillRect(
      0,
      0,
      dotsAreaCanvas.width,
      dotsAreaCanvas.height
    );
  } else {
    dotsAreaCanvasContext.clearRect(
      0,
      0,
      dotsAreaCanvas.width,
      dotsAreaCanvas.height
    );
  }

  const dotsSortedByRadius = Object.values(dotDictionary).sort(
    (a, b) => a.radius - b.radius
  );

  // run draw dot on each dot in a promise
  dotsSortedByRadius.forEach((dot) => DrawDot(dot));

  DrawDebugGrid();

  setTimeout(DrawDotsOnCanvas, 1000 / parseInt(fpsSlider.dataset.value)); // 24 fps
}
DrawDotsOnCanvas();

function DrawDot(dot) {
  UpdateGridPosition(dot);
  const { position, radius } = dot;

  SetColorOfDot(dot);
  dot.updateColor();

  const colorString = `rgb(${dot.color.r}, ${dot.color.g}, ${dot.color.b})`;
  // const colorString = dot.color;

  // draw first dot red
  const dotColor = dot.id === 0 && isDrawingDebug ? "red" : colorString;

  help.drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    radius,
    dotColor,
    null,
    2
  );

  if (dot.id === 0 && isDrawingDebug) DrawDebug(dot);
}
function SetColorOfDot(dot) {
  const { position } = dot;
  const positionPercent = {
    x: help.Clamp(position[0] / dotsAreaCanvas.width, 0.0001, 0.9999),
    y: help.Clamp(position[1] / dotsAreaCanvas.height, 0.0001, 0.9999),
  };

  let colorToDraw = {
    red: 255,
    green: 255,
    blue: 255,
  };
  if (colored) {
    colorToDraw = getApproximatePixelColor(
      positionPercent.x,
      positionPercent.y,
      uploadedImageData
    );
  }
  dot.desiredColor = {
    r: colorToDraw.red,
    g: colorToDraw.green,
    b: colorToDraw.blue,
  };
}
function DrawDebugGrid() {
  if (!isDrawingDebug) return;
  const cellSize = CELL_SIZE;
  const color = "rgba(255, 255, 255, 0.2)";
  for (let x = 0; x < dotsAreaCanvas.width; x += cellSize) {
    help.drawLine(
      dotsAreaCanvasContext,
      x,
      0,
      x,
      dotsAreaCanvas.height,
      color,
      3
    );
  }
  for (let y = 0; y < dotsAreaCanvas.height; y += cellSize) {
    help.drawLine(
      dotsAreaCanvasContext,
      0,
      y,
      dotsAreaCanvas.width,
      y,
      color,
      3
    );
  }
}
function DrawDebug(dot) {
  if (!isDrawingDebug) return;
  const { position, detectionRadius, collisionRadius } = dot;
  const outlineColor = dot.id === 0 ? "red" : "green";
  help.drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    detectionRadius,
    null,
    outlineColor,
    1
  );

  help.drawCircle(
    dotsAreaCanvasContext,
    position[0],
    position[1],
    collisionRadius,
    null,
    outlineColor,
    1
  );

  help.drawLine(
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
    help.drawLine(dotsAreaCanvasContext, x, y, x + cellSize, y, "red", 2);
    help.drawLine(dotsAreaCanvasContext, x, y, x, y + cellSize, "red", 2);
    help.drawLine(
      dotsAreaCanvasContext,
      x + cellSize,
      y,
      x + cellSize,
      y + cellSize,
      "red",
      2
    );
    help.drawLine(
      dotsAreaCanvasContext,
      x,
      y + cellSize,
      x + cellSize,
      y + cellSize,
      "red",
      2
    );

    // draw grid cells around dot
    const neighboringCells = getNeighboringCells(
      grid,
      gridPosition,
      cellSize,
      dotsAreaCanvas
    );

    neighboringCells.forEach((cell) => {
      const [x, y] = cell.split(",").map((num) => num * cellSize);
      help.drawLine(dotsAreaCanvasContext, x, y, x + cellSize, y, "blue", 1);
      help.drawLine(dotsAreaCanvasContext, x, y, x, y + cellSize, "blue", 1);
      help.drawLine(
        dotsAreaCanvasContext,
        x + cellSize,
        y,
        x + cellSize,
        y + cellSize,
        "blue",
        1
      );
      help.drawLine(
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
    const dotsInNeighboringCells = GetDotsInNeighboringCells(dot);
    dotsInNeighboringCells.forEach((otherDot) => {
      const { position: otherPosition } = otherDot;
      help.drawCircle(
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
  if (dot.position[1] < 0 - dot.radius) {
    dot.position[1] = dotsAreaCanvas.height + dot.radius;
  } else if (dot.position[1] > dotsAreaCanvas.height + dot.radius) {
    dot.position[1] = 0 - dot.radius;
  }
  if (dot.position[0] < 0 - dot.radius) {
    dot.position[0] = dotsAreaCanvas.width + dot.radius;
  } else if (dot.position[0] > dotsAreaCanvas.width + dot.radius) {
    dot.position[0] = 0 - dot.radius;
  }
}

function ResetGrid() {
  grid = createGrid(dotsAreaCanvas.width, dotsAreaCanvas.height, CELL_SIZE);
  for (const [key, dot] of Object.entries(dotDictionary)) {
    dot.cellSize = CELL_SIZE;
    dot.gridPosition = { x: 0, y: 0 };
    UpdateGridPosition(dot);
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
    if (oldGrid) {
      const index = oldGrid.findIndex((dot) => dot.id === dot.id);
      oldGrid.splice(index, 1);
    }

    // add dot to new grid position
    const newGridKey = `${gridPosition.x},${gridPosition.y}`;
    grid[newGridKey]?.push(dot);
  }
}

function GetDotsInNeighboringCells(dot) {
  const { gridPosition } = dot;
  const neighboringCells = getNeighboringCells(
    grid,
    gridPosition,
    CELL_SIZE,
    dotsAreaCanvas
  );

  const dotsInNeighboringCells = [];

  for (let i = 0; i < neighboringCells.length; i++) {
    if (grid[neighboringCells[i]] === undefined) {
      // console.log("why is this undefined?");
      continue;
    }
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
    x: help.Clamp(position[0] / dotsAreaCanvas.width, 0.0001, 0.9999),
    y: help.Clamp(position[1] / dotsAreaCanvas.height, 0.0001, 0.9999),
  };
  const pixelValue = getPixelValue(
    positionPercent.x,
    positionPercent.y,
    uploadedImageData
  );

  if (!pixelValue) return;

  // 0 - darkestPixelValue
  // 1 - brightestPixelValue
  const valueRange = brightestPixelValue - darkestPixelValue;
  const relativeValue = (pixelValue - darkestPixelValue) / valueRange;

  const desiredRadius = help.Lerp(
    minDotRadius,
    maxDotRadius,
    dotBezier.GetDotSizeBezierCurve(relativeValue)[1]
  );
  dot.radius += (desiredRadius - radius) * radiusChangeRate;

  dot.detectionRadius = dot.radius + CELL_SIZE * (dot.moveSpeed / dotSpeed);
  dot.collisionRadius = dot.detectionRadius * collisionRadiusMultiplier;
}

function HandleDotCollision(dot) {
  const dotsInNeighboringCells = GetDotsInNeighboringCells(dot);
  const direction = SteerDirection(dot, dotsInNeighboringCells);
  dot.moveDirection = help.NormalizeVector([
    dot.moveDirection[0] + direction[0] * steeringStrength,
    dot.moveDirection[1] + direction[1] * steeringStrength,
  ]);

  MoveDotToOtherEdge(dot);
}

function SteerDirection(dot, otherDots) {
  const { moveDirection, detectionRadius, collisionRadius } = dot;
  let direction = [0, 0];
  let xposAvg = 0;
  let yposAvg = 0;
  let dotsVisible = 0;
  let largestDot = null;
  for (const otherDot of otherDots) {
    if (otherDot.id === dot.id) continue;

    // // turn away from edges
    // direction = TurnAwayFromEdges(dot, direction);

    // turn towards larger dots
    if (largestDot === null || otherDot.radius > largestDot.radius) {
      largestDot = otherDot;
    }

    let otherDotPosition = AdjustPositionForOppositeSide(dot, otherDot);

    const dotsVector = help.VectorDirection(dot.position, otherDotPosition);
    const distance2 = help.SquareVectorMagnitude(dotsVector);
    const dotProduct = help.DotProduct(moveDirection, dotsVector);

    // slow down if close to other dot
    if (
      distance2 <= collisionRadius * collisionRadius &&
      dotProduct > slowDotProductThreshold
    ) {
      dot.moveSpeed = help.Clamp(
        dot.moveSpeed -
          decelleration *
            help.Lerp(0.5, 1, dot.radius / maxDotRadius) *
            help.Lerp(1, 0, distance2 / (collisionRadius * collisionRadius)) *
            help.Lerp(0, 2, slownessFactor),
        dotSpeed * minSpeedPercentage,
        dotSpeed
      );
    }

    if (distance2 > detectionRadius * detectionRadius) continue;

    const inVisionCone = dotProduct > visionDotProductThreshold;
    if (!inVisionCone) continue;

    // average position of other dots
    xposAvg += otherDotPosition[0];
    yposAvg += otherDotPosition[1];
    dotsVisible++;

    if (dot.id === 0) {
      DebugDrawLinePositions(dot.position, otherDotPosition);
    }

    const ratio =
      1 - help.Clamp(distance2 / (detectionRadius * detectionRadius), 0, 1);
    direction = direction.map((dir, i) => {
      // turn away from other dot
      dir -= dotsVector[i] * ratio * separationFactor;
      // align with other dot
      dir += otherDot.moveDirection[i] * alignmentFactor;
      return dir;
    });
  }

  // steer away from mouse
  if (canvasMousePosition !== null && scale <= 1) {
    const maxMouseDist = 200 / scale;
    const minMouseDist = 150 / scale;
    const mouseVector = help.VectorDirection(dot.position, canvasMousePosition);
    const mouseDist2 = help.SquareVectorMagnitude(mouseVector);
    const edgeBezier = help.BezierCurve(
      [1, 1],
      [1, 0],
      [1, 0],
      [0, 0],
      (mouseDist2 - minMouseDist * minMouseDist) /
        (maxMouseDist * maxMouseDist - minMouseDist * minMouseDist)
    )[1];
    if (mouseDist2 < maxMouseDist * maxMouseDist) {
      dot.moveSpeed += 3 * edgeBezier;
      direction = direction.map(
        (dir, i) => dir - mouseVector[i] * steerFromMouseFactor * edgeBezier
      );
    }
  }

  // turn towards larger dots
  if (largestDot !== null) {
    const dotsVector = help.VectorDirection(dot.position, largestDot.position);
    direction = direction.map(
      (dir, i) => dir + dotsVector[i] * turnTowardsLightFactor
    );
  }

  if (dotsVisible > 0) {
    xposAvg /= dotsVisible;
    yposAvg /= dotsVisible;

    const desiredDirection = help.VectorDirection(dot.position, [
      xposAvg,
      yposAvg,
    ]);
    direction = direction.map(
      (dir, i) => dir + desiredDirection[i] * centeringFactor
    );

    if (dot.id === 0 && isDrawingDebug) {
      help.drawCircle(
        dotsAreaCanvasContext,
        xposAvg,
        yposAvg,
        5,
        "yellow",
        null,
        2
      );
    }
  }

  return direction;
}

function AdjustPositionForOppositeSide(dot, otherDot) {
  let otherDotPosition = otherDot.position;
  // check if other dot grid position is far away
  const gridDiff = otherDot.position.map((pos, i) => pos - dot.position[i]);
  if (gridDiff.x > 1) {
    // pretend other dot is next to us, just outside of the canvas
    otherDotPosition.x = otherDot.position[0] - dotsAreaCanvas.width;
  } else if (gridDiff.x < -1) {
    otherDotPosition.x = otherDot.position[0] + dotsAreaCanvas.width;
  }

  if (gridDiff.y > 1) {
    // pretend other dot is next to us, just outside of the canvas
    otherDotPosition.y = otherDot.position[1] - dotsAreaCanvas.height;
  } else if (gridDiff.y < -1) {
    otherDotPosition.y = otherDot.position[1] + dotsAreaCanvas.height;
  }

  return otherDotPosition;
}

function DebugDrawLinePositions(pos1, pos2) {
  if (!isDrawingDebug) return;
  help.drawLine(
    dotsAreaCanvasContext,
    pos1[0],
    pos1[1],
    pos2[0],
    pos2[1],
    "blue",
    2
  );
}
