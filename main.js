import { Game } from "./src/Game.js";

window.addEventListener("DOMContentLoaded", () => {

  const canvas = document.getElementById("game");
  const game = new Game(canvas);

  // Responsive canvas styling for different screen sizes
  function resizeCanvas(canvas, gap = 20) {
    // internal game resolution
    const internalWidth = 800;
    const internalHeight = 450;

    // Reserve a 'gap' of pixels around canvas so it never touches screen edges
    const availableWidth = Math.max(100, window.innerWidth - gap * 2);
    const availableHeight = Math.max(100, window.innerHeight - gap * 2);

    const scale = Math.min(
      availableWidth / internalWidth,
      availableHeight / internalHeight
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

