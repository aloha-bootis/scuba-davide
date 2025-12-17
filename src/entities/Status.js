export class Status {
  constructor(ctx, player) {
    this.ctx = ctx;

    // load images
    this.statusImages = {
      normal: new Image(),
      left: new Image(),
      right: new Image(),
      low: new Image(),
      lower: new Image(),
      faint: new Image(),
    };
    this.statusImages.normal.src = './assets/status/davide_normal.png';
    this.statusImages.left.src = './assets/status/davide_normal_left.png';
    this.statusImages.right.src = './assets/status/davide_normal_right.png';
    this.statusImages.low.src = './assets/status/davide_low.png';
    this.statusImages.lower.src = './assets/status/davide_lower.png';
    this.statusImages.faint.src = './assets/status/davide_faint.png';

    this.statusImage = this.statusImages.normal;

    // animation state (left -> normal -> right every 5s)
    this._statusState = 'normal';
    this._lastStatusTrigger = performance.now();
    this._statusAnimActive = false;
    this._statusAnimSequence = ['left', 'normal', 'right'];
    this._statusAnimFrameIndex = 0;
    this._statusAnimFrameDur = 750; // ms per frame
    this._statusAnimateTime = 2500;
    this._statusNextFrameTime = 0;
    this._player = player;
  }

  drawStatus() {
    // draw player status icon at top-right
    const paddingX = 16;
    const paddingY = 16;
    const iconSize = 64; // px (internal canvas pixels)
    const ix = paddingX;
    const iy = paddingY;

    // health-based overrides: if player's breath is low, show specific static image
    let healthState = null;
    if (this._player) {
      const p = this._player;
      const pct = p.maxBreath > 0 ? (p.breath / p.maxBreath) : 1;
      if (pct < 0.02) healthState = 'faint';
      else if (pct < 0.25) healthState = 'lower';
      else if (pct < 0.5) healthState = 'low';
    }

    const now = performance.now();
    if (healthState) {
      // health overrides animation: use static health image
      this.statusImage = this.statusImages[healthState] || this.statusImages.normal;
    } else {
      // update status animation (trigger every 5s)
      
    if (!this._statusAnimActive && now - this._lastStatusTrigger >= this._statusAnimateTime) {
      this._statusAnimActive = true;
      this._statusAnimFrameIndex = 0;
      this._statusNextFrameTime = now + this._statusAnimFrameDur;
      this._statusState = this._statusAnimSequence[0];
    }

    if (this._statusAnimActive && now >= this._statusNextFrameTime) {
      this._statusAnimFrameIndex++;
      if (this._statusAnimFrameIndex >= this._statusAnimSequence.length) {
        // animation complete, return to normal and reset trigger
        this._statusAnimActive = false;
        this._statusState = 'normal';
        this._lastStatusTrigger = now;
      } else {
        this._statusState = this._statusAnimSequence[this._statusAnimFrameIndex];
        this._statusNextFrameTime = now + this._statusAnimFrameDur;
      }
    }

    this.statusImage = this.statusImages[this._statusState] || this.statusImages.normal;
    }

    // background for visibility
    this.ctx.save();
    // this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
    // this.ctx.fillRect(ix - 4, iy - 4, iconSize + 8, iconSize + 8);
    if (this.statusImage && this.statusImage.complete) {
      this.ctx.drawImage(this.statusImage, ix, iy, iconSize, iconSize);
    }
    this.ctx.restore();
  }

  // reset status state (used when returning to menu or restarting the game)
  reset(player) {
    this._player = player || this._player;
    this._statusState = 'normal';
    this._statusAnimActive = false;
    this._statusAnimFrameIndex = 0;
    this._statusNextFrameTime = 0;
    this._lastStatusTrigger = performance.now();
    this.statusImage = this.statusImages.normal;
  }
}

export default Status;
