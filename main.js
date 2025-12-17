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

  // Menu overlay buttons
  const overlay = document.getElementById("menu-overlay");
  const btnStart = document.getElementById("btn-start");
  const btnTutorial = document.getElementById("btn-tutorial");
  const btnScoreboard = document.getElementById("btn-scoreboard");
    const btnSubmit = document.getElementById("btn-submit");
    const submitArea = document.getElementById('submit-area');
    const submitInput = document.getElementById('submit-name');
    const submitMsg = document.getElementById('submit-msg');
  const menuPanel = document.getElementById("menu-panel");
  const menuPanelOriginalHtml = menuPanel ? menuPanel.innerHTML : "";
  const btnCredits = document.getElementById("btn-credits");

  let activeButton = null;

  if (btnStart) {
    btnStart.addEventListener("click", () => {
      game.startGame();
      // clear any highlighted menu button
      setActiveButton(null);
       hideMenuPanel();
       hideSubmit();
    });
  }

   function showSubmit(finalScore) {
    if (!submitArea) return;

    showSubmitInput();

    // only show when there's a non-zero score
    if (!finalScore || finalScore === 0) return;
    submitArea.classList.remove('hidden');
    submitArea.setAttribute('aria-hidden', 'false');
    // prepare input and focus
    if (submitInput) {
      submitInput.value = '';
      submitInput.focus();
      if (btnSubmit) btnSubmit.disabled = true;
      // enable/disable submit button based on input
      submitInput.addEventListener('input', () => {
        const has = (submitInput.value || '').trim().length > 0;
        if (btnSubmit) btnSubmit.disabled = !has;
        // hide any previous message when user starts typing
        if (submitMsg) { 
          submitMsg.classList.add('hidden'); 
          submitMsg.classList.remove('error'); 
        }
      });
    }
   }

   function hideSubmitInput() {
    btnSubmit?.classList.add('hidden');
    btnSubmit?.setAttribute('aria-hidden', 'true'); 
    submitInput?.classList.add('hidden');
    submitInput?.setAttribute('aria-hidden', 'true');
   }

   function showSubmitInput() { 
    btnSubmit?.classList.remove('hidden');
    btnSubmit?.setAttribute('aria-hidden', 'false'); 
    submitInput?.classList.remove('hidden');
    submitInput?.setAttribute('aria-hidden', 'false');
   }

   function hideSubmit() {
    if (!submitArea) return;
    submitArea.classList.add('hidden');
    submitArea.setAttribute('aria-hidden', 'true');
    if (submitInput) submitInput.value = '';
    if (btnSubmit) btnSubmit.disabled = true;
    if (submitMsg) { 
      submitMsg.classList.add('hidden'); 
      submitMsg.classList.remove('error'); 
      submitMsg.textContent = ''; 
    }
   }

  // handle submit flow: read name from inline input and store score locally
  if (btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      try {
        const lastScore = game.finalScore || 0;
        if (!lastScore || lastScore === 0) return;
        const name = (submitInput?.value || '').trim();
        if (!name) {
          if (submitMsg) { 
            submitMsg.textContent = 'Please enter your name'; 
            submitMsg.classList.remove('hidden'); 
            submitMsg.classList.add('error'); 
          }
          submitInput?.focus();
          return;
        }

        // load existing stored scores, append and persist
        const raw = localStorage.getItem('scuba_scores');
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ name: String(name).slice(0, 32), points: lastScore, ts: Date.now() });
        // keep only a reasonable number
        localStorage.setItem('scuba_scores', JSON.stringify(arr.slice(-200)));


        hideSubmitInput();
        if (submitMsg) { 
          submitMsg.textContent = 'Score submitted locally'; 
          submitMsg.classList.remove('hidden'); 
          submitMsg.classList.remove('error'); 
        }
      } catch (err) {
        console.error('Submit failed', err);
        if (submitMsg) { 
          submitMsg.textContent = 'Could not submit score'; 
          submitMsg.classList.remove('hidden'); 
          submitMsg.classList.add('error'); 
        }
      }
    });

    // submit on Enter in the input
    if (submitInput) {
      submitInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          // only submit when input has text and button is enabled
          if (!btnSubmit || btnSubmit.disabled) return;
          btnSubmit.click();
        }
      });
    }
  }

  function setActiveButton(btn) {
    if (!menuPanel) return;

    activeButton = btn;

    [btnTutorial, btnScoreboard, btnCredits].forEach((b) => {
      if (!b) return;
      b.classList.remove("active");
    });

    btn?.classList?.add("active");
  }

  // Hide only the menu text panel (do not hide overlay buttons)
  function hideMenuPanel() {
    if (!menuPanel) return;
    menuPanel.classList.add("hidden-visibility");
  }

  // Show the menu panel (used when loading Tutorial/Scoreboard/Credits)
  function showMenuPanel() {
    if (!menuPanel) return;
    menuPanel.classList.remove("hidden-visibility");
  }

  async function loadTutorial() {
    if (activeButton === btnTutorial) {
      setActiveButton(null);
      hideMenuPanel();
      return;
    }

    try {
      const res = await fetch("./assets/text/tutorial.md");
      if (!res.ok) throw new Error("Failed to load tutorial");
      const text = await res.text();
      // insert tutorial content (tutorial.md already contains simple html)
      menuPanel.innerHTML = text;

      showMenuPanel();
      setActiveButton(btnTutorial);
    } catch (err) {
      console.error(err);
      alert("Could not load tutorial.");
    }
  }

  if (btnTutorial) btnTutorial.addEventListener("click", loadTutorial);

  // show the tutorial immediately when the page loads
  loadTutorial();

  if (btnScoreboard) {
    btnScoreboard.addEventListener("click", async () => {
      if (!menuPanel) return;

      if (activeButton === btnScoreboard) {
        setActiveButton(null);
        hideMenuPanel();
        return;
      }

        try {
          const res = await fetch('./assets/text/scoreboard.json');
          if (!res.ok) throw new Error('Failed to load scoreboard');
          const data = await res.json();
          // merge with any locally submitted scores stored in localStorage
          const localRaw = localStorage.getItem('scuba_scores');
          const local = localRaw ? JSON.parse(localRaw) : [];
          const merged = (data.scores || []).concat(local || []);
          const rows = merged.slice().sort((a, b) => b.points - a.points);
        // build table
        const table = document.createElement("table");
        table.className = "scoreboard-table";
        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>Rank</th><th>Name</th><th>Points</th></tr>";
        const tbody = document.createElement("tbody");
        rows.forEach((r, idx) => {
          const tr = document.createElement("tr");
          const rankTd = document.createElement("td");
          rankTd.textContent = String(idx + 1);
          const nameTd = document.createElement("td");
          nameTd.textContent = r.name || "";
          const ptsTd = document.createElement("td");
          ptsTd.textContent = String(r.points || 0);
          tr.appendChild(rankTd);
          tr.appendChild(nameTd);
          tr.appendChild(ptsTd);
          tbody.appendChild(tr);
        });
        table.appendChild(thead);
        table.appendChild(tbody);

        menuPanel.innerHTML = "<h2>Scoreboard</h2>";
        menuPanel.appendChild(table);
        showMenuPanel();
        setActiveButton(btnScoreboard);
      } catch (err) {
        console.error(err);
        alert("Could not load scoreboard.");
      }
    });
  }

  // listen for game reset events to show/hide the submit button
  document.addEventListener('game:resetToMenu', (e) => {
    const finalScore = e?.detail?.finalScore ?? 0;
    if (finalScore && finalScore !== 0) {
      showSubmit(finalScore);
    } else {
      hideSubmit();
    }
  });

  if (btnCredits) {
    btnCredits.addEventListener("click", async () => {
      if (!menuPanel) return;

      if (activeButton === btnCredits) {
        setActiveButton(null);
        hideMenuPanel();
        return;
      }

      try {
        const res = await fetch("./assets/text/credits.md");
        if (!res.ok) throw new Error("Failed to load credits");
        const text = await res.text();
        console.log("Credits text:", text);
        menuPanel.innerHTML =
          "<h2>Credits</h2>" +
          '<pre style="white-space:pre-wrap; color:#fff;">' +
          text +
          "</pre>";
        // ensure panel is visible and mark active
        showMenuPanel();
        setActiveButton(btnCredits);
      } catch (err) {
        console.error(err);
        alert("Could not load credits.");
      }
    });
  }

  game.loop();
});
