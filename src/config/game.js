export const GAME_CONFIG = {
  // Water surface position as a fraction of canvas height (0..1).
  // Player cannot go above this Y (smaller ratio => surface closer to top).
  WATER_SURFACE_RATIO: 0.15,

  // Enemy spawn timing (ms)
  ENEMY_SPAWN_BASE: 3000,
  ENEMY_SPAWN_VARIANCE: 1000,

  // Collectable spawn timing (ms) and lifetime
  COLLECTABLE_SPAWN_BASE: 3000,
  COLLECTABLE_SPAWN_VARIANCE: 1500,
  COLLECTABLE_LIFETIME: 5000,

  // Death fade duration (ms)
  DEATH_FADE_DURATION: 1500,

  // Enemy collision forgiveness (compenetration fraction)
  ENEMY_COLLISION_COMPENETRATION: 0.1,

  VERSION: '0.1.4'
};

export default GAME_CONFIG;