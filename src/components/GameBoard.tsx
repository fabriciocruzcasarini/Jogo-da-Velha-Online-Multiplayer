import React from 'react';
import type { BoardState, PlayerSymbol } from '../game/rules.ts';

interface GameBoardProps {
  board: BoardState;
  onCellClick: (index: number) => void;
  isMyTurn: boolean;
  mySymbol?: PlayerSymbol | null;
  winningLine: [number, number, number] | null;
  disabled?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  isMyTurn,
  mySymbol,
  winningLine,
  disabled = false,
}) => {
  const isWinningCell = (index: number) => {
    return winningLine !== null && winningLine.includes(index);
  };

  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square mx-auto p-3 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-cyan-950/30">
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 grid-rows-3 gap-2.5 w-full h-full">
        {board.map((cell, index) => {
          const isWinner = isWinningCell(index);
          const canClick = !disabled && cell === null && isMyTurn;

          return (
            <button
              key={index}
              onClick={() => onCellClick(index)}
              disabled={!canClick}
              aria-label={`Casa ${index + 1}, ${cell ? `Marcada com ${cell}` : 'Vazia'}`}
              className={`relative flex items-center justify-center rounded-2xl transition-all duration-150 select-none cursor-pointer ${
                cell === null
                  ? canClick
                    ? 'bg-slate-950 hover:bg-slate-800/80 active:scale-95 border border-slate-800 hover:border-cyan-500/50'
                    : 'bg-slate-950/60 border border-slate-800/60 cursor-not-allowed'
                  : isWinner
                  ? cell === 'X'
                    ? 'bg-cyan-950/60 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] scale-[1.02]'
                    : 'bg-rose-950/60 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)] scale-[1.02]'
                  : 'bg-slate-950 border border-slate-800/90'
              }`}
            >
              {cell === 'X' && (
                <svg
                  viewBox="0 0 100 100"
                  className={`w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] ${
                    isWinner ? 'animate-pulse' : ''
                  }`}
                >
                  <line
                    x1="22"
                    y1="22"
                    x2="78"
                    y2="78"
                    stroke="#22d3ee"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  <line
                    x1="78"
                    y1="22"
                    x2="22"
                    y2="78"
                    stroke="#06b6d4"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {cell === 'O' && (
                <svg
                  viewBox="0 0 100 100"
                  className={`w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] ${
                    isWinner ? 'animate-pulse' : ''
                  }`}
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Ghost preview for the current player on empty hoverable cell */}
              {cell === null && canClick && (
                <span className="opacity-0 hover:opacity-20 text-3xl font-black text-slate-400 transition pointer-events-none">
                  {mySymbol || 'X'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
