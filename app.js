document.addEventListener("DOMContentLoaded", () => {
    // ── DOM References ──────────────────────────────────────────────
    const setupCard         = document.getElementById("setupCard");
    const gameScreen        = document.getElementById("gameScreen");
    const form              = document.getElementById("playerForm");
    const gameBoard         = document.getElementById("gameBoard");
    const boxes             = document.querySelectorAll(".box");
    const rstBtn            = document.getElementById("rstBtn");
    const newGameBtn        = document.getElementById("newGameBtn");
    const greet             = document.getElementById("greeting");
    const playerDeclaration = document.getElementById("playerDeclaration");
    const currentPlayerDisplay = document.getElementById("currentPlayer");
    const winnerMsg         = document.getElementById("winnerMsg");
    const drawMsg           = document.getElementById("drawMsg");
    const scoreCardX        = document.getElementById("scoreX");
    const scoreCardO        = document.getElementById("scoreO");
    const nameXEl           = document.getElementById("nameX");
    const nameOEl           = document.getElementById("nameO");
    const scoreValueX       = document.getElementById("scoreValueX");
    const scoreValueO       = document.getElementById("scoreValueO");
    const drawsValue        = document.getElementById("drawsValue");

    // ── State ────────────────────────────────────────────────────────
    let player1 = "";  // always X
    let player2 = "";  // always O
    let turnX   = true; // Player 1 (X) always goes first
    let count   = 0;
    let gameActive = false;
    let gameMode = "classic";      // "classic" | "endless"
    let moveHistory = [];          // queue of box indices in order placed

    // Persistent scores (survive resets within a session)
    const scores = { X: 0, O: 0, draws: 0 };

    // Win patterns
    const winPatterns = [
        [0,1,2],[3,4,5],[6,7,8], // rows
        [0,3,6],[1,4,7],[2,5,8], // cols
        [0,4,8],[2,4,6]          // diagonals
    ];

    // Win-line config: position/angle for each pattern
    // top/left = center of the line (midpoint of first & last cell)
    // width covers slightly past both cell centres; diagonals use √2 factor
    const winLineConfigs = {
        '0,1,2': { top: '18%',   left: '50%', width: '78%', angle:   0 },
        '3,4,5': { top: '50%',   left: '50%', width: '78%', angle:   0 },
        '6,7,8': { top: '82%',   left: '50%', width: '78%', angle:   0 },
        '0,3,6': { top: '50%',   left: '18%', width: '78%', angle:  90 },
        '1,4,7': { top: '50%',   left: '50%', width: '78%', angle:  90 },
        '2,5,8': { top: '50%',   left: '82%', width: '78%', angle:  90 },
        '0,4,8': { top: '50%',   left: '50%', width: '110%', angle: 45 },
        '2,4,6': { top: '50%',   left: '50%', width: '110%', angle: -45 },
    };


    // ── Particles ────────────────────────────────────────────────────
    (function spawnParticles() {
        const container = document.getElementById("particles");
        const colors = ["#4f7be8", "#60a5fa", "#818cf8", "#f9a8d4", "#38bdf8"];
        for (let i = 0; i < 22; i++) {
            const p = document.createElement("div");
            p.classList.add("particle");
            const size = Math.random() * 5 + 3;
            p.style.cssText = `
                width:${size}px; height:${size}px;
                left:${Math.random() * 100}%;
                background:${colors[Math.floor(Math.random() * colors.length)]};
                opacity:${Math.random() * 0.4 + 0.1};
                animation-duration:${Math.random() * 16 + 10}s;
                animation-delay:${Math.random() * 10}s;
            `;
            container.appendChild(p);
        }
    })();

    // ── Mode button toggle ────────────────────────────────────────────
    document.getElementById("modeClassic").addEventListener("click", () => {
        gameMode = "classic";
        document.getElementById("modeClassic").classList.add("selected");
        document.getElementById("modeEndless").classList.remove("selected");
    });

    document.getElementById("modeEndless").addEventListener("click", () => {
        gameMode = "endless";
        document.getElementById("modeEndless").classList.add("selected");
        document.getElementById("modeClassic").classList.remove("selected");
    });

    // ── Form Submit → Start Game ──────────────────────────────────────
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        player1 = document.getElementById("firstPlayer").value.trim();
        player2 = document.getElementById("secondPlayer").value.trim();
        if (!player1 || !player2) return;

        // Update scoreboard names
        nameXEl.textContent = player1;
        nameOEl.textContent = player2;

        // Show greeting
        greet.textContent = `Welcome ${player1} & ${player2}! 🎉`;
        greet.style.display = "block";

        playerDeclaration.textContent = `${player1} plays X  ·  ${player2} plays O`;
        playerDeclaration.style.display = "block";

        // Switch screens
        setupCard.classList.add("hide");
        gameScreen.classList.remove("hide");

        startBoard();
    });

    // ── Start / Reset board ───────────────────────────────────────────
    function startBoard() {
        turnX = true;
        count = 0;
        gameActive = true;
        moveHistory = [];
        clearWinLine();

        boxes.forEach((box) => {
            box.textContent = "";
            box.disabled = false;
            box.className = "box"; // strip all mark/winner/at-risk classes
        });

        winnerMsg.style.display = "none";
        drawMsg.style.display   = "none";

        updateScoreboardHighlight();
        updateCurrentPlayerDisplay();
    }

    // ── Box click ────────────────────────────────────────────────────
    boxes.forEach((box) => {
        box.addEventListener("click", () => {
            if (!gameActive || box.disabled) return;

            const symbol = turnX ? "X" : "O";
            const idx = parseInt(box.dataset.index);

            box.textContent = symbol;
            box.classList.add(turnX ? "x-mark" : "o-mark");
            box.classList.remove("at-risk-box"); // clear marker if this was the at-risk cell
            box.disabled = true;
            count++;

            // Track move order for Endless Mode
            moveHistory.push(idx);

            if (!checkWinner()) {
                if (count === 9) {
                    if (gameMode === "endless") {
                        handleEndlessRotate();
                    } else {
                        handleDraw();
                    }
                } else {
                    turnX = !turnX;
                    updateScoreboardHighlight();
                    updateCurrentPlayerDisplay();
                    if (gameMode === "endless") updateAtRiskHighlight();
                }
            }
        });
    });

    // ── Check winner ─────────────────────────────────────────────────
    function checkWinner() {
        for (const [a, b, c] of winPatterns) {
            const va = boxes[a].textContent;
            const vb = boxes[b].textContent;
            const vc = boxes[c].textContent;
            if (va && va === vb && vb === vc) {
                // Highlight winning cells
                boxes[a].classList.add("winning-box");
                boxes[b].classList.add("winning-box");
                boxes[c].classList.add("winning-box");

                drawWinLine([a, b, c]);

                const winner = va === "X" ? player1 : player2;
                winnerMsg.innerHTML = `🎉 ${winner} wins this round! 🏆`;
                winnerMsg.style.display = "block";

                scores[va]++;
                scoreValueX.textContent = scores.X;
                scoreValueO.textContent = scores.O;

                // Disable all boxes
                boxes.forEach(b => b.disabled = true);
                gameActive = false;
                currentPlayerDisplay.style.display = "none";
                return true;
            }
        }
        return false;
    }

    // ── Handle draw (Classic Mode only) ─────────────────────────────
    function handleDraw() {
        boxes.forEach(b => b.classList.add("draw-box"));
        drawMsg.innerHTML = `🤝 It's a draw! Great game!`;
        drawMsg.style.display = "block";
        scores.draws++;
        drawsValue.textContent = scores.draws;
        gameActive = false;
        currentPlayerDisplay.style.display = "none";
    }

    // ── Endless Mode: rotate oldest move off the board ────────────────
    function handleEndlessRotate() {
        // Remove the oldest placed cell
        const oldestIdx = moveHistory.shift();
        const oldestBox = boxes[oldestIdx];
        oldestBox.textContent = "";
        oldestBox.className   = "box"; // clear x-mark / o-mark
        oldestBox.disabled    = false;
        count--;

        // Swap turn and continue — no draw declared
        turnX = !turnX;
        updateScoreboardHighlight();
        updateCurrentPlayerDisplay();
        updateAtRiskHighlight();
    }

    // ── Highlight the next cell to be removed in Endless Mode ─────────
    function updateAtRiskHighlight() {
        boxes.forEach(b => b.classList.remove("at-risk-box"));
        if (gameMode === "endless" && moveHistory.length > 0) {
            boxes[moveHistory[0]].classList.add("at-risk-box");
        }
    }

    // ── Win line helpers ──────────────────────────────────────────────
    function drawWinLine(pattern) {
        const cfg = winLineConfigs[pattern.join(',')];
        if (!cfg) return;
        const line = document.getElementById('winLine');
        // Remove active to restart animation if called again
        line.classList.remove('active');
        line.style.top    = cfg.top;
        line.style.left   = cfg.left;
        line.style.width  = cfg.width;
        line.style.transform = `translate(-50%, -50%) rotate(${cfg.angle}deg)`;
        // Force reflow so removing/adding .active restarts the animation
        void line.offsetWidth;
        line.classList.add('active');
    }

    function clearWinLine() {
        const line = document.getElementById('winLine');
        line.classList.remove('active');
        line.style.display = '';
    }

    // ── UI helpers ───────────────────────────────────────────────────
    function updateCurrentPlayerDisplay() {
        if (!gameActive) return;
        const name   = turnX ? player1 : player2;
        const symbol = turnX ? "X" : "O";
        currentPlayerDisplay.textContent = `${name}'s turn (${symbol})`;
        currentPlayerDisplay.className   = `current-player ${turnX ? "x-turn" : "o-turn"}`;
        currentPlayerDisplay.style.display = "block";
    }

    function updateScoreboardHighlight() {
        scoreCardX.classList.toggle("active-turn",  turnX);
        scoreCardO.classList.toggle("active-turn", !turnX);
    }

    // ── Reset (next round) — keep names & scores ──────────────────────
    rstBtn.addEventListener("click", () => {
        startBoard();
    });

    // ── New Game — go back to setup screen, reset everything ──────────
    newGameBtn.addEventListener("click", () => {
        // Reset scores
        scores.X = 0; scores.O = 0; scores.draws = 0;
        scoreValueX.textContent = "0";
        scoreValueO.textContent = "0";
        drawsValue.textContent  = "0";

        // Clear inputs
        document.getElementById("firstPlayer").value  = "";
        document.getElementById("secondPlayer").value = "";

        // Switch back to setup
        gameScreen.classList.add("hide");
        setupCard.classList.remove("hide");

        // Hide status messages
        greet.style.display           = "none";
        playerDeclaration.style.display = "none";
        currentPlayerDisplay.style.display = "none";
        winnerMsg.style.display       = "none";
        drawMsg.style.display         = "none";
    });
});