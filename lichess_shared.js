/**
 * This script includes shared functions on Lichess.
 * - DEBUG_CHESS2 variable
 * - playerColor variable
 */

const DEBUG_CHESS2 = false;

function getIsBlackBoardOrientation() {
    const board = document.querySelector(".main-board .cg-wrap");
    if (board) {
        const boardOrientation = board.classList.contains("orientation-black");
        return boardOrientation;
    } else {
        return false;
    }
}
const playerColor = getIsBlackBoardOrientation() ? "black" : "white"; // defaults to white
