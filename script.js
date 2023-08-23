// import Dot.js
import Dot from "./Dot.js";

const input_img_element = document.getElementById("input-image");
const canvas = document.getElementById("input-image-preview");
const canvasContext = canvas.getContext("2d");
const dotsAreaElement = document.getElementById("dots-area");

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
const dotsToAdd = 500;
const dotSpeed = 0.5;

function addDots() {
  for (let i = 0; i < dotsToAdd; i++) {
    const dot = document.createElement("div");
    dot.classList.add("dot");

    dotsAreaElement.appendChild(dot);

    const pos = {
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
    };

    const velocity = {
      x: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
      y: dotSpeed * (Math.random() < 0.5 ? -1 : 1),
    };

    const dotObject = new Dot(i, dot, velocity, pos);

    dotDictionary[i] = dotObject;

    dot.style.left = pos.x + "%";
    dot.style.top = pos.y + "%";
  }
}

addDots();

// move dots every frame
function moveDots() {
  for (const [key, value] of Object.entries(dotDictionary)) {
    const { element, velocity, position } = value;
    position.x = position.x + velocity.x;
    position.y = position.y + velocity.y;
    element.style.left = position.x + "%";
    element.style.top = position.y + "%";

    const rect = element.getBoundingClientRect();
    let x = rect.left;
    let y = rect.top;
    let w = rect.width;
    let h = rect.height;

    let boundingRect = dotsAreaElement.getBoundingClientRect();
    let boundingX = boundingRect.left;
    let boundingY = boundingRect.top;
    let boundingW = boundingRect.width;
    let boundingH = boundingRect.height;

    if (x < boundingX || x + w > boundingX + boundingW) {
      velocity.x = -velocity.x;
    }

    if (y < boundingY || y + h > boundingY + boundingH) {
      velocity.y = -velocity.y;
    }

    // const pos = {
    //   x: parseFloat(element.style.left),
    //   y: parseFloat(element.style.top),
    // };
    // element.style.backgroundColor = `rgb(${pos.x}%, ${pos.y}%, 50%)`;
  }

  // requestAnimationFrame(moveDots);
}
moveDots();
