import * as help from "./helper.js";

const dotSizeBezierArea = document.getElementById("dot-size-bezier");
const dotSizeBezierCanvas = document.getElementById("dot-size-bezier--canvas");
const dotSizeBezierCanvasContext = dotSizeBezierCanvas.getContext("2d");
const dotBezierPoint2 = document.querySelector('.bezier-point[name="p2"]');
const dotBezierPoint3 = document.querySelector('.bezier-point[name="p3"]');

dotSizeBezierCanvas.width = dotSizeBezierArea.clientWidth;
dotSizeBezierCanvas.height = dotSizeBezierArea.clientHeight;
console.log(`${dotSizeBezierCanvas.width}px`);
dotBezierPoint2.style.left = `${dotSizeBezierCanvas.width / 2}px`;
dotBezierPoint2.style.top = `${dotSizeBezierCanvas.height * 0.2}px`;
dotBezierPoint3.style.left = `${dotSizeBezierCanvas.width / 2}px`;
dotBezierPoint3.style.top = `${dotSizeBezierCanvas.height * 0.8}px`;

let p1 = [0, dotSizeBezierCanvas.height];
let p2 = [
  parseInt(dotBezierPoint3.style.left),
  parseInt(dotBezierPoint3.style.top),
];
let p3 = [
  parseInt(dotBezierPoint2.style.left),
  parseInt(dotBezierPoint2.style.top),
];
let p4 = [dotSizeBezierCanvas.width, 0];

DrawDotBezierCurve();
let currentDraggingBezierPoint = null;
dotSizeBezierArea.addEventListener("mousedown", (e) => {
  const bezierPoint = e.target.closest(".bezier-point");
  if (bezierPoint === null) return;
  currentDraggingBezierPoint = bezierPoint;
});
document.addEventListener("mousemove", (e) => {
  if (!currentDraggingBezierPoint) return;
  let x = e.clientX - dotSizeBezierArea.offsetLeft;
  let y = e.clientY - dotSizeBezierArea.offsetTop;
  if (x < 0) x = 0;
  if (x > dotSizeBezierCanvas.width) x = dotSizeBezierCanvas.width;
  if (y < 0) y = 0;
  if (y > dotSizeBezierCanvas.height) y = dotSizeBezierCanvas.height;
  currentDraggingBezierPoint.style.left = `${x}px`;
  currentDraggingBezierPoint.style.top = `${y}px`;

  DrawDotBezierCurve();
});
document.addEventListener("mouseup", (e) => {
  currentDraggingBezierPoint = null;
});

function DrawDotBezierCurve() {
  dotSizeBezierCanvasContext.clearRect(
    0,
    0,
    dotSizeBezierCanvas.width,
    dotSizeBezierCanvas.height
  );
  p1 = [0, dotSizeBezierCanvas.height];
  p2 = [
    parseInt(dotBezierPoint3.style.left),
    parseInt(dotBezierPoint3.style.top),
  ];
  p3 = [
    parseInt(dotBezierPoint2.style.left),
    parseInt(dotBezierPoint2.style.top),
  ];
  p4 = [dotSizeBezierCanvas.width, 0];

  help.drawLine(
    dotSizeBezierCanvasContext,
    p1[0],
    p1[1],
    p2[0],
    p2[1],
    "rgba(255, 255, 255, 0.4)",
    1
  );
  help.drawLine(
    dotSizeBezierCanvasContext,
    p4[0],
    p4[1],
    p3[0],
    p3[1],
    "rgba(255, 255, 255, 0.4)",
    1
  );
  help.DrawBezierCurve(dotSizeBezierCanvasContext, p1, p2, p3, p4, "red");
}

function GetDotSizeBezierCurve(t) {
  const bezier = help.BezierCurve(p1, p2, p3, p4, t);
  return [
    bezier[0] / dotSizeBezierCanvas.width,
    Math.abs(1 - bezier[1] / dotSizeBezierCanvas.height),
  ];
}

export { GetDotSizeBezierCurve };
