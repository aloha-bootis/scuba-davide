import { Entity } from './Entity.js';
import { SPRITES } from '../config/sprites.js';

export class Collectable extends Entity {
  constructor({ game, startX = 0, startY = 0, sprite = SPRITES.COLLECTABLE, sizeX = SPRITES.SIZES.COLLECTABLE.width, sizeY = SPRITES.SIZES.COLLECTABLE.height, lifetime = 5000 }) {
    super({ game, startX, startY, sprite, sizeX, sizeY });
    this.lifetime = lifetime; // ms before vanishing
    this._spawnTime = performance.now();
    this._collected = false;
  }

  update() {
    const now = performance.now();
    const age = now - this._spawnTime;
    if (age >= this.lifetime) {
      this._collected = true;
    }
  }

  draw(ctx) {
    const now = performance.now();
    const age = now - this._spawnTime;
    const progress = Math.min(1, age / this.lifetime);

    // fade out: alpha goes from 1 to 0 over lifetime
    const alpha = 1 - progress;

    ctx.save();
    ctx.globalAlpha = alpha;
    super.draw(ctx);
    ctx.restore();
  }
}
