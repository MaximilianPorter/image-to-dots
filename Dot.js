class Dot {
  constructor(
    id,
    moveDirection,
    moveSpeed,
    position,
    radius,
    detectionRadius,
    collisionRadius,
    cellSize
  ) {
    this.id = id;
    this.moveDirection = moveDirection;
    this.moveSpeed = moveSpeed;
    this.position = position;
    this.radius = radius;
    this.startMoveSpeed = moveSpeed;
    this.accelleration = 0.0005;
    this.detectionRadius = detectionRadius;
    this.collisionRadius = collisionRadius;
    this.gridPosition = {
      x: Math.floor(position[0] / cellSize),
      y: Math.floor(position[1] / cellSize),
    };
    this.cellSize = cellSize;

    this.lastPosition = position;
  }

  updatePosition() {
    this.lastPosition = this.position;

    this.position[0] =
      this.position[0] + this.moveDirection[0] * this.moveSpeed;
    this.position[1] =
      this.position[1] + this.moveDirection[1] * this.moveSpeed;

    if (this.moveSpeed < this.startMoveSpeed) {
      this.moveSpeed += this.accelleration;
    } else {
      this.moveSpeed = this.startMoveSpeed;
    }
  }

  updateGridPosition() {
    this.gridPosition.x = Math.floor(this.position[0] / this.cellSize);
    this.gridPosition.y = Math.floor(this.position[1] / this.cellSize);
  }
}

export default Dot;
