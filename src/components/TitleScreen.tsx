import React, { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Users, Bot, QrCode, Play, Sparkles, User, Vibrate } from 'lucide-react';
import { playClickSound, setMuted, getMuted, setHapticEnabled, getHapticEnabled } from '../utils/audio.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface TitleScreenProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateOnlineRoom: () => void;
  onOpenJoinModal: () => void;
  onStartPassAndPlay: () => void;
  onStartBotMode: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateOnlineRoom,
  onOpenJoinModal,
  onStartPassAndPlay,
  onStartBotMode,
}) => {
  const [muted, setLocalMuted] = useState(getMuted());
  const [haptic, setLocalHaptic] = useState(getHapticEnabled());
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  const toggleMute = () => {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
    if (!next) playClickSound();
  };

  const toggleHaptic = () => {
    const next = !haptic;
    setLocalHaptic(next);
    setHapticEnabled(next);
    playClickSound();
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdatePlayerName(tempName.trim());
    }
    setEditingName(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 max-w-md mx-auto z-10 select-none">
      {/* Top Header Utilities */}
      <header className="w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Android Multiplayer</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleHaptic}
            aria-label={haptic ? 'Desativar vibração' : 'Ativar vibração'}
            className={`p-2 rounded-xl transition ${
              haptic ? 'bg-slate-800/80 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900/60 text-slate-500 border border-slate-800'
            }`}
          >
            <Vibrate className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Ativar som' : 'Desativar som'}
            className={`p-2 rounded-xl transition ${
              !muted ? 'bg-slate-800/80 text-cyan-400 border border-cyan-500/30' : 'bg-slate-900/60 text-slate-500 border border-slate-800'
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Showcase Centerpiece */}
      <div className="w-full flex flex-col items-center my-auto py-4">
        {/* Bespoke SVG Title Lockup */}
        <div className="relative flex flex-col items-center mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-indigo-500/15 to-rose-500/10 blur-xl rounded-full pointer-events-none" />
          
          <svg viewBox="0 0 280 90" className="w-64 h-auto drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <text x="140" y="42" textAnchor="middle" fill="url(#titleGrad)" fontWeight="900" fontSize="32" letterSpacing="2" fontFamily="system-ui, sans-serif">
              JOGO DA VELHA
            </text>
            <text x="140" y="74" textAnchor="middle" fill="#94a3b8" fontWeight="600" fontSize="13" letterSpacing="5" fontFamily="system-ui, sans-serif">
              ONLINE MULTIPLAYER
            </text>
          </svg>

          {/* Mini interactive board preview badge */}
          <div className="mt-3 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 shadow-inner">
            <span className="text-cyan-400 font-extrabold text-sm tracking-wide">X</span>
            <span className="text-slate-600 text-xs">VS</span>
            <span className="text-rose-400 font-extrabold text-sm tracking-wide">O</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-xs text-slate-300">Tempo Real</span>
          </div>
        </div>

        {/* Player Profile Quick Card */}
        <div className="w-full max-w-xs mb-6">
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                maxLength={18}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                placeholder="Seu apelido..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 active:scale-95 transition"
              >
                Salvar
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempName(playerName);
                setEditingName(true);
                playClickSound();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition group text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Seu Nickname</span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition">{playerName}</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-300">Mudar</span>
            </button>
          )}
        </div>

        {/* Primary Actions Menu */}
        <div className="w-full space-y-3 max-w-xs">
          {/* Main Action: Create Online Room */}
          <button
            data-start="true"
            onClick={() => {
              playClickSound();
              onCreateOnlineRoom();
            }}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-cyan-950/50 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center justify-between px-5 py-3.5 rounded-[15px] bg-slate-950/80 group-hover:bg-slate-950/60 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-slate-100 text-base leading-tight">Criar Sala Online</span>
                  <span className="text-xs text-cyan-400/90 font-medium">Convide outro Android via Link/QR</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-bounce" />
            </div>
          </button>

          {/* Join with Code */}
          <button
            onClick={() => {
              playClickSound();
              onOpenJoinModal();
            }}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 active:scale-[0.98] transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <QrCode className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-slate-200 text-sm leading-tight">Entrar com Código</span>
                <span className="text-xs text-slate-400">Digite o código de 4 letras</span>
              </div>
            </div>
          </button>

          {/* Secondary Options */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => {
                playClickSound();
                onStartPassAndPlay();
              }}
              className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 active:scale-[0.97] transition"
            >
              <Smartphone className="w-5 h-5 text-emerald-400 mb-1.5" />
              <span className="font-bold text-xs text-slate-200">1 Aparelho</span>
              <span className="text-[10px] text-slate-500">Passar e Jogar</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onStartBotMode();
              }}
              className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 active:scale-[0.97] transition"
            >
              <Bot className="w-5 h-5 text-amber-400 mb-1.5" />
              <span className="font-bold text-xs text-slate-200">Contra Robô</span>
              <span className="text-[10px] text-slate-500">Praticar Solo</span>
            </button>
          </div>

          {/* Android PWA Install */}
          <div className="pt-2">
            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <footer className="w-full text-center pb-2">
        <p className="text-[11px] text-slate-500 tracking-wide">
          2 Jogadores · Android & Mobile Web · Toque no tabuleiro para marcar
        </p>
      </footer>
    </div>
  );
};
