const chatPresets = document.querySelector(".mchat__presets");
const chatInput = document.querySelector(".mchat__content input");

const board = document.querySelector(".main-board .cg-wrap");
const boardOrientation = board.classList.contains("orientation-black");
const playerColor = boardOrientation ? "black" : "white";

if (chatPresets) {
    // Clear existing shortcuts
    chatPresets.innerHTML = "";
}
console.log("playerColor", playerColor);
if (document.querySelector(".mchat__content")) {
    const shortcutSiblingContainer = document.createElement("div");
    shortcutSiblingContainer.id = "chatPresetsSiblingContainer";
    shortcutSiblingContainer.classList.add("mchat__presets2");
    console.log(shortcutSiblingContainer);
    document.querySelector(".mchat__content").insertBefore(shortcutSiblingContainer, null);

    const customShortcuts = [
        { title: "google en passant", text: "gep" },
        { title: "Holy hell!", text: "response" },
        {
            title: 'Are you kidding ??? What the **** are you talking about man ? You are a biggest looser i ever seen in my life ! You was doing PIPI in your pampers when i was beating players much more stronger then you! You are not proffesional, because proffesionals knew how to lose and congratulate opponents, you are like a girl crying after i beat you! Be brave, be honest to yourself and stop this trush talkings!!! Everybody know that i am very good blitz player, i can win anyone in the world in single game! And "w"esley "s"o is nobody for me, just a player who are crying every single time when loosing, ( remember what you say about Firouzja ) !!! Stop playing with my name, i deserve to have a good name during whole my chess carrier, I am Officially inviting you to OTB blitz match with the Prize fund! Both of us will invest 5000$ and winner takes it all! I suggest all other people who\'s intrested in this situation, just take a look at my results in 2016 and 2017 Blitz World championships, and that should be enough... No need to listen for every crying babe, Tigran Petrosyan is always play Fair ! And if someone will continue Officially talk about me like that, we will meet in Court! God bless with true! True will never die ! Liers will kicked off...',
            text: "pipi",
        },
        { title: `What should I do in this position? I am ${playerColor} btw`, text: "help" },
    ];

    customShortcuts.forEach((shortcut) => {
        const span = document.createElement("span");
        span.title = shortcut.title;
        span.textContent = shortcut.text;

        // Add a click event listener to each shortcut
        span.addEventListener("click", async () => {
            // check length of the message
            if (shortcut.title.length > 140) {
                let remaining = shortcut.title;
                while (remaining.length > 0) {
                    // Find the slice point within 140 characters, stopping at the last whitespace
                    let slicePoint = 140;
                    if (remaining.length > 140) {
                        const lastSpace = remaining.slice(0, 140).lastIndexOf(" ");
                        if (lastSpace !== -1) {
                            slicePoint = lastSpace;
                        }
                    }

                    chatInput.value = remaining.slice(0, slicePoint);
                    remaining = remaining.slice(slicePoint).trim(); // Remove leading spaces
                    chatInput.dispatchEvent(new Event("input", { bubbles: true }));
                    chatInput.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
                    );

                    // wait for 2 seconds
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            } else {
                // Insert the text into the chat input
                chatInput.value = shortcut.title;

                // Simulate sending the message (optional)
                chatInput.dispatchEvent(new Event("input", { bubbles: true }));
                chatInput.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
                );
            }
        });

        // Add the span to the container
        shortcutSiblingContainer.appendChild(span);

        const style = document.createElement("style");
        style.textContent = `
    .mchat__presets2 span {
        flex: 1 1 auto;
        text-align: center;
        display: block;
        opacity: .8;
        border: 1px solid var(--c-border);
        border-width: 1px 1px 0 0;
        font-size: .9em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 150ms;
    }

    .mchat__presets2 {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    flex-flow: row nowrap;
    line-height: 1.4em;
    user-select: none
    }
`;

        // Append the style to the head
        document.head.appendChild(style);
    });
}

// check for en passant

function getBoardWidth(element) {
    if (!element) {
        console.error("Element not found!");
        return null;
    }

    // Get the style attribute directly
    const style = element.getAttribute("style");
    if (style) {
        // Match the width value using a regex
        const widthMatch = style.match(/width:\s*(\d+)px/);
        if (widthMatch) {
            return parseInt(widthMatch[1], 10); // Extract and return the width
        }
    }

    // Alternatively, use computed styles
    const computedWidth = window.getComputedStyle(element).width;
    return parseFloat(computedWidth);
}

