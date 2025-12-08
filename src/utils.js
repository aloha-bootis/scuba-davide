
export function checkCollision(objA, objB, compenetration = 0) {
  // Support objects that use sizeX/sizeY (entities) or size (legacy)
  const ax = objA.x;
  const ay = objA.y;
  const aw = objA.sizeX ?? objA.size ?? 0;
  const ah = objA.sizeY ?? objA.size ?? 0;

  const bx = objB.x;
  const by = objB.y;
  const bw = objB.sizeX ?? objB.size ?? 0;
  const bh = objB.sizeY ?? objB.size ?? 0;

  // compenetration: fraction [0..1) to shrink each box for more forgiving collisions
  const cap = Math.max(0, Math.min(1, compenetration));

  const aEffectiveW = aw * (1 - cap);
  const aEffectiveH = ah * (1 - cap);
  const bEffectiveW = bw * (1 - cap);
  const bEffectiveH = bh * (1 - cap);

  // center the effective boxes within the original boxes
  const aEx = ax + (aw - aEffectiveW) / 2;
  const aEy = ay + (ah - aEffectiveH) / 2;
  const bEx = bx + (bw - bEffectiveW) / 2;
  const bEy = by + (bh - bEffectiveH) / 2;

  const collision = !(
    (aEy + aEffectiveH < bEy) ||
    (aEy > bEy + bEffectiveH) ||
    (aEx + aEffectiveW < bEx) ||
    (aEx > bEx + bEffectiveW)
  );

  return collision;
}

export function checkBounds(entity, width, height) {
    if (entity.x + entity.vx < 0) return false;
    if (entity.x + entity.vx + entity.sizeX > width) return false;
    if (entity.y + entity.vy < 0) return false;
    if (entity.y + entity.vy + entity.sizeY > height) return false;

    return true;
}