class Dot {
  constructor(id, velocity, position, radius, collisionRadius) {
    this.id = id;
    this.velocity = velocity;
    this.position = position;
    this.radius = radius;
    this.collisionRadius = collisionRadius;

    this.lastPosition = position;
  }

  updatePosition() {
    this.lastPosition = this.position;

    this.position.x = this.position.x + this.velocity.x;
    this.position.y = this.position.y + this.velocity.y;
  }
}

export default Dot;
