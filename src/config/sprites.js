// Centralized sprite paths (enumerator-like) for game entities
export const SPRITES = {
  PLAYER: './assets/scuba.png',
  ENEMY: './assets/submarine_finanza1.png',
  COLLECTABLE: './assets/egg.png',
  // Default sizes for sprites (used by entity constructors)
  SIZES: {
    PLAYER: { width: 128, height: 64 },
    ENEMY: { width: 128, height: 64 },
    COLLECTABLE: { width: 64, height: 64 },
  },
};

export default SPRITES;
