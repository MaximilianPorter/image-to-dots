class Dot {
  constructor(
    id,
    velocity,
    position,
    radius,
    collisionRadius,
    cellSize,
    desiredPosition
  ) {
    this.id = id;
    this.velocity = velocity;
    this.position = position;
    this.radius = radius;
    this.collisionRadius = collisionRadius;
    this.gridPosition = {
      x: Math.floor(position.x / cellSize),
      y: Math.floor(position.y / cellSize),
    };
    this.cellSize = cellSize;
    this.desiredPosition = desiredPosition;

    this.lastPosition = position;
  }

  updatePosition() {
    this.lastPosition = this.position;

    this.position.x = this.position.x + this.velocity.x;
    this.position.y = this.position.y + this.velocity.y;
  }

  updateGridPosition() {
    this.gridPosition.x = Math.floor(this.position.x / this.cellSize);
    this.gridPosition.y = Math.floor(this.position.y / this.cellSize);
  }
}

export default Dot;
