
export class inputHandler {

    constructor() {
        this.keys = {};
        this.init();
    }

    init() {
        document.addEventListener("keydown", e => this.keys[e.key] = true);
        document.addEventListener("keyup", e => this.keys[e.key] = false);
    }
};


