import { Game } from "./src/Game.js";

window.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("game");
  const game = new Game(canvas);

  // Responsive canvas styling for different screen sizes
  function resizeCanvas(canvas) {
    const internalWidth = 800;
    const internalHeight = 450;

    const scale = Math.min(
      window.innerWidth / internalWidth,
      window.innerHeight / internalHeight
    );

    canvas.style.width = internalWidth * scale + "px";
    canvas.style.height = internalHeight * scale + "px";
  }

  window.addEventListener("resize", () => resizeCanvas(canvas));
  resizeCanvas(canvas);

  canvas.addEventListener("click", (event) => {
    game.handleCanvasClick(event);
  });

  game.loop();
});

