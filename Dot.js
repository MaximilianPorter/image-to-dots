class Dot {
  constructor(
    id,
    moveDirection,
    moveSpeed,
    position,
    radius,
    collisionRadius,
    cellSize
  ) {
    this.id = id;
    this.moveDirection = moveDirection;
    this.moveSpeed = moveSpeed;
    this.position = position;
    this.radius = radius;
    this.collisionRadius = collisionRadius;
    this.gridPosition = {
      x: Math.floor(position.x / cellSize),
      y: Math.floor(position.y / cellSize),
    };
    this.cellSize = cellSize;

    this.lastPosition = position;
  }

  updatePosition() {
    this.lastPosition = this.position;

    this.position.x = this.position.x + this.moveDirection.x * this.moveSpeed;
    this.position.y = this.position.y + this.moveDirection.y * this.moveSpeed;
  }

  updateGridPosition() {
    this.gridPosition.x = Math.floor(this.position.x / this.cellSize);
    this.gridPosition.y = Math.floor(this.position.y / this.cellSize);
  }
}

export default Dot;
