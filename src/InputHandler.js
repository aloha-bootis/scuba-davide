export class inputHandler {
  constructor(game = null) {
    this.keys = {};
    this.game = game;
    this._isEnabled = false;
    this._canvas = null;
    this._keydownHandler = null;
    this._keyupHandler = null;
    this._touchStartHandler = null;
    this._touchEndHandler = null;
    this._touchMap = {}; // touchId -> keys array
  }

  create() {
    // Store canvas reference
    this._canvas = document.getElementById("game");

    // Create arrow function handlers to preserve 'this' binding
    this._keydownHandler = (e) => (this.keys[e.key] = true);
    this._keyupHandler = (e) => (this.keys[e.key] = false);

    // Mobile touch controls: angle-based relative to player position
    this._touchStartHandler = (e) => {
      // prevent scrolling
      e.preventDefault();
      const rect = this._canvas.getBoundingClientRect();

      const scaleX = this._canvas.width / rect.width;
      const scaleY = this._canvas.height / rect.height;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];

        const touchX = (t.clientX - rect.left) * scaleX;
        const touchY = (t.clientY - rect.top) * scaleY;

        // const touchX = t.clientX - rect.left;
        // const touchY = t.clientY - rect.top;

        // Initialize array of keys for this touch ID
        if (!this._touchMap[t.identifier]) {
          this._touchMap[t.identifier] = [];
        }

        // Get player position if game is available
        if (this.game && this.game.player) {
          const playerX = this.game.player.x;
          const playerY = this.game.player.y;

          // Calculate angle from player to touch point
          const dx = touchX - playerX;
          const dy = touchY - playerY;

          // Calculate angle in degrees (0° = right, 90° = down, 270° = up)
          // Using Math.atan2(dy, dx) which returns radians
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);

          // Normalize angle to 0-360 range
          if (angle < 0) angle += 360;

          // Map angle to keys based on 30° zones around cardinal directions
          // Right (0°): 330-30°
          if (angle >= 330 || angle < 30) {
            const key = "d";
            this.keys[key] = true;
            if (!this._touchMap[t.identifier].includes(key)) {
              this._touchMap[t.identifier].push(key);
            }
          }
          // Down-Right (45°): 30-60°
          else if (angle >= 30 && angle < 60) {
            const keys = ["d", "s"];
            keys.forEach((key) => {
              this.keys[key] = true;
              if (!this._touchMap[t.identifier].includes(key)) {
                this._touchMap[t.identifier].push(key);
              }
            });
          }
          // Down (90°): 60-120°
          else if (angle >= 60 && angle < 120) {
            const key = "s";
            this.keys[key] = true;
            if (!this._touchMap[t.identifier].includes(key)) {
              this._touchMap[t.identifier].push(key);
            }
          }
          // Down-Left (135°): 120-150°
          else if (angle >= 120 && angle < 150) {
            const keys = ["s", "a"];
            keys.forEach((key) => {
              this.keys[key] = true;
              if (!this._touchMap[t.identifier].includes(key)) {
                this._touchMap[t.identifier].push(key);
              }
            });
          }
          // Left (180°): 150-210°
          else if (angle >= 150 && angle < 210) {
            const key = "a";
            this.keys[key] = true;
            if (!this._touchMap[t.identifier].includes(key)) {
              this._touchMap[t.identifier].push(key);
            }
          }
          // Up-Left (225°): 210-240°
          else if (angle >= 210 && angle < 240) {
            const keys = ["a", "w"];
            keys.forEach((key) => {
              this.keys[key] = true;
              if (!this._touchMap[t.identifier].includes(key)) {
                this._touchMap[t.identifier].push(key);
              }
            });
          }
          // Up (270°): 240-300°
          else if (angle >= 240 && angle < 300) {
            const key = "w";
            this.keys[key] = true;
            if (!this._touchMap[t.identifier].includes(key)) {
              this._touchMap[t.identifier].push(key);
            }
          }
          // Up-Right (315°): 300-330°
          else if (angle >= 300 && angle < 330) {
            const keys = ["w", "d"];
            keys.forEach((key) => {
              this.keys[key] = true;
              if (!this._touchMap[t.identifier].includes(key)) {
                this._touchMap[t.identifier].push(key);
              }
            });
          }
        }

        // console.log("Touch mapped to keys ", this._touchMap[t.identifier]);
      }
    };

    this._touchEndHandler = (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const keys = this._touchMap[t.identifier];
        if (keys) {
          // Release each key that was mapped to this touch
          keys.forEach((key) => (this.keys[key] = false));
          delete this._touchMap[t.identifier];
        }
      }
    };

    // Mouse click controls (behave like touch): mousedown -> press, mouseup -> release
    this._mouseDownHandler = (e) => {
      const rect = this._canvas.getBoundingClientRect();
      const domX = e.clientX - rect.left;
      const domY = e.clientY - rect.top;
      // use a synthetic id for mouse
      const id = "mouse";
      if (!this._touchMap[id]) this._touchMap[id] = [];

      // map DOM coords to canvas internal coords (in case canvas is CSS-scaled)
      const scaleX = this._canvas.width / rect.width;
      const scaleY = this._canvas.height / rect.height;
      const x = domX * scaleX;
      const y = domY * scaleY;

      if (this.game && this.game.player) {
        const playerX = this.game.player.x;
        const playerY = this.game.player.y;
        const dx = x - playerX;
        const dy = y - playerY;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const addKey = (k) => {
          this.keys[k] = true;
          if (!this._touchMap[id].includes(k)) this._touchMap[id].push(k);
        };

        if (angle >= 330 || angle < 30) addKey("d");
        else if (angle >= 30 && angle < 60) {
          addKey("d");
          addKey("s");
        } else if (angle >= 60 && angle < 120) addKey("s");
        else if (angle >= 120 && angle < 150) {
          addKey("s");
          addKey("a");
        } else if (angle >= 150 && angle < 210) addKey("a");
        else if (angle >= 210 && angle < 240) {
          addKey("a");
          addKey("w");
        } else if (angle >= 240 && angle < 300) addKey("w");
        else if (angle >= 300 && angle < 330) {
          addKey("w");
          addKey("d");
        }
      }
    };

    this._mouseUpHandler = (e) => {
      const id = "mouse";
      const keys = this._touchMap[id];
      if (keys) {
        keys.forEach((k) => (this.keys[k] = false));
        delete this._touchMap[id];
      }
    };
  }

  enable() {
    if (this._isEnabled) return; // Already enabled
    this._isEnabled = true;

    // Enable keyboard listeners
    // console.log("Enabling keyboard listeners", this._keydownHandler, this._keyupHandler);
    document.addEventListener("keydown", this._keydownHandler);
    document.addEventListener("keyup", this._keyupHandler);

    // Enable touch listeners
    if (this._canvas) {
      this._canvas.addEventListener("touchstart", this._touchStartHandler, {
        passive: false,
      });
      this._canvas.addEventListener("touchend", this._touchEndHandler, {
        passive: false,
      });
      this._canvas.addEventListener("touchcancel", this._touchEndHandler, {
        passive: false,
      });
      // mouse handlers
      this._canvas.addEventListener("mousedown", this._mouseDownHandler);
      this._canvas.addEventListener("mouseup", this._mouseUpHandler);
    } else {
      // fallback to whole document
      document.addEventListener("touchstart", this._touchStartHandler, {
        passive: false,
      });
      document.addEventListener("touchend", this._touchEndHandler, {
        passive: false,
      });
      document.addEventListener("touchcancel", this._touchEndHandler, {
        passive: false,
      });
      // mouse fallback
      document.addEventListener("mousedown", this._mouseDownHandler);
      document.addEventListener("mouseup", this._mouseUpHandler);
    }
  }

  disable() {
    if (!this._isEnabled) return; // Already disabled
    this._isEnabled = false;

    // Remove keyboard listeners
    document.removeEventListener("keydown", this._keydownHandler);
    document.removeEventListener("keyup", this._keyupHandler);

    // Remove touch listeners
    if (this._canvas) {
      this._canvas.removeEventListener("touchstart", this._touchStartHandler);
      this._canvas.removeEventListener("touchend", this._touchEndHandler);
      this._canvas.removeEventListener("touchcancel", this._touchEndHandler);
      // remove mouse handlers
      this._canvas.removeEventListener("mousedown", this._mouseDownHandler);
      this._canvas.removeEventListener("mouseup", this._mouseUpHandler);
    } else {
      // fallback to whole document
      document.removeEventListener("touchstart", this._touchStartHandler);
      document.removeEventListener("touchend", this._touchEndHandler);
      document.removeEventListener("touchcancel", this._touchEndHandler);
      // remove mouse fallback
      document.removeEventListener("mousedown", this._mouseDownHandler);
      document.removeEventListener("mouseup", this._mouseUpHandler);
    }

    // Clear all active keys
    // this.keys = {};
    // this._touchMap = {};
  }
}
