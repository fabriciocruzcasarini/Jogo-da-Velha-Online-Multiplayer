import React from 'react';
import { Volume2, VolumeX, ArrowLeft, Wifi } from 'lucide-react';
import type { PlayerSymbol } from '../game/rules.ts';
import { playClickSound } from '../utils/audio.ts';

interface PlayerInfo {
  name: string;
  symbol: PlayerSymbol;
  score: number;
  isMe: boolean;
  connected?: boolean;
}

interface PlayerHUDProps {
  playerX: PlayerInfo;
  playerO: PlayerInfo;
  currentTurn: PlayerSymbol;
  draws: number;
  isOnline: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLeave: () => void;
  modeLabel?: string;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({
  playerX,
  playerO,
  currentTurn,
  draws,
  isOnline,
  muted,
  onToggleMute,
  onLeave,
  modeLabel = 'Online',
}) => {
  const isTurnX = currentTurn === 'X';

  return (
    <div className="w-full max-w-md mx-auto mb-3 select-none">
      {/* Top utility row */}
      <div className="flex items-center justify-between px-2 mb-2">
        <button
          onClick={() => {
            playClickSound();
            onLeave();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold active:scale-95 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{modeLabel}</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Ativar som' : 'Desativar som'}
            className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Players Versus Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Player X Card */}
        <div
          className={`relative p-3 rounded-2xl transition-all duration-200 border ${
            isTurnX
              ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
              : 'bg-slate-950/70 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-sm">
              X
            </span>
            <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
              {playerX.score} pts
            </span>
          </div>
          <div className="truncate">
            <span className="block text-xs font-extrabold text-slate-100 truncate">
              {playerX.name} {playerX.isMe && <span className="text-[10px] text-cyan-400 font-normal">(Você)</span>}
            </span>
            {isTurnX ? (
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Vez de jogar
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Aguardando...</span>
            )}
          </div>
        </div>

        {/* Player O Card */}
        <div
          className={`relative p-3 rounded-2xl transition-all duration-200 border ${
            !isTurnX
              ? 'bg-slate-900/90 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/50'
              : 'bg-slate-950/70 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-black text-sm">
              O
            </span>
            <span className="font-mono text-xs font-bold text-slate-400 tabular-nums">
              {playerO.score} pts
            </span>
          </div>
          <div className="truncate">
            <span className="block text-xs font-extrabold text-slate-100 truncate">
              {playerO.name} {playerO.isMe && <span className="text-[10px] text-rose-400 font-normal">(Você)</span>}
            </span>
            {!isTurnX ? (
              <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Vez de jogar
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Aguardando...</span>
            )}
          </div>
        </div>
      </div>

      {/* Draw Counter Tabular badge */}
      {draws > 0 && (
        <div className="flex justify-center mt-1.5">
          <span className="text-[10px] font-medium text-slate-500 tabular-nums">
            {draws} {draws === 1 ? 'empate' : 'empates'} na partida
          </span>
        </div>
      )}
    </div>
  );
};
