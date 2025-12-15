import { checkBounds } from '../utils.js';
import { Entity } from './Entity.js';
import { SPRITES } from '../config/sprites.js';
import { PLAYER_CONFIG } from '../config/player.js';

export class Player extends Entity {
    
    constructor({game, inputHandler}) {

      const startX = game.width * (PLAYER_CONFIG.START_X_RATIO ?? 0.5);
      const startY = game.height * (PLAYER_CONFIG.START_Y_RATIO ?? 0.5);
    
      super({ game, startX, startY, sprite: SPRITES.PLAYER, sizeX: SPRITES.SIZES.PLAYER.width, sizeY: SPRITES.SIZES.PLAYER.height });

      // console.log("Creating Player at:", startX, startY);

      this.inputHandler = inputHandler;
      this.keys = inputHandler.keys;
      // movement physics
      this.speed = PLAYER_CONFIG.SPEED ?? 5;
      this.accelerationX = PLAYER_CONFIG.ACCELERATION_X; // px/s^2
      this.accelerationY = PLAYER_CONFIG.ACCELERATION_Y; // px/s^2
      this.drag = PLAYER_CONFIG.DRAG ?? 2.0; // 1/s
      this.buoyancy = PLAYER_CONFIG.BUOYANCY ?? 100; // px/s^2 upward

      this.vx = 0;
      this.vy = 0;
      this._lastMoveTime = performance.now();
      // track previous key state to detect presses (not holds)
      this._prevKeys = {
        'ArrowUp': false, 'w': false,
        'ArrowDown': false, 's': false,
        'ArrowLeft': false, 'a': false,
        'ArrowRight': false, 'd': false,
      };

      this.maxBreath = PLAYER_CONFIG.MAX_BREATH ?? 100;
      this.breath = this.maxBreath;
      // console.log("Player max breath:", this.maxBreath, this.breath);

      this.breathDecayDuration = PLAYER_CONFIG.BREATH_DECAY_DURATION ?? 20000;
      this.breathDecayRate = this.maxBreath / this.breathDecayDuration;

      // time to refill breath when at surface
      this.breathRefillDuration = PLAYER_CONFIG.BREATH_REFILL_DURATION ?? 1000;
      this.breathRefillRate = this.maxBreath / this.breathRefillDuration;
      this._lastBreathTime = null;
      // damage invulnerability
      this._lastDamageTime = 0;
      this._damageInvulMs = PLAYER_CONFIG.DAMAGE_INVUL_MS ?? 500; // ms
      // track the most recent damage invulnerability duration (permits per-hit overrides)
      this._lastDamageInvulMs = this._damageInvulMs;
      // separate flash timestamp/duration so we can visually flash without applying damage
      this._lastHitFlashTime = 0;
      this._lastHitFlashDuration = 0;
    }
  
