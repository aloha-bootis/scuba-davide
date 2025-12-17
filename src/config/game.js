export const GAME_CONFIG = {
  // Water surface position as a fraction of canvas height (0..1).
  // Player cannot go above this Y (smaller ratio => surface closer to top).
  WATER_SURFACE_RATIO: 0.2,

  // Enemy spawn timing (ms)
  ENEMY_SPAWN_BASE: 3000,
  ENEMY_SPAWN_VARIANCE: 1000,

  // Collectable spawn timing (ms) and lifetime
  COLLECTABLE_SPAWN_BASE: 3000,
  COLLECTABLE_SPAWN_VARIANCE: 1500,
  // Bad collectable spawn timing (ms) — spawns independently of good collectables
  BAD_COLLECTABLE_SPAWN_BASE: 5000,
  BAD_COLLECTABLE_SPAWN_VARIANCE: 3000,
  COLLECTABLE_LIFETIME: 5000,
  // Points for good collectable
  COLLECTABLE_SCORE: 10,
  // Points subtracted for bad collectable
  BAD_COLLECTABLE_PENALTY: 15,
  // Breath damage applied when collecting a bad collectable
  BAD_COLLECTABLE_DAMAGE: 10,

  // Death fade duration (ms)
  DEATH_FADE_DURATION: 1500,

  // Enemy collision forgiveness (compenetration fraction)
  ENEMY_COLLISION_COMPENETRATION: 0.1,

  VERSION: '0.1.7'
};

export default GAME_CONFIG;