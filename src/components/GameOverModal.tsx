import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Frown, Handshake } from 'lucide-react';
import type { PlayerSymbol } from '../game/rules.ts';
import { playClickSound } from '../utils/audio.ts';

interface GameOverModalProps {
  winner: PlayerSymbol | null;
  isDraw: boolean;
  mySymbol?: PlayerSymbol | null;
  winnerName?: string;
  myRematchRequested: boolean;
  opponentRematchRequested: boolean;
  onRematch: () => void;
  onHome: () => void;
  scores: { X: number; O: number; draws: number };
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  isDraw,
  mySymbol,
  winnerName,
  myRematchRequested,
  opponentRematchRequested,
  onRematch,
  onHome,
  scores,
}) => {
  const isMeWinner = mySymbol && winner === mySymbol;
  const isMeLoser = mySymbol && winner && winner !== mySymbol;

  useEffect(() => {
    if (winner && (!mySymbol || isMeWinner)) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: winner === 'X' ? ['#06b6d4', '#38bdf8', '#3b82f6'] : ['#f43f5e', '#fb7185', '#fb923c'],
      });
    }
  }, [winner, isMeWinner, mySymbol]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Outcome Icon & Header */}
        {isDraw ? (
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Handshake className="w-8 h-8" />
          </div>
        ) : isMeWinner ? (
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>
        ) : isMeLoser ? (
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <Frown className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
            <Trophy className="w-8 h-8" />
          </div>
        )}

        {/* Title */}
        <h2 className="text-2xl font-black text-center tracking-tight text-white mb-1">
          {isDraw
            ? 'Deu Velha! Empate!'
            : isMeWinner
            ? 'Você Venceu!'
            : isMeLoser
            ? 'Não foi dessa vez!'
            : `Vitória de ${winnerName || `Jogador ${winner}`}!`}
        </h2>

        <p className="text-xs text-slate-400 text-center mb-5">
          {isDraw
            ? 'Ninguém cedeu espaço. Prontos para o desempate?'
            : isMeWinner
            ? 'Excelente jogada! O adversário foi superado.'
            : isMeLoser
            ? 'Seu adversário fechou a linha. Peça a revanche!'
            : `O símbolo ${winner} completou a sequência.`}
        </p>

        {/* Score Board Cards */}
        <div className="w-full grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-cyan-400 uppercase">Vitórias X</span>
            <span className="text-lg font-black text-slate-100 font-mono tabular-nums">{scores.X}</span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Empates</span>
            <span className="text-lg font-black text-slate-100 font-mono tabular-nums">{scores.draws}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Vitórias O</span>
            <span className="text-lg font-black text-slate-100 font-mono tabular-nums">{scores.O}</span>
          </div>
        </div>

        {/* Rematch status notification */}
        {opponentRematchRequested && !myRematchRequested && (
          <div className="w-full mb-3 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-center text-xs font-semibold text-cyan-300 animate-pulse">
            Oponente quer revanche! Toque para aceitar:
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            data-start="true"
            onClick={() => {
              playClickSound();
              onRematch();
            }}
            disabled={myRematchRequested}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm shadow-lg transition active:scale-98 cursor-pointer ${
              myRematchRequested
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-950/40 hover:from-cyan-400 hover:to-blue-500'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${myRematchRequested ? 'animate-spin' : ''}`} />
            <span>
              {myRematchRequested
                ? 'Aguardando oponente...'
                : opponentRematchRequested
                ? 'Aceitar Revanche'
                : 'Jogar Novamente (Revanche)'}
            </span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              onHome();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition active:scale-98"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Voltar ao Menu Principal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
