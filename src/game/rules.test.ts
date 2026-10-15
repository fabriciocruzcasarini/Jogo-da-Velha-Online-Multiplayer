import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkWinner,
  createEmptyBoard,
  generateRoomCode,
  getBestMove,
  isMoveValid,
  WINNING_COMBINATIONS,
  type BoardState,
} from './rules.ts';

test('createEmptyBoard initializes with 9 null values', () => {
  const board = createEmptyBoard();
  assert.equal(board.length, 9);
  assert.equal(board.every((c) => c === null), true);
});

test('checkWinner detects row victory for X', () => {
  const board: BoardState = [
    'X', 'X', 'X',
    'O', 'O', null,
    null, null, null,
  ];
  const res = checkWinner(board);
  assert.equal(res.winner, 'X');
  assert.deepEqual(res.line, [0, 1, 2]);
  assert.equal(res.isDraw, false);
});

test('checkWinner detects column victory for O', () => {
  const board: BoardState = [
    'O', 'X', 'X',
    'O', 'X', null,
    'O', null, null,
  ];
  const res = checkWinner(board);
  assert.equal(res.winner, 'O');
  assert.deepEqual(res.line, [0, 3, 6]);
  assert.equal(res.isDraw, false);
});

test('checkWinner detects diagonal victory', () => {
  const board: BoardState = [
    'X', 'O', 'O',
    null, 'X', null,
    null, null, 'X',
  ];
  const res = checkWinner(board);
  assert.equal(res.winner, 'X');
  assert.deepEqual(res.line, [0, 4, 8]);
  assert.equal(res.isDraw, false);
});

test('checkWinner detects draw when board is full and no winner', () => {
  const board: BoardState = [
    'X', 'O', 'X',
    'X', 'O', 'O',
    'O', 'X', 'X',
  ];
  const res = checkWinner(board);
  assert.equal(res.winner, null);
  assert.equal(res.line, null);
  assert.equal(res.isDraw, true);
});

test('checkWinner ongoing game is not draw and has no winner', () => {
  const board: BoardState = [
    'X', null, 'O',
    null, 'X', null,
    null, null, null,
  ];
  const res = checkWinner(board);
  assert.equal(res.winner, null);
  assert.equal(res.line, null);
  assert.equal(res.isDraw, false);
});

test('isMoveValid validates boundaries and empty cells', () => {
  const board: BoardState = ['X', null, null, null, null, null, null, null, null];
  assert.equal(isMoveValid(board, 0), false); // occupied
  assert.equal(isMoveValid(board, 1), true); // valid
  assert.equal(isMoveValid(board, -1), false); // out of bounds
  assert.equal(isMoveValid(board, 9), false); // out of bounds
});

test('generateRoomCode generates 4 uppercase alphanumeric characters', () => {
  const code = generateRoomCode();
  assert.equal(code.length, 4);
  assert.match(code, /^[A-Z0-9]{4}$/);
});

test('getBestMove blocks opponent winning move in hard mode', () => {
  // Opponent X is about to win at cell 2: [0]='X', [1]='X', [2]=null
  const board: BoardState = [
    'X', 'X', null,
    'O', null, null,
    null, null, null,
  ];
  const move = getBestMove(board, 'O', 'hard');
  assert.equal(move, 2, 'Bot should block the winning line at index 2');
});

test('getBestMove takes winning move when available in hard mode', () => {
  // Bot O can win at index 2: [0]='O', [1]='O', [2]=null
  const board: BoardState = [
    'O', 'O', null,
    'X', 'X', null,
    null, null, null,
  ];
  const move = getBestMove(board, 'O', 'hard');
  assert.equal(move, 2, 'Bot should immediately take the winning move');
});
