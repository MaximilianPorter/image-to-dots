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
function SquareVectorMagnitude(vector) {
  return vector[0] * vector[0] + vector[1] * vector[1];
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

function BezierCurve(p1, p2, p3, p4, t) {
  const x =
    Math.pow(1 - t, 3) * p1[0] +
    3 * Math.pow(1 - t, 2) * t * p2[0] +
    3 * (1 - t) * Math.pow(t, 2) * p3[0] +
    Math.pow(t, 3) * p4[0];
  const y =
    Math.pow(1 - t, 3) * p1[1] +
    3 * Math.pow(1 - t, 2) * t * p2[1] +
    3 * (1 - t) * Math.pow(t, 2) * p3[1] +
    Math.pow(t, 3) * p4[1];
  return [x, y];
}

function DrawBezierCurve(ctx, p1, p2, p3, p4, color) {
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export {
  Clamp,
  NormalizeVector,
  VectorMagnitude,
  SquareVectorMagnitude,
  VectorDirection,
  Lerp,
  DotProduct,
  drawCircle,
  drawLine,
  BezierCurve,
  DrawBezierCurve,
};