function calculateBoardPosition(x, y, boardSize) {
    const squareSize = boardSize / 8; // Size of each square

    // Calculate the row and column based on x and y
    const col = Math.floor(x / squareSize); // File: a=0, b=1, ..., h=7
    const row = 7 - Math.floor(y / squareSize); // Rank: 8=0, 7=1, ..., 1=7 (invert y)

    return [row, col];
}

// Function to extract translate(x, y) values
function extractTranslateValues(element) {
    if (!element) {
        console.error("Element not found!");
        return null;
    }

    // Get the transform property
    const transform = window.getComputedStyle(element).transform;

    if (!transform || transform === "none") {
        console.warn("No transform property found!");
        return null;
    }

    // Extract translate(x, y) values using regex
    const matrixMatch = transform.match(
        /matrix\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)\)/
    );
    if (matrixMatch) {
        const translateX = parseFloat(matrixMatch[5]); // X value
        const translateY = parseFloat(matrixMatch[6]); // Y value
        return { x: translateX, y: translateY };
    }

    const translateMatch = transform.match(/translate\(([^,]+),\s*([^,]+)\)/);
    if (translateMatch) {
        const translateX = parseFloat(translateMatch[1]); // X value
        const translateY = parseFloat(translateMatch[2]); // Y value
        return { x: translateX, y: translateY };
    }

    console.warn("No translate values found!");
    return null;
}

let currentEnPassant = null; // Track the current en passant position

function createBlockOverlays(boardElement, boardSize, enPassantPosition, pawnPosition) {
    cleanupOverlay(); // Remove any existing overlays

    const squareSize = boardSize / 8;

    // Create a container for overlays
    const overlayContainer = document.createElement("div");
    overlayContainer.id = "en-passant-overlay";
    overlayContainer.style.position = "absolute";
    overlayContainer.style.top = "0";
    overlayContainer.style.left = "0";
    overlayContainer.style.width = `${boardSize}px`;
    overlayContainer.style.height = `${boardSize}px`;
    overlayContainer.style.pointerEvents = "none"; // Allows only child overlays to handle clicks
    overlayContainer.style.zIndex = "1000";

    // Calculate positions for the pawn and en passant square
    const pawnCol = Math.floor(pawnPosition.x / squareSize);
    const pawnRow = Math.floor((boardSize - pawnPosition.y) / squareSize);
    const enPassantCol = Math.floor(enPassantPosition.x / squareSize);
    const enPassantRow = Math.floor((boardSize - enPassantPosition.y) / squareSize);

    // Loop through all board squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Skip the en passant pawn and en passant square
            if (
                (row === pawnRow && col === pawnCol) ||
                (row === enPassantRow && col === enPassantCol)
            ) {
                continue;
            }

            // Create an overlay for this square
            const squareOverlay = document.createElement("div");
            squareOverlay.style.position = "absolute";
            squareOverlay.style.width = `${squareSize}px`;
            squareOverlay.style.height = `${squareSize}px`;
            squareOverlay.style.left = `${col * squareSize}px`;
            squareOverlay.style.top = `${(7 - row) * squareSize}px`; // Reverse Y for row
            squareOverlay.style.pointerEvents = "auto"; // Blocks clicks
            //squareOverlay.style.cursor = "not-allowed"; // Visual feedback we don't need that

            // Add the square overlay to the container
            overlayContainer.appendChild(squareOverlay);
        }
    }

    // Append the overlay container to the board
    boardElement.appendChild(overlayContainer);

    // Track the current en passant position
    currentEnPassant = enPassantPosition;
}

// Cleanup function to remove overlays
function cleanupOverlay() {
    const overlay = document.getElementById("en-passant-overlay");
    if (overlay) {
        overlay.remove();
        currentEnPassant = null; // Reset the tracked en passant position
    }
}

// remove overlay
function cleanupOverlay() {
    const overlay = document.getElementById("en-passant-overlay");
    if (overlay) {
        overlay.remove();
        currentEnPassant = null; // Reset the tracked en passant position
    }
}

