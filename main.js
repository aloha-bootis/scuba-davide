import { Game } from "./src/Game.js";

window.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("game");
  const game = new Game(canvas);

  canvas.addEventListener("click", (event) => {
    game.handleCanvasClick(event);
  });

  game.loop();
});

