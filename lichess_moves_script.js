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
            return row === fromRow && col === fromCol;
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
        console.log("Adjacent opposite pawns:", adjacentOppositePawns);
    }
    console.log(Math.abs(fromRow - toRow));
}

function onPlayersTurn() {
    const lastMoveElements = board.querySelectorAll(".last-move");
    if (lastMoveElements.length < 2) return; // no move has been made yet

    const boardSize = getElementWidth(board);

    const lastMove = {
        from: extractTranslateValues(lastMoveElements[1]),
        to: extractTranslateValues(lastMoveElements[0]),
    };

    checkForEnPassant(board, boardSize, lastMove);
}