  update() {
    // integrate movement with acceleration, drag and buoyancy
    const nowMove = performance.now();
    const dtMove = Math.max(0, nowMove - this._lastMoveTime) / 1000; // seconds
    this._lastMoveTime = nowMove;

    // input-based acceleration (only on key press, not hold)
    let ax = 0;
    let ay = 0;

    // Check for key press (transition from false to true)
    const isUpPress = (this.keys["ArrowUp"] || this.keys["w"]) && !(this._prevKeys["ArrowUp"] || this._prevKeys["w"]);
    const isDownPress = (this.keys["ArrowDown"] || this.keys["s"]) && !(this._prevKeys["ArrowDown"] || this._prevKeys["s"]);
    const isLeftPress = (this.keys["ArrowLeft"] || this.keys["a"]) && !(this._prevKeys["ArrowLeft"] || this._prevKeys["a"]);
    const isRightPress = (this.keys["ArrowRight"] || this.keys["d"]) && !(this._prevKeys["ArrowRight"] || this._prevKeys["d"]);

    if (isUpPress) ay -= this.accelerationY;
    if (isDownPress) ay += this.accelerationY;
    if (isLeftPress) ax -= this.accelerationX;
    if (isRightPress) ax += this.accelerationX;

    // Update previous key state for next frame
    this._prevKeys["ArrowUp"] = this.keys["ArrowUp"];
    this._prevKeys["w"] = this.keys["w"];
    this._prevKeys["ArrowDown"] = this.keys["ArrowDown"];
    this._prevKeys["s"] = this.keys["s"];
    this._prevKeys["ArrowLeft"] = this.keys["ArrowLeft"];
    this._prevKeys["a"] = this.keys["a"];
    this._prevKeys["ArrowRight"] = this.keys["ArrowRight"];
    this._prevKeys["d"] = this.keys["d"];

    // buoyancy is an upward acceleration (negative Y)
    ay -= this.buoyancy;

    // integrate velocity (v = v + a * dt)
    this.vx += ax * dtMove;
    this.vy += ay * dtMove;

    // apply linear drag (simple damping)
    const dragFactor = Math.max(0, 1 - this.drag * dtMove);
    this.vx *= dragFactor;
    this.vy *= dragFactor;

    // integrate position (p = p + v * dt)
    const nextX = this.x + this.vx * dtMove;
    const nextY = this.y + this.vy * dtMove;

    // collision with canvas bounds: clamp and zero velocity on impact
    const withinX = nextX >= 0 && nextX + this.sizeX <= this.game.width;
    const withinY = nextY >= 0 && nextY + this.sizeY <= this.game.height;
    if (withinX) this.x = nextX; else {
      // clamp and stop horizontal movement
      this.x = Math.max(0, Math.min(nextX, this.game.width - this.sizeX));
      this.vx = 0;
    }
    if (withinY) this.y = nextY; else {
      this.y = Math.max(0, Math.min(nextY, this.game.height - this.sizeY));
      this.vy = 0;
    }

    const nowBreath = performance.now();

    const dtBreath = this._lastBreathTime ? nowBreath - this._lastBreathTime : 0;
    this._lastBreathTime = nowBreath;

    // if damaged recently, skip breath update
    const timeSinceDamage = nowBreath - this._lastDamageTime;

    // console.log("£ update: ", this.vx, this.vy, ax, ay, withinX, withinY, this.x, this.y);

    // if at water surface, refill breath
    if (this.y <= this.game.waterSurfaceY && timeSinceDamage >= this._lastDamageInvulMs) {
      this.breath = Math.min(this.maxBreath, this.breath + dtBreath * this.breathRefillRate);
    } else {
      // decay breath over time
      this.breath = Math.max(0, this.breath - dtBreath * this.breathDecayRate);
    }
  }

  draw(ctx) {
    super.draw(ctx);

    // red flash during damage immunity or when a visual flash was requested
    const now = performance.now();
    const timeSinceDamage = now - this._lastDamageTime;
    const timeSinceFlash = now - this._lastHitFlashTime;
      if (timeSinceDamage < this._lastDamageInvulMs || timeSinceFlash < this._lastHitFlashDuration) {
      // base the blink on whichever timestamp is active
      const t = timeSinceDamage < this._lastDamageInvulMs ? timeSinceDamage : timeSinceFlash;
      const blinkSpeed = 0.01; // controls blink frequency
      const flash = Math.sin(t * blinkSpeed * Math.PI) > 0 ? 0.6 : 0;
      ctx.save();
      ctx.fillStyle = `rgba(255, 0, 0, ${flash})`;
      ctx.fillRect(this.x, this.y, this.sizeX, this.sizeY);
      ctx.restore();
    }

    this.drawBreathBar(ctx);
  }

  drawBreathBar(ctx) {
    const barWidth = this.sizeX;
    const barHeight = 8;
    const x = this.x;
    const y = this.y - barHeight - 8;

    // background / border
    ctx.save();
    ctx.fillStyle = '#444';
    ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);

    // empty portion
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barWidth, barHeight);

    // filled portion (green -> red gradient)
    const pct = Math.max(0, Math.min(1, this.breath / this.maxBreath));
    const fillW = Math.round(barWidth * pct);

    // color from red (low) to green (high)
    const r = Math.round(255 * (1 - pct));
    const b = Math.round(200 * pct + 55 * (1 - pct));
    ctx.fillStyle = `rgb(${r}, 60, ${b})`;
    ctx.fillRect(x, y, fillW, barHeight);

    ctx.restore();
  }

  takeDamage(amount, invulMsOverride) {
    // console.log("Player taking damage:", amount);

    const now = performance.now();
    if (now - this._lastDamageTime < this._lastDamageInvulMs) return false; // still invulnerable

    this._lastDamageTime = now;
    // allow per-hit invulnerability duration override (e.g., half-duration for bad collectables)
    this._lastDamageInvulMs = typeof invulMsOverride === 'number' ? invulMsOverride : this._damageInvulMs;
    this.breath = Math.max(0, this.breath - amount);
    return true;
  }

  // request a visual-only hit flash (optionally specify duration in ms)
  flash(durationMs) {
    this._lastHitFlashTime = performance.now();
    this._lastHitFlashDuration = typeof durationMs === 'number' ? durationMs : this._damageInvulMs;
  }

};