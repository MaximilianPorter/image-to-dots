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
    this.accelleration = 0.001;
    this.detectionRadius = detectionRadius;
    this.collisionRadius = collisionRadius;
    this.gridPosition = {
      x: Math.floor(position[0] / cellSize),
      y: Math.floor(position[1] / cellSize),
    };
    this.cellSize = cellSize;

    this.lastPosition = position;
    this.lastGridPosition = {
      x: 0,
      y: 0,
    };
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
    this.lastGridPosition = this.gridPosition;

    const desiredGridPosition = {
      x: Math.floor(this.position[0] / this.cellSize),
      y: Math.floor(this.position[1] / this.cellSize),
    };

    if (desiredGridPosition.x < 0) {
      desiredGridPosition.x = 0;
    }
    if (desiredGridPosition.y < 0) {
      desiredGridPosition.y = 0;
    }

    this.gridPosition = desiredGridPosition;

    if (
      this.gridPosition.x !== this.lastGridPosition.x ||
      this.gridPosition.y !== this.lastGridPosition.y
    ) {
      return true;
    } else {
      return false;
    }
  }
}

export default Dot;
