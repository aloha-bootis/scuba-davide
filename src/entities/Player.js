import { checkBounds } from '../utils.js';
import { Entity } from './Entity.js';
import { SPRITES } from '../config/sprites.js';
import { PLAYER_CONFIG } from '../config/player.js';

export class Player extends Entity {
    
    constructor({game, iputHandler}) {

      const startX = game.width * (PLAYER_CONFIG.START_X_RATIO ?? 0.5);
      const startY = game.height * (PLAYER_CONFIG.START_Y_RATIO ?? 0.5);
    
      super({ game, startX, startY, sprite: SPRITES.PLAYER, sizeX: SPRITES.SIZES.PLAYER.width, sizeY: SPRITES.SIZES.PLAYER.height });

      this.keys = iputHandler.keys;
      // movement physics
      this.speed = PLAYER_CONFIG.SPEED ?? 5;
      this.acceleration = PLAYER_CONFIG.ACCELERATION ?? 600; // px/s^2
      this.drag = PLAYER_CONFIG.DRAG ?? 2.0; // 1/s
      this.buoyancy = PLAYER_CONFIG.BUOYANCY ?? 100; // px/s^2 upward

      this.vx = 0;
      this.vy = 0;
      this._lastMoveTime = performance.now();

      this.maxBreath = PLAYER_CONFIG.MAX_BREATH ?? 100;
      this.breath = this.maxBreath;

      this.breathDecayDuration = PLAYER_CONFIG.BREATH_DECAY_DURATION ?? 20000;
      this.breathDecayRate = this.maxBreath / this.breathDecayDuration;

      // time to refill breath when at surface
      this.breathRefillDuration = PLAYER_CONFIG.BREATH_REFILL_DURATION ?? 1000;
      this.breathRefillRate = this.maxBreath / this.breathRefillDuration;
      this._lastBreathTime = performance.now();
      // damage invulnerability
      this._lastDamageTime = 0;
      this._damageInvulMs = PLAYER_CONFIG.DAMAGE_INVUL_MS ?? 500; // ms
    }
  
  update() {
    // integrate movement with acceleration, drag and buoyancy
    const nowMove = performance.now();
    const dtMove = Math.max(0, nowMove - this._lastMoveTime) / 1000; // seconds
    this._lastMoveTime = nowMove;

    // input-based acceleration
    let ax = 0;
    let ay = 0;
    if (this.keys["ArrowUp"] || this.keys["w"]) ay -= this.acceleration;
    if (this.keys["ArrowDown"] || this.keys["s"]) ay += this.acceleration;
    if (this.keys["ArrowLeft"] || this.keys["a"]) ax -= this.acceleration;
    if (this.keys["ArrowRight"] || this.keys["d"]) ax += this.acceleration;

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
    const dtBreath = nowBreath - this._lastBreathTime;
    this._lastBreathTime = nowBreath;

    // if damaged recently, skip breath update
    const timeSinceDamage = nowBreath - this._lastDamageTime;

    // if at water surface, refill breath
    if (this.y <= this.game.waterSurfaceY && timeSinceDamage >= this._damageInvulMs) {
      this.breath = Math.min(this.maxBreath, this.breath + dtBreath * this.breathRefillRate);
    } else {
      // decay breath over time
      this.breath = Math.max(0, this.breath - dtBreath * this.breathDecayRate);
    }
  }

  draw(ctx) {
    super.draw(ctx);

    // red flash during damage immunity
    const now = performance.now();
    const timeSinceDamage = now - this._lastDamageTime;
    if (timeSinceDamage < this._damageInvulMs) {
      // flash intensity based on time (blink effect)
      const blinkSpeed = 0.01; // controls blink frequency
      const flash = Math.sin(timeSinceDamage * blinkSpeed * Math.PI) > 0 ? 0.6 : 0;
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

  takeDamage(amount) {
    console.log("Player taking damage:", amount);

    const now = performance.now();
    if (now - this._lastDamageTime < this._damageInvulMs) return false; // still invulnerable

    this._lastDamageTime = now;
    this.breath = Math.max(0, this.breath - amount);
    return true;
  }

};