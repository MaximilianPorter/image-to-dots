function createGrid(width, height, cellSize) {
  const grid = {};
  for (let i = 0; i < width / cellSize; i++) {
    for (let j = 0; j < height / cellSize; j++) {
      grid[`${i},${j}`] = [];
    }
  }
  return grid;
}

function getNeighboringCells(grid, gridPosition, cellSize, canvas) {
  const neighboringCells = [
    `${gridPosition.x},${gridPosition.y}`,
    `${gridPosition.x},${gridPosition.y - 1}`, // this can be undefined
    `${gridPosition.x},${gridPosition.y + 1}`, // this can be undefined
    `${gridPosition.x - 1},${gridPosition.y}`, // this can be undefined
    `${gridPosition.x - 1},${gridPosition.y - 1}`,
    `${gridPosition.x - 1},${gridPosition.y + 1}`,
    `${gridPosition.x + 1},${gridPosition.y}`, // this can be undefined
    `${gridPosition.x + 1},${gridPosition.y - 1}`,
    `${gridPosition.x + 1},${gridPosition.y + 1}`,
  ];

  const lastXCell = Math.floor(canvas.width / cellSize);
  const lastYCell = Math.floor(canvas.height / cellSize);

  for (let i = 0; i < neighboringCells.length; i++) {
    // this means the dot is somewhere on the edge of the canvas
    if (grid[neighboringCells[i]] === undefined) {
      if (i === 1) {
        neighboringCells[1] = `${gridPosition.x},${lastYCell}`;
        neighboringCells[4] = `${gridPosition.x - 1},${lastYCell}`;
        neighboringCells[7] = `${gridPosition.x + 1},${lastYCell}`;
      } else if (i === 2) {
        neighboringCells[2] = `${gridPosition.x},${0}`;
        neighboringCells[5] = `${gridPosition.x - 1},${0}`;
        neighboringCells[8] = `${gridPosition.x + 1},${0}`;
      } else if (i === 3) {
        neighboringCells[3] = `${lastXCell},${gridPosition.y}`;
        neighboringCells[4] = `${lastXCell},${gridPosition.y - 1}`;
        neighboringCells[5] = `${lastXCell},${gridPosition.y + 1}`;
      } else if (i === 6) {
        neighboringCells[6] = `${0},${gridPosition.y}`;
        neighboringCells[7] = `${0},${gridPosition.y - 1}`;
        neighboringCells[8] = `${0},${gridPosition.y + 1}`;
      }
    }
  }

  return neighboringCells;
}

export { createGrid, getNeighboringCells };
