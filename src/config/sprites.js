// Centralized sprite paths (enumerator-like) for game entities
export const SPRITES = {
  PLAYER: './assets/scuba.png',
  ENEMY: './assets/submarine_finanza1.png',
  COLLECTABLE: './assets/egg.png',
  // Default sizes for sprites (used by entity constructors)
  SIZES: {
    PLAYER: { width: 100, height: 50 },
    ENEMY: { width: 100, height: 45 },
    COLLECTABLE: { width: 42, height: 42 },
  },
};

export default SPRITES;
