import { Collectable } from './collectable.js';
import { SPRITES } from '../config/sprites.js';

function _randomBadSprite() {
  const arr = SPRITES.BAD || [];
  if (arr.length === 0) return SPRITES.COLLECTABLE;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
}

export class BadCollectable extends Collectable {
  constructor({ game, startX = 0, startY = 0, sprite = null, sizeX = SPRITES.SIZES.COLLECTABLE.width, sizeY = SPRITES.SIZES.COLLECTABLE.height, lifetime = 5000 }) {
    const chosenSprite = sprite || _randomBadSprite();
    super({ game, startX, startY, sprite: chosenSprite, sizeX, sizeY, lifetime });
    this.isBad = true;
  }

}
