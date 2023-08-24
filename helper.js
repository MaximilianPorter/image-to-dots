function Clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function Lerp(a, b, t) {
  return a + (b - a) * t;
}

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

export { Clamp, NormalizeVector, VectorMagnitude, Lerp, drawCircle };