function checkEnPassant(lastMoveStart, lastMoveEnd, boardSize, pawns, playerColor) {
    const [startRow, startCol] = calculateBoardPosition(
        lastMoveStart.x,
        lastMoveStart.y,
        boardSize
    );
    const [endRow, endCol] = calculateBoardPosition(lastMoveEnd.x, lastMoveEnd.y, boardSize);
    // Ensure the move was a pawn moving two squares forward
    if (Math.abs(endRow - startRow) === 2 && Math.abs(endCol - startCol) === 0) {
        const enPassantRow = (startRow + endRow) / 2;
        const opponentColor = playerColor === "white" ? "black" : "white";
        const rowOffset = 1;
        // Check adjacent files for opponent pawns
        const adjacentCols = [endCol - 1, endCol + 1].filter((col) => col >= 0 && col < 8);

        for (const col of adjacentCols) {
            const pawn = pawns.find((p) => {
                const [pawnRow, pawnCol] = calculateBoardPosition(
                    p.position.x,
                    p.position.y,
                    boardSize
                );
                return (
                    pawnRow + rowOffset === enPassantRow &&
                    pawnCol === col &&
                    p.color === playerColor // debug here and check if you have 2 possibilities what happens then.
                );
            });

            if (pawn) {
                const boardElement = document.querySelector("cg-container");
                const enPassantPosition = {
                    x: endCol * (boardSize / 8),
                    y: (8 - enPassantRow) * (boardSize / 8), // Reverse Y
                };
                const pawnPosition = {
                    x: col * (boardSize / 8),
                    y: (8 - enPassantRow + rowOffset) * (boardSize / 8), // Reverse Y
                };

                // Check if en passant position has changed
                if (
                    !currentEnPassant ||
                    currentEnPassant.x !== enPassantPosition.x ||
                    currentEnPassant.y !== enPassantPosition.y
                ) {
                    createBlockOverlays(boardElement, boardSize, enPassantPosition, pawnPosition);
                }

                return { enPassant: true, position: [enPassantRow, endCol] };
            }
        }
    }

    // No en passant possible, cleanup overlay
    cleanupOverlay();
    return { enPassant: false };
}

function onComponentChange(playerColor) {
    const lastMoveElements = targetNode.querySelectorAll(".last-move");
    if (lastMoveElements.length < 2) return;

    const board = document.querySelector("cg-container");
    const boardSize = getBoardWidth(board);

    // Get the start and end positions of the last move
    const lastMoveStart = extractTranslateValues(lastMoveElements[0]);
    const lastMoveEnd = extractTranslateValues(lastMoveElements[1]);

    // Get all pawns and their positions
    const pawns = Array.from(document.querySelectorAll('piece[class*="pawn"]')).map((pawn) => {
        const position = extractTranslateValues(pawn);
        const color = pawn.classList.contains("black") ? "black" : "white";
        return { element: pawn, position, color };
    });

    // Check for en passant
    if (checkEnPassant(lastMoveStart, lastMoveEnd, boardSize, pawns, playerColor).enPassant) {
        removeMoveDestElements();
        removeStraightMoveElements();
    }
}

// Setup MutationObserver
const targetNode = document.querySelector("cg-container"); // Target the cg-container
const config = { childList: true, subtree: true, attributes: true }; // Observe child changes, subtree, and attributes

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        // React to changes
        if (mutation.type === "childList" || mutation.type === "attributes") {
            onComponentChange(playerColor);
            break;
        }
    }
});

function removeMoveDestElements() {
    // Select all elements with the "move-dest oc" class
    const moveDestElements = board.querySelectorAll(".move-dest.oc");

    // Loop through and remove each element
    moveDestElements.forEach((element) => {
        element.remove();
    });
}

function removeStraightMoveElements() {
    // Select all "move-dest" elements
    const moveDestElements = board.querySelectorAll(".move-dest");

    // Select the currently selected square

    const selectedElement = board.querySelector(".selected");
    if (!selectedElement) {
        return;
    }

    const selectedX = extractTranslateValues(selectedElement).x;

    // Loop through "move-dest" elements and remove if their X matches the selected X
    moveDestElements.forEach((element) => {
        const moveX = extractTranslateValues(element).x;

        if (moveX === selectedX) {
            element.remove();
        }
    });
}

if (targetNode) {
    observer.observe(targetNode, config);
} else {
    console.error("Target node not found!");
}

onComponentChange(playerColor);
