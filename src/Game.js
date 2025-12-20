import { Player } from "./entities/Player.js";
import { Enemy } from "./entities/Enemy.js";
import { Collectable } from "./entities/collectable.js";
import { BadCollectable } from "./entities/BadCollectable.js";
import { inputHandler } from "./InputHandler.js";
import { Status } from './entities/Status.js';
import { checkCollision } from "./utils.js";
import { SPRITES } from './config/sprites.js';
import { GAME_CONFIG } from './config/game.js';
import PLAYER_CONFIG from "./config/player.js";

export class Game {

  constructor(canvas) {
    this.canvas = canvas;

    this.width = canvas.width;
    this.height = canvas.height;  

    this.ctx = canvas.getContext("2d");

    this.input = new inputHandler(this);
    this.input.create();

    this.player = new Player({game: this, inputHandler: this.input});
    this.enemies = [];
    this.collectables = []; 
    this.entities = [];
    this.status = new Status(this.canvas, this.ctx, this.player);

    // game state
    this.score = 0;
    this.finalScore = 0; // score from last game
    this.isRunning = false; // game starts paused on menu
    this.isDead = false; // track if player is dead
    this._deathFadeStartTime = 0; // when death fade starts
    this._deathFadeDuration = GAME_CONFIG.DEATH_FADE_DURATION ?? 1500; // ms

    // water bounds (player cannot go above this line)
    this.waterSurfaceY = this.height * (GAME_CONFIG.WATER_SURFACE_RATIO ?? 0.15);

    // enemy spawning configuration
    this.spawnIntervalBase = GAME_CONFIG.ENEMY_SPAWN_BASE ?? 3000; // ms base spawn interval
    this.spawnIntervalVariance = GAME_CONFIG.ENEMY_SPAWN_VARIANCE ?? 1000; // ±ms variance
    this._nextSpawnTime = performance.now() + this._getNextSpawnDelay();

    // collectable spawning configuration (good collectables)
    this.collectableSpawnIntervalBase = GAME_CONFIG.COLLECTABLE_SPAWN_BASE ?? 3000; // ms base spawn interval
    this.collectableSpawnIntervalVariance = GAME_CONFIG.COLLECTABLE_SPAWN_VARIANCE ?? 1500; // ±ms variance
    this._nextGoodCollectableSpawnTime = performance.now() + this._getNextGoodCollectableSpawnDelay();

    // bad collectable spawning configuration (spawns independently)
    this.badCollectableSpawnIntervalBase = GAME_CONFIG.BAD_COLLECTABLE_SPAWN_BASE ?? GAME_CONFIG.COLLECTABLE_SPAWN_BASE ?? 3000;
    this.badCollectableSpawnIntervalVariance = GAME_CONFIG.BAD_COLLECTABLE_SPAWN_VARIANCE ?? GAME_CONFIG.COLLECTABLE_SPAWN_VARIANCE ?? 1500;
    this._nextBadCollectableSpawnTime = performance.now() + this._getNextBadCollectableSpawnDelay();

    this.bgImage = new Image();
    this.bgImage.src = './assets/background/background_new2.png';
    // cache menu overlay element (optional)
    this.menuOverlay = document.getElementById('menu-overlay');
  }

  updatePlayer() {
    this.player.update();
    // keep player below water surface
    if (this.player.y < this.waterSurfaceY) {
      this.player.y = this.waterSurfaceY;
      // stop upward velocity so player stays at surface instead of repeatedly penetrating
      if (this.player.vy < 0) this.player.vy = 0;
    }
  }

