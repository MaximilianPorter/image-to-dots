function createGrid(width, height, cellSize) {
  const grid = {};
  for (let i = 0; i < width / cellSize; i++) {
    for (let j = 0; j < height / cellSize; j++) {
      grid[`${i},${j}`] = [];
    }
  }
  return grid;
}

export { createGrid };
