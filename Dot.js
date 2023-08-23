class Dot {
  constructor(id, element, velocity, position) {
    this.id = id;
    this.element = element;
    this.velocity = velocity;
    this.position = position;
  }

  move() {
    if (this.element === null) {
      console.log("element is null");
      return;
    }

    this.element.style.left =
      parseFloat(this.element.style.left) + this.velocity.x + "%";
    this.element.style.top =
      parseFloat(this.element.style.top) + this.velocity.y + "%";
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
  }
}

export default Dot;
