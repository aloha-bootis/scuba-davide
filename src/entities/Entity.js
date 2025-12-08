export class Entity {

  constructor({game, startX=0, startY=0, startVx=0, startVy=0, sprite, sizeX=128, sizeY=128 }) {
    this.game = game;

    this.x = startX;
    this.y = startY;

    this.vx = startVx;
    this.vy = startVy;

    this.sprite = new Image();
    this.sprite.src = sprite;

    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.invertedSprite = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();

    if (this.vx > 0) {
      this.inverted = true;
    }
    else if (this.vx < 0) {
      this.inverted = false;
    }

    if (this.inverted) {
      ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -this.x - this.sizeX, this.y, this.sizeX, this.sizeY);
    } 
    else {
      ctx.drawImage(this.sprite, this.x, this.y, this.sizeX, this.sizeY);
    }

    ctx.restore();
  }
}
