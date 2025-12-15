import { GAME_CONFIG } from './game.js';

export const PLAYER_CONFIG = {
  // Start position as a fraction of canvas width/height (0..1)
  START_X_RATIO: 0.5,
  START_Y_RATIO: GAME_CONFIG.WATER_SURFACE_RATIO + 0.05, // slightly below water surface

  // Movement
  SPEED: 5,
  // Physics movement parameters (units: px/s^2 for accel/buoyancy, 1/s for drag)
  ACCELERATION_Y: 20000, // vertical acceleration on key press
  ACCELERATION_X: 15000, // horizontal acceleration on key press (3/4 of Y)
  DRAG: 2.0,
  BUOYANCY: 250,

  // Breath (timings in milliseconds)
  MAX_BREATH: 100,
  BREATH_DECAY_DURATION: 10000, // time to go from full -> 0
  BREATH_REFILL_DURATION: 1000, // time to refill from 0 -> full at surface

  // Damage invulnerability
  DAMAGE_INVUL_MS: 600,
  DAMAGE_COLLECTABLE_INVUL_MS: 250,

  ENEMY_DAMAGE: 50,
};

export default PLAYER_CONFIG;
