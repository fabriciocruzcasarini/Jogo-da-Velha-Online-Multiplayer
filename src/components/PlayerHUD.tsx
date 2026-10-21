import React from 'react';
import { Volume2, VolumeX, ArrowLeft, Mic, MicOff, PhoneCall, PhoneOff } from 'lucide-react';
import type { PlayerSymbol } from '../game/rules.ts';
import { playClickSound } from '../utils/audio.ts';
import { VoiceWaveIndicator } from './VoiceWaveIndicator.tsx';

interface PlayerInfo {
  name: string;
  symbol: PlayerSymbol;
  score: number;
  isMe: boolean;
  connected?: boolean;
}

export interface VoiceHUDState {
  isActive: boolean;
  isMuted: boolean;
  isSpeakingLocal: boolean;
  isSpeakingRemote: boolean;
  isRemoteMuted: boolean;
  onToggleVoice: () => void;
  onToggleMute: () => void;
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
  voice?: VoiceHUDState;
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
  voice,
}) => {
  const isTurnX = currentTurn === 'X';

  const isSpeakingX = playerX.isMe
    ? (voice?.isSpeakingLocal ?? false)
    : (voice?.isSpeakingRemote ?? false);
  const isSpeakingO = playerO.isMe
    ? (voice?.isSpeakingLocal ?? false)
    : (voice?.isSpeakingRemote ?? false);

  const isMutedX = playerX.isMe
    ? (voice?.isMuted ?? false)
    : (voice?.isRemoteMuted ?? false);
  const isMutedO = playerO.isMe
    ? (voice?.isMuted ?? false)
    : (voice?.isRemoteMuted ?? false);

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
          {/* Voice Chat Control Pill (Online Only) */}
          {voice && (
            <>
              {voice.isActive ? (
                <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 p-0.5 rounded-xl">
                  {/* Mute / Unmute Button */}
                  <button
                    onClick={() => {
                      playClickSound();
                      voice.onToggleMute();
                    }}
                    aria-label={voice.isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                      voice.isMuted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : voice.isSpeakingLocal
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {voice.isMuted ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Mudo</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{voice.isSpeakingLocal ? 'Falando' : 'Voz'}</span>
                      </>
                    )}
                  </button>

                  {/* Disconnect Voice */}
                  <button
                    onClick={() => {
                      playClickSound();
                      voice.onToggleVoice();
                    }}
                    title="Desconectar do chat de voz"
                    aria-label="Desconectar do chat de voz"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <PhoneOff className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    playClickSound();
                    voice.onToggleVoice();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/25 active:scale-95 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ativar Voz</span>
                </button>
              )}
            </>
          )}

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
            isSpeakingX
              ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/80'
              : isTurnX
              ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
              : 'bg-slate-950/70 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-sm">
                X
              </span>
              {voice?.isActive && (
                <VoiceWaveIndicator
                  isActive={true}
                  isSpeaking={isSpeakingX}
                  isMuted={isMutedX}
                  color="cyan"
                />
              )}
            </div>
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
            isSpeakingO
              ? 'bg-slate-900 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.45)] ring-2 ring-rose-400/80'
              : !isTurnX
              ? 'bg-slate-900/90 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] ring-1 ring-rose-500/50'
              : 'bg-slate-950/70 border-slate-800/80 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-black text-sm">
                O
              </span>
              {voice?.isActive && (
                <VoiceWaveIndicator
                  isActive={true}
                  isSpeaking={isSpeakingO}
                  isMuted={isMutedO}
                  color="rose"
                />
              )}
            </div>
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

      {/* Prominent Voice Chat Banner (Online) */}
      {voice && !voice.isActive && (
        <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-500/30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-100">Chat de Voz</span>
              <span className="block text-[10px] text-slate-400">Fale ao vivo com seu amigo</span>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              voice.onToggleVoice();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-950/50 active:scale-95 transition cursor-pointer"
          >
            Habilitar Voz
          </button>
        </div>
      )}

      {voice && voice.isActive && (
        <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-md">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                voice.isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {voice.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-pulse" />}
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-100">
                {voice.isMuted
                  ? 'Microfone Mutado'
                  : voice.isSpeakingLocal
                  ? 'Você está falando...'
                  : 'Microfone Aberto'}
              </span>
              <span className="block text-[10px] text-slate-400">
                {voice.isSpeakingRemote
                  ? 'Oponente está falando 🎙️'
                  : voice.isRemoteMuted
                  ? 'Oponente mutou o microfone'
                  : 'Conexão de voz ativa'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                playClickSound();
                voice.onToggleMute();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                voice.isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {voice.isMuted ? 'Desmutar' : 'Silenciar'}
            </button>
            <button
              onClick={() => {
                playClickSound();
                voice.onToggleVoice();
              }}
              title="Desconectar do chat de voz"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