  updateEnemies() {
    // iterate backwards so we can remove enemies that exit
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update();

      // collision with player (use configured compenetration to make enemy collisions more forgiving)
      const comp = GAME_CONFIG.ENEMY_COLLISION_COMPENETRATION ?? 0.1;
      if (checkCollision(this.player, enemy, comp)) {
        this.player.takeDamage(PLAYER_CONFIG.ENEMY_DAMAGE);
      }

      // remove if marked offscreen
      if (enemy._offscreen) {
        this.enemies.splice(i, 1);
      }
    }
  }

  updateCollectables() {
    // iterate backwards to safely remove
    for (let i = this.collectables.length - 1; i >= 0; i--) {
      const collectable = this.collectables[i];
      collectable.update();

      // collision with player
      if (checkCollision(this.player, collectable)) {
        // adjust score depending on whether it's a bad collectable
        if (collectable.isBad) {
          this.score -= (GAME_CONFIG.BAD_COLLECTABLE_PENALTY ?? 0);
          // apply breath damage for bad collectable and use a shorter invulnerability window
          const dmg = GAME_CONFIG.BAD_COLLECTABLE_DAMAGE;
          const invulnTime = PLAYER_CONFIG.DAMAGE_COLLECTABLE_INVUL_MS;
          this.player.takeDamage(dmg, invulnTime);
          // always show a shorter flash for bad collectables (even if damage was blocked)
          if (this.player && typeof this.player.flash === 'function') this.player.flash(invulnTime);
        } else {
          this.score += (GAME_CONFIG.COLLECTABLE_SCORE ?? 10);
        }
        collectable._collected = true;
      }

      // remove if collected or expired
      if (collectable._collected) {
        this.collectables.splice(i, 1);
      }
    }
  }

  update() {
    if (!this.isRunning) return; // skip updates while on menu

    // check if player died
    if (this.player.breath <= 0 && !this.isDead) {
      this.isDead = true;
      this._deathFadeStartTime = performance.now();
    }

    // if fading, check if fade is done
    if (this.isDead) {
      const now = performance.now();
      if (now - this._deathFadeStartTime >= this._deathFadeDuration) {
        // fade complete, return to menu
        this.resetToMenu();
        return;
      }
    }

    this.updatePlayer();
    this.updateEnemies();
    this.updateCollectables();

    // spawn enemies on a timer with randomized intervals
    const now = performance.now();
    if (now >= this._nextSpawnTime) {
      this.spawnEnemy();
      this._nextSpawnTime = now + this._getNextSpawnDelay();
    }

    // spawn good collectables on their timer
    if (now >= this._nextGoodCollectableSpawnTime) {
      this.spawnCollectable();
      this._nextGoodCollectableSpawnTime = now + this._getNextGoodCollectableSpawnDelay();
    }

    // spawn bad collectables on their own independent timer
    if (now >= this._nextBadCollectableSpawnTime) {
      this.spawnBadCollectable();
      this._nextBadCollectableSpawnTime = now + this._getNextBadCollectableSpawnDelay();
    }
  }

  _getNextSpawnDelay() {
    // Increase difficulty: for every 100 points, reduce spawn interval by 25%
    let base = this.spawnIntervalBase;
    let variance = this.spawnIntervalVariance;
    const difficultySteps = Math.floor(this.score / 100);
    if (difficultySteps > 0) {
      const reduction = Math.pow(0.75, difficultySteps); // reduce by 25% per 100 points
      base = Math.max(400, base * reduction); // min 400ms
      variance = Math.max(150, variance * reduction); // min 150ms
    }
    return base + (Math.random() * 2 - 1) * variance;
  }

  _getNextGoodCollectableSpawnDelay() {
    // uniform distribution: base ± variance
    return this.collectableSpawnIntervalBase + (Math.random() * 2 - 1) * this.collectableSpawnIntervalVariance;
  }

  _getNextBadCollectableSpawnDelay() {
    return this.badCollectableSpawnIntervalBase + (Math.random() * 2 - 1) * this.badCollectableSpawnIntervalVariance;
  }

  spawnEnemy() {
    const { width: sizeX, height: sizeY } = SPRITES.SIZES.ENEMY;
    const sideLeft = Math.random() < 0.5;
    const startY = Math.random() * (this.height - sizeY);
    const speedX = 2 + Math.random() * 3;
    let startX, startVx;
    if (sideLeft) {
      startX = -sizeX - 10;
      startVx = speedX;
    } else {
      startX = this.width + 10;
      startVx = -speedX;
    }
    const startVy = (Math.random() * 2 - 1) * 2; 

    const enemy = new Enemy({ game: this, startX, startY, startVx, startVy, sizeX, sizeY });
    this.enemies.push(enemy);
  }

  spawnCollectable() {
    const { width: sizeX, height: sizeY } = SPRITES.SIZES.COLLECTABLE;
    const startX = Math.random() * (this.width - sizeX);
    // spawn only below 50% of height
    const minY = this.height * 0.5;
    const startY = minY + Math.random() * (this.height - minY - sizeY);
    const lifetime = GAME_CONFIG.COLLECTABLE_LIFETIME ?? 5000; // ms before vanishing

    const collectable = new Collectable({ game: this, startX, startY, sizeX, sizeY, lifetime });
    this.collectables.push(collectable);
  }

  spawnBadCollectable() {
    const { width: sizeX, height: sizeY } = SPRITES.SIZES.COLLECTABLE;
    const startX = Math.random() * (this.width - sizeX);
    // spawn only below 50% of height
    const minY = this.height * 0.5;
    const startY = minY + Math.random() * (this.height - minY - sizeY);
    const lifetime = GAME_CONFIG.COLLECTABLE_LIFETIME ?? 5000; // ms before vanishing

    const collectable = new BadCollectable({ game: this, startX, startY, sizeX, sizeY, lifetime });
    this.collectables.push(collectable);
  }

  drawPlayer() {
    this.player.draw(this.ctx);
  }

  drawEnemies() {
    for (let enemy of this.enemies) {
      enemy.draw(this.ctx);
    }
  }

  drawCollectables() {
    for (let collectable of this.collectables) {
      collectable.draw(this.ctx);
    }
  }

  draw() {
    if (this.isRunning) {
      this.drawGame();
      // render death fade overlay if dying
      if (this.isDead) {
        this.drawDeathFade();
      }
    } else {
      this.drawMenu();
    }
  }

  drawDeathFade() {
    const now = performance.now();
    const elapsed = now - this._deathFadeStartTime;
    const progress = Math.min(1, elapsed / this._deathFadeDuration);
    const alpha = progress;

    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resetToMenu() {
    // save final score before reset
    this.finalScore = this.score;

    // reset game state
    this.isRunning = false;
    this.isDead = false;
    this.score = 0;
    this.enemies = [];
    this.collectables = [];

    // reset player
    this.player = new Player({game: this, inputHandler: this.input});
    this.status.reset(this.player);

    // reset spawn timers
    this._nextSpawnTime = performance.now() + this._getNextSpawnDelay();
    this._nextGoodCollectableSpawnTime = performance.now() + this._getNextGoodCollectableSpawnDelay();
    this._nextBadCollectableSpawnTime = performance.now() + this._getNextBadCollectableSpawnDelay();

    // disable input when returning to menu
    this.input.disable();
    // show DOM overlay buttons again
    this.menuOverlay.classList.remove('hidden');
    // notify external UI that we've returned to menu and provide final score
    try {
      document.dispatchEvent(new CustomEvent('game:resetToMenu', { detail: { finalScore: this.finalScore } }));
    } catch (e) {
      // ignore if document isn't available in some test harnesses
    }
  }

  drawGame() {
    this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);

    // draw blue water tint from top to water surface
    this.ctx.fillStyle = 'rgba(30, 100, 200, 0.3)';
    this.ctx.fillRect(0, this.waterSurfaceY, this.canvas.width, this.canvas.height);

    this.drawPlayer();
    this.drawEnemies();
    this.drawCollectables();
    this.drawScore();
    this.drawVersion();
    // delegate status drawing to Status instance
    this.status.drawStatus();
  }

  drawMenu() {
    // semi-transparent overlay
    this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // title
    this.ctx.save();
    this.ctx.font = 'bold 48px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('SCUBA DAVIDE', this.width / 2, this.height / 2 - 80);

    // show score if there was a game played
    if (this.finalScore !== 0) {
      this.ctx.font = '32px Arial';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText(`Final Score: ${this.finalScore}`, this.width / 2, this.height / 2 - 20);
    }

    // start button
    // const btnWidth = 200;
    // const btnHeight = 60;
    // const btnX = (this.width - btnWidth) / 2;
    // const btnY = this.height / 2 + 20;

    // this.ctx.fillStyle = '#4CAF50';
    // this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    // this.ctx.fillStyle = '#fff';
    // this.ctx.font = 'bold 28px Arial';
    // this.ctx.textAlign = 'center';
    // this.ctx.textBaseline = 'middle';
    // this.ctx.fillText('START', this.width / 2, btnY + btnHeight / 2);

    // // store button rect for click detection
    // this._startButtonRect = { x: btnX, y: btnY, width: btnWidth, height: btnHeight };
    this.ctx.restore();

    this.drawVersion();
  }

  drawScore() {
    const paddingX = 10;
    const paddingY = this.height / 10;
    const fontSize = 24;
    this.ctx.save();
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.fillStyle = '#f96705ff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`Score: ${this.score}`, this.width - paddingX, paddingY + fontSize/2);
    this.ctx.restore();
  }

  drawVersion() {
    const padding = 10;
    const fontSize = 12;
    this.ctx.save();
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'right';

    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText(`Version: ${GAME_CONFIG.VERSION}`, this.width - padding, this.height - padding);
    this.ctx.restore();
  }

  loop() {
    if (this.isRunning) {
      this.update();
    }
    this.draw();
    requestAnimationFrame(this.loop.bind(this));
  }

  startGame() {
    this.isRunning = true;
    this.input.enable();
    // hide DOM overlay buttons when starting
    console.log("Hiding menu overlay", this.menuOverlay);
    this.menuOverlay.classList.add('hidden');
  }

  handleCanvasClick(event) {
    if (!this.isRunning && this._startButtonRect) {
      const rect = this.canvas.getBoundingClientRect();
      // Convert DOM coordinates (CSS pixels) to canvas internal coordinates
      const domX = event.clientX - rect.left;
      const domY = event.clientY - rect.top;
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = domX * scaleX;
      const y = domY * scaleY;

      const btn = this._startButtonRect;
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        this.startGame();
      }
    }
  }
}
