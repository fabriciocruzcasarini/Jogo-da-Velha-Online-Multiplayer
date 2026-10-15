/**
 * Pure game logic for Tic-Tac-Toe (Jogo da Velha)
 * Compatible with Node.js native test runner and frontend.
 */

export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | null)[];

export interface WinResult {
  winner: PlayerSymbol | null;
  line: [number, number, number] | null;
  isDraw: boolean;
}

export const WINNING_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2], // Row 0
  [3, 4, 5], // Row 1
  [6, 7, 8], // Row 2
  [0, 3, 6], // Col 0
  [1, 4, 7], // Col 1
  [2, 5, 8], // Col 2
  [0, 4, 8], // Diagonal 1
  [2, 4, 6], // Diagonal 2
];

export function createEmptyBoard(): BoardState {
  return [null, null, null, null, null, null, null, null, null];
}

export function checkWinner(board: BoardState): WinResult {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: combo,
        isDraw: false,
      };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  return {
    winner: null,
    line: null,
    isDraw: isFull,
  };
}

export function isMoveValid(board: BoardState, index: number): boolean {
  if (index < 0 || index > 8) return false;
  return board[index] === null;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Minimax AI for Single Player mode
 */
export function getBestMove(
  board: BoardState,
  botSymbol: PlayerSymbol,
  difficulty: 'easy' | 'medium' | 'hard' = 'hard'
): number {
  const humanSymbol: PlayerSymbol = botSymbol === 'X' ? 'O' : 'X';
  const availableMoves: number[] = [];

  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      availableMoves.push(i);
    }
  }

  if (availableMoves.length === 0) return -1;

  // Easy: mostly random
  if (difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Medium: 50% minimax, 50% random
  if (difficulty === 'medium' && Math.random() < 0.4) {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Check if bot can win immediately
  for (const move of availableMoves) {
    const clone = [...board];
    clone[move] = botSymbol;
    if (checkWinner(clone).winner === botSymbol) {
      return move;
    }
  }

  // Check if human can win and block
  for (const move of availableMoves) {
    const clone = [...board];
    clone[move] = humanSymbol;
    if (checkWinner(clone).winner === humanSymbol) {
      return move;
    }
  }

  // Minimax algorithm for optimal move
  function minimax(currentBoard: BoardState, depth: number, isMaximizing: boolean): number {
    const res = checkWinner(currentBoard);
    if (res.winner === botSymbol) return 10 - depth;
    if (res.winner === humanSymbol) return depth - 10;
    if (res.isDraw) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = botSymbol;
          const ev = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          maxEval = Math.max(maxEval, ev);
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = humanSymbol;
          const ev = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          minEval = Math.min(minEval, ev);
        }
      }
      return minEval;
    }
  }

  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (const move of availableMoves) {
    const clone = [...board];
    clone[move] = botSymbol;
    const score = minimax(clone, 0, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
