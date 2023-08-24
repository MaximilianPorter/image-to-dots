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
const dotRespawnQueue = [];
let darkestPixelValue = 1;

const dotDictionary = {};
const dotsToAdd = 5000;
const dotSpeed = 0.5;
const maxDotRadius = 4;
const minDotRadius = 0.01;
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
  createGrid();
  for (let i = 0; i < dotsToAdd; i++) {
    const pos = {
      x: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.width,
      y: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.height,
    };

    const desiredPosition = randomPointOnOppoSideOfImage(
      pos.x / dotsAreaCanvas.width,
      pos.y / dotsAreaCanvas.height
    );

    const desiredMoveDirection = NormalizeVector(
      desiredPosition.x - pos.x,
      desiredPosition.y - pos.y
    );

    const velocity = {
      x: dotSpeed * desiredMoveDirection.x,
      y: dotSpeed * desiredMoveDirection.y,
    };

    const dotObject = new Dot(
      i,
      velocity,
      pos,
      minDotRadius,
      maxDotRadius,
      CELL_SIZE,
      desiredPosition
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
    const {
      velocity,
      position,
      lastPosition,
      radius,
      collisionRadius,
      gridPosition,
      desiredPosition,
    } = value;
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

    const desiredMoveDirection = NormalizeVector(
      desiredPosition.x - position.x,
      desiredPosition.y - position.y
    );

    value.velocity.x = clamp(
      value.velocity.x + acceleration * desiredMoveDirection.x,
      -dotSpeed,
      dotSpeed
    );
    value.velocity.y = clamp(
      value.velocity.y + acceleration * desiredMoveDirection.y,
      -dotSpeed,
      dotSpeed
    );

    // respawn if we're too close to our desired position
    const distanceToDesiredPosition = VectorMagnitude(
      desiredPosition.x - position.x,
      desiredPosition.y - position.y
    );

    if (distanceToDesiredPosition < 10) {
      respawnDot(value);
    }

    const pixelValue = getPixelValue(
      position.x / dotsAreaCanvas.width,
      position.y / dotsAreaCanvas.height,
      uploadedImageData
    );

    const desiredRadius =
      minDotRadius + (maxDotRadius - minDotRadius) * pixelValue;
    value.radius += (desiredRadius - radius) * radiusChangeRate;
    // if (collisionRadius < maxDotRadius) {
    //   value.collisionRadius +=
    //     ((maxDotRadius - collisionRadius) * radiusChangeRate) / 2;
    // }

    if (
      value.radius <
      minDotRadius +
        (maxDotRadius - minDotRadius) *
          (darkestPixelValue + 1) *
          darknessRespawnThreshold
    ) {
      respawnDot(value);
    }

    value.collisionRadius = (maxDotRadius + minDotRadius) * 0.9;

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

    const apColor = getApproximatePixelColor(
      position.x / dotsAreaCanvas.width,
      position.y / dotsAreaCanvas.height,
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
    // bounce off other dots
    HandleDotCollision(value);

    // bounce off walls
    BouceOffWalls(value);

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

function getAveragePixelValue(xPercent, yPercent, imageData) {
  // check surrounding pixels
  const x = Math.floor(xPercent * imageData.width);
  const y = Math.floor(yPercent * imageData.height);
  const index = (y * imageData.width + x) * 4;

  const surroundingPixels = [
    index - 4,
    index + 4,
    index - imageData.width * 4,
    index + imageData.width * 4,
  ];

  let total = 0;
  let count = 0;

  for (const pixel of surroundingPixels) {
    if (pixel < 0 || pixel > imageData.data.length) continue;
    total += imageData.data[pixel];
    count++;
  }

  return total / count / 255;
}

function getDarkestValueInImage(imageData) {
  let darkestValue = 1;
  for (let i = 0; i < imageData.data.length; i += 4) {
    const pixelValue = imageData.data[i] / 255;
    if (pixelValue < darkestValue) {
      darkestValue = pixelValue;
    }
  }

  return darkestValue;
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

function HandleDotCollision(mainDot) {
  const { position, collisionRadius: col1, velocity } = mainDot;
  const neighboringDots = getDotsInNeighboringCells(mainDot);

  // for (const [key2, dot] of Object.entries(dotDictionary)) {
  for (const otherDot of neighboringDots) {
    if (mainDot === otherDot) continue;

    const { position: position2, collisionRadius: col2 } = otherDot;

    const distance = Math.sqrt(
      (position.x - position2.x) ** 2 + (position.y - position2.y) ** 2
    );

    if (distance < col1 + col2 + 10) {
      // push away from other dots softer
      const normPos = NormalizeVector(
        position.x - position2.x,
        position.y - position2.y
      );
      const angle = Math.atan2(normPos.y, normPos.x);
      const newVelocity = {
        x: Math.cos(angle) / distance,
        y: Math.sin(angle) / distance,
      };

      velocity.x += newVelocity.x;
      velocity.y += newVelocity.y;
    }

    if (distance < col1 + col2) {
      // collision detected!
      // move around the other dot
      const angle = Math.atan2(
        position2.y - position.y,
        position2.x - position.x
      );
      const newVelocity = {
        x: -Math.cos(angle) * bounceOffForce,
        y: -Math.sin(angle) * bounceOffForce,
      };

      velocity.x += newVelocity.x;
      velocity.y += newVelocity.y;

      velocity.x *= bounceDamper;
      velocity.y *= bounceDamper;
    }
  }
}

function BouceOffWalls(dot) {
  const { position, velocity, radius } = dot;
  if (position.x - radius < 0) {
    respawnDot(dot);
    velocity.x = Math.abs(velocity.x);
  } else if (position.x + radius > dotsAreaCanvas.width) {
    velocity.x = -Math.abs(velocity.x);
    respawnDot(dot);
  }

  if (position.y - radius < 0) {
    velocity.y = Math.abs(velocity.y);
    respawnDot(dot);
  } else if (position.y + radius > dotsAreaCanvas.height) {
    velocity.y = -Math.abs(velocity.y);
    respawnDot(dot);
  }
}

// function randomDarkPixelPos() {
//   while (true) {
//     const pos = {
//       x: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.width,
//       y: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.height,
//     };

//     const randomDarkPixel = getPixelValue(
//       pos.x / dotsAreaCanvas.width,
//       pos.y / dotsAreaCanvas.height,
//       uploadedImageData
//     );
//     if (randomDarkPixel < darkestPixelValue + 0.01) {
//       return pos;
//     }
//   }
// }

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
  const { position: pos } = dot;
  for (let i = 0; i < 100; i++) {
    const randomPos = {
      x: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.width,
      y: ((Math.random() * 80 + 10) / 100) * dotsAreaCanvas.height,
    };
    // check if the dot will be on top of other dots
    const neighboringDots = getDotsInNeighboringCells(dot);
    let isOverlapping = false;
    for (const otherDot of neighboringDots) {
      const { position: position2, collisionRadius: radius2 } = otherDot;

      const distance = Math.sqrt(
        (pos.x - position2.x) ** 2 + (pos.y - position2.y) ** 2
      );

      if (distance < dot.collisionRadius + radius2) {
        isOverlapping = true;
        break;
      }
    }

    // if (isOverlapping) continue;

    const pixelValue = getPixelValue(
      randomPos.x / dotsAreaCanvas.width,
      randomPos.y / dotsAreaCanvas.height,
      uploadedImageData
    );

    if (pixelValue > (darkestPixelValue + 1) * 0.6) {
      dot.position = randomPos;
      dot.radius = minDotRadius;
      // dot.collisionRadius = minDotRadius;
      dot.desiredPosition = randomPointOnOppoSideOfImage(
        randomPos.x / dotsAreaCanvas.width,
        randomPos.y / dotsAreaCanvas.height
      );
      break;
    }
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
