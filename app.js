document.addEventListener("DOMContentLoaded", () => {
            const container = document.querySelector(".container");
            const greet = document.querySelector(".greeting");
            const form = document.querySelector("#playerForm");
            let boxes = document.querySelectorAll(".box");
            let rstBtn = document.querySelector("#rstBtn");
            let winnerMsg = document.querySelector(".winnerMsg");
            let drawMsg = document.querySelector(".drawMsg");
            let playerDeclaration = document.querySelector(".playerDeclaration");
            let currentPlayerDisplay = document.querySelector(".current-player");
            
            let firstPlayer = "";
            let secondPlayer = "";
            let count = 0;
            let gameActive = false;

            const winPattern = [
                [0, 1, 2],
                [0, 3, 6],
                [0, 4, 8],
                [1, 4, 7],
                [2, 5, 8],
                [2, 4, 6],
                [3, 4, 5],
                [6, 7, 8]
            ];

            let turnO = true;

            form.addEventListener("submit", (e) => {
                e.preventDefault();

                firstPlayer = document.querySelector("#firstPlayer").value.trim();
                secondPlayer = document.querySelector("#secondPlayer").value.trim();

                if (!firstPlayer || !secondPlayer) {
                    alert("Please enter both player names!");
                    return;
                }

                greet.innerText = `Welcome to the game ${firstPlayer} and ${secondPlayer}! 🎉`;
                greet.style.display = "block";

                playerDeclaration.innerText = `${firstPlayer} is playing with O and ${secondPlayer} is playing with X`;
                playerDeclaration.style.display = "block";

                updateCurrentPlayer();

                form.style.display = "none";
                container.classList.remove("hide");
                container.style.visibility = "visible";
                rstBtn.classList.remove("hide");
                gameActive = true;
            });

            function updateCurrentPlayer() {
                if (gameActive) {
                    const currentPlayer = turnO ? firstPlayer : secondPlayer;
                    const currentSymbol = turnO ? "O" : "X";
                    currentPlayerDisplay.innerText = `${currentPlayer}'s turn (${currentSymbol})`;
                    currentPlayerDisplay.style.display = "block";
                }
            }

            boxes.forEach((box) => {
                box.addEventListener("click", () => {
                    if (!gameActive) return;
                    
                    console.log("Button clicked");
                    
                    if (turnO) {
                        turnO = false;
                        box.innerText = "O";
                    } else {
                        turnO = true;
                        box.innerText = "X";
                    }
                    
                    count++;
                    box.disabled = true;
                    
                    if (!checkWinner()) {
                        checkDraw();
                        updateCurrentPlayer();
                    }
                    
                    console.log("Move count:", count);
                });
            });

            const checkWinner = () => {
                for (let pattern of winPattern) {
                    let posVal1 = boxes[pattern[0]].innerText;
                    let posVal2 = boxes[pattern[1]].innerText;
                    let posVal3 = boxes[pattern[2]].innerText;

                    if (posVal1 !== "" && posVal2 !== "" && posVal3 !== "") {
                        if (posVal1 === posVal2 && posVal2 === posVal3) {
                            boxes[pattern[0]].classList.add("winning-box");
                            boxes[pattern[1]].classList.add("winning-box");
                            boxes[pattern[2]].classList.add("winning-box");

                            console.log("Winner:", posVal1);
                            
                            const winner = posVal1 === "O" ? firstPlayer : secondPlayer;
                            winnerMsg.innerHTML = `🎉 ${winner} wins the game! 🏆<br><br>Click reset to start another round`;
                            winnerMsg.style.display = "block";

                            boxes.forEach((box) => {
                                box.disabled = true;
                            });

                            gameActive = false;
                            currentPlayerDisplay.style.display = "none";
                            return true;
                        }
                    }
                }
                return false;
            };

            function checkDraw() {
                if (count === 9 && gameActive) {
                    drawMsg.style.display = "block";
                    drawMsg.innerHTML = `🤝 It's a draw! 🤝<br><br>Great game! Click reset to play again`;
                    gameActive = false;
                    currentPlayerDisplay.style.display = "none";
                }
            }

            function resetBoard() {
                boxes.forEach((box) => {
                    box.innerText = "";
                    box.disabled = false;
                    box.classList.remove("winning-box");
                    box.style.backgroundColor = "#ffddd2";
                });
                
                turnO = true;
                count = 0;
                gameActive = true;
                
                winnerMsg.style.display = "none";
                drawMsg.style.display = "none";
                
                if (firstPlayer && secondPlayer) {
                    updateCurrentPlayer();
                }
            }

            rstBtn.addEventListener("click", resetBoard);
        });