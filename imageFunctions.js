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

export {
  getApproximatePixelColor,
  getPixelValue,
  getAveragePixelValue,
  getDarkestValueInImage,
};
