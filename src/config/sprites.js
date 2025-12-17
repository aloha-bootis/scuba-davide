// Centralized sprite paths (enumerator-like) for game entities
export const SPRITES = {
  PLAYER: './assets/scuba2.png',
  ENEMY: './assets/submarine_finanza1.png',
  COLLECTABLE: './assets/egg.png',
  // fish sprites can be used as collectables (randomly chosen)
  FISH: [
    './assets/cod_fish.png',
    './assets/salmon_fish.png',
    './assets/tropical_fish.png',
    './assets/egg.png'
  ],
  // bad items that penalize player when collected
  BAD: [
    './assets/wheat.png',
    './assets/milk.png',
    './assets/sugar.png',
  ],
  // Default sizes for sprites (used by entity constructors)
  SIZES: {
    PLAYER: { width: 100, height: 50 },
    ENEMY: { width: 100, height: 45 },
    COLLECTABLE: { width: 42, height: 42 },
  },
};

export default SPRITES;
