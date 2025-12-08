import { checkBounds } from "../utils.js";
import { Entity } from "./Entity.js";
import { SPRITES } from '../config/sprites.js';

export class Enemy extends Entity{

  constructor({game, startX=0, startY=0, startVx=5, startVy=0, sprite=SPRITES.ENEMY, sizeX=SPRITES.SIZES.ENEMY.width, sizeY=SPRITES.SIZES.ENEMY.height}) {
    super({game, startX, startY, startVx, startVy, sprite, sizeX, sizeY});
    this._offscreen = false;
  }

  update() {
    // Move horizontally always (they spawn off left/right and travel across)
    this.x += this.vx;

    // Vertical movement with bounce at water surface (top) and screen bottom
    const nextY = this.y + this.vy;
    if (nextY < this.game.waterSurfaceY) {
      this.y = this.game.waterSurfaceY;
      this.vy = -this.vy;
    } else if (nextY + this.sizeY > this.game.height) {
      this.y = this.game.height - this.sizeY;
      this.vy = -this.vy;
    } else {
      this.y = nextY;
    }

    // If the enemy has fully exited past the opposite horizontal side, mark for removal
    if (this.x + this.sizeX < -50 || this.x > this.game.width + 50) {
      this._offscreen = true;
    }
  }

};