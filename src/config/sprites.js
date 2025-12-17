// Centralized sprite paths (enumerator-like) for game entities
export const SPRITES = {
  PLAYER: './assets/entities/scuba2.png',
  ENEMY: './assets/entities/submarine_finanza1.png',
  COLLECTABLE: './assets/entities/egg.png',
  // fish sprites can be used as collectables (randomly chosen)
  FISH: [
    './assets/collectables/cod_fish.png',
    './assets/collectables/salmon_fish.png',
    './assets/collectables/tropical_fish.png',
    './assets/collectables/egg.png'
  ],
  // bad items that penalize player when collected
  BAD: [
    './assets/collectables/wheat.png',
    './assets/collectables/milk.png',
    './assets/collectables/sugar.png',
  ],
  // Default sizes for sprites (used by entity constructors)
  SIZES: {
    PLAYER: { width: 100, height: 50 },
    ENEMY: { width: 100, height: 45 },
    COLLECTABLE: { width: 42, height: 42 },
  },
};

export default SPRITES;
