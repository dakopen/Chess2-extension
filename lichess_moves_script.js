/**
 * This script implements the rules of Chess 2 on Lichess.
 * -
 */

let playersTurn = !!document.querySelector(".rclock-bottom .rclock-turn__text");
const clockContainer = document.querySelector(".rclock.rclock-turn.rclock-bottom");

const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
        if (mutation.type === "childList" || mutation.type === "attributes") {
            // if the text element saying "Your turn" is present at the bottom of the clock
            const isTurnTextPresent = !!document.querySelector(".rclock-bottom .rclock-turn__text");

            // check if the board is reversed:
            const reverse = (getIsBlackBoardOrientation() ? "black" : "white") !== playerColor;
            if (reverse) {
                playersTurn = !isTurnTextPresent;
            } else {
                playersTurn = isTurnTextPresent;
            }

            if (playersTurn) {
                console.log("It is your turn");
                onPlayersTurn();
            } else {
                console.log("It is not your turn");
            }
        }
    });
});

const config = { childList: true, subtree: true, attributes: true };

// Start observing the if a game is running
if (clockContainer) {
    observer.observe(clockContainer, config);
}

const board = document.querySelector("cg-container");
let isEnPassantPawns;

function getElementWidth(element) {
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

// Function to calculate the board position based on x and y coordinates
function calculateBoardPosition(x, y, boardSize) {
    const squareSize = boardSize / 8; // Size of each square

    // Calculate the row and column based on x and y
    const col = Math.floor(x / squareSize); // File: a=0, b=1, ..., h=7
    const row = Math.floor(y / squareSize); // Rank: 0=0, 1=1, ..., 7=7

    return [row, col];
}

function cleanupOverlay() {
    const overlay = document.getElementById("en-passant-overlay");
    if (overlay) {
        overlay.remove();
    }
}

function createOverlay(board, boardSize, enPassantPosition, enPassantPawns) {
    cleanupOverlay(); // Cleanup any existing overlay

    const squareSize = boardSize / 8; // Size of each square

    // Create a new overlay element
    const overlayContainer = document.createElement("div");
    overlayContainer.id = "en-passant-overlay";
    overlayContainer.style.position = "absolute";
    overlayContainer.style.top = "0";
    overlayContainer.style.left = "0";
    overlayContainer.style.width = `${boardSize}px`;
    overlayContainer.style.height = `${boardSize}px`;
    overlayContainer.style.pointerEvents = "none"; // Allows only child overlays to handle clicks
    overlayContainer.style.zIndex = "1000";

    // loop through all the board squares
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // skip the square if it is an en passant square
            if (row === enPassantPosition[0] && col === enPassantPosition[1]) continue;
            // Check if the square is on the enPassantPawns position
            const isEnPassantPawn = enPassantPawns.some((enPassantPawn) => {
                const [pawnRow, pawnCol] = enPassantPawn.position;
                return row === pawnRow && col === pawnCol;
            });
            if (isEnPassantPawn) continue;

            // Create a new overlay square
            const squareOverlay = document.createElement("div");
            squareOverlay.style.position = "absolute";
            squareOverlay.style.width = `${squareSize}px`;
            squareOverlay.style.height = `${squareSize}px`;
            squareOverlay.style.left = `${col * squareSize}px`;
            squareOverlay.style.top = `${row * squareSize}px`;
            squareOverlay.style.pointerEvents = "auto"; // Blocks clicks
            squareOverlay.style.cursor = "not-allowed"; // Visual feedback
            overlayContainer.appendChild(squareOverlay);
        }
    }

    // Append the overlay container to the board
    board.appendChild(overlayContainer);
}

function checkForEnPassant(board, boardSize, lastMove) {
    const { from, to } = lastMove;
    // get all the pawns and their positions
    const pawns = Array.from(board.querySelectorAll('piece[class*="pawn"]'))
        .filter((pawn) => !pawn.classList.contains("ghost")) // Exclude pawns with the class "ghost"
        .map((pawn) => {
            const position = extractTranslateValues(pawn);
            const color = pawn.classList.contains("black") ? "black" : "white";
            return {
                element: pawn,
                position: calculateBoardPosition(position.x, position.y, boardSize),
                color,
            };
        });
    const [fromRow, fromCol] = calculateBoardPosition(from.x, from.y, boardSize);

    const [toRow, toCol] = calculateBoardPosition(to.x, to.y, boardSize);
    if (Math.abs(fromRow - toRow) === 2 && fromCol === toCol) {
        // possible en passant move:
        // check if toRow and toCol is a pawn
        const pawn = pawns.find((pawn) => {
            const [row, col] = pawn.position;
            return row === toRow && col === toCol;
        });
        if (!pawn) return;
        // get adjacent fields of the pawn
        const adjacentFields = [];
        if (toCol > 0) adjacentFields.push([toRow, toCol - 1]);
        if (toCol < 7) adjacentFields.push([toRow, toCol + 1]);
        // check if a pawn of the opposite color is on the adjacent field
        const oppositeColor = pawn.color === "black" ? "white" : "black";
        const adjacentOppositePawns = pawns.filter((pawn) => {
            const [row, col] = pawn.position;

            // Check if the pawn's position matches any adjacent field and is of the opposite color
            return (
                pawn.color === oppositeColor &&
                adjacentFields.some(([adjRow, adjCol]) => row === adjRow && col === adjCol)
            );
        });
        if (adjacentOppositePawns.length === 0) return; // no pawn can en passant
        // create an overlay so the user can only select the en passant pawns and only do en passant
        let enPassantPosition;
        if (fromRow === 1) {
            enPassantPosition = [2, fromCol]; // fromRow + 1
        } else if (fromRow === 6) {
            enPassantPosition = [5, fromCol]; // fromRow - 1
        } else {
            return; // not valid
        }
        createOverlay(board, boardSize, enPassantPosition, adjacentOppositePawns);
        return adjacentOppositePawns;
    }
    console.log(Math.abs(fromRow - toRow));
}

function removeImpossibleMoveDestinations(pawn) {
    // remove all "hitting another piece diagonal" moves
    const moveDestinations = board.querySelectorAll(".move-dest.oc");
    // Loop through and remove each element
    moveDestinations.forEach((element) => {
        element.remove();
    });
    // remove all "going straight" moves
    const moveDestinations2 = board.querySelectorAll(".move-dest");
    moveDestinations2.forEach((element) => {
        const movePosition = extractTranslateValues(element);
        const move = calculateBoardPosition(movePosition.x, movePosition.y, getElementWidth(board));
        console.log(move, pawn.position);
        if (move[1] === pawn.position[1]) {
            // same column = straight move
            element.remove();
        }
    });
}

function onPlayersTurn() {
    const lastMoveElements = board.querySelectorAll(".last-move");
    if (lastMoveElements.length < 2) return; // no move has been made yet

    const boardSize = getElementWidth(board);

    const lastMove = {
        from: extractTranslateValues(lastMoveElements[1]),
        to: extractTranslateValues(lastMoveElements[0]),
    };

    isEnPassantPawns = checkForEnPassant(board, boardSize, lastMove);
    console.log("isEnPassant", isEnPassantPawns);
    if (isEnPassantPawns) {
        // remove Move destinations:
    } else {
        cleanupOverlay();
    }
    // Note: There is a bug when you request a takeback after en passant I am NOT
    // fixing it. Why would you request a takeback after en passant? Are you stupid?
}

onPlayersTurn();

