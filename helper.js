function Clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function NormalizeVector(vector) {
  const magnitude = VectorMagnitude(vector);
  return [vector[0] / magnitude, vector[1] / magnitude];
}

function VectorMagnitude(vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

function VectorDirection(from, to) {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  return [x, y];
}

function Lerp(a, b, t) {
  return a + (b - a) * t;
}

function DotProduct(vector1, vector2) {
  // Normalize the vectors
  const norm1 = NormalizeVector(vector1);
  const norm2 = NormalizeVector(vector2);

  // Calculate the dot product
  return norm1[0] * norm2[0] + norm1[1] * norm2[1];
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

function drawLine(ctx, x1, y1, x2, y2, stroke, strokeWidth) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  if (stroke) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export {
  Clamp,
  NormalizeVector,
  VectorMagnitude,
  VectorDirection,
  DotProduct,
  Lerp,
  drawCircle,
  drawLine,
};
