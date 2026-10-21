import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceWaveIndicatorProps {
  isSpeaking: boolean;
  isMuted: boolean;
  isActive: boolean;
  color?: 'cyan' | 'rose' | 'emerald';
}

export const VoiceWaveIndicator: React.FC<VoiceWaveIndicatorProps> = ({
  isSpeaking,
  isMuted,
  isActive,
  color = 'cyan',
}) => {
  if (!isActive) {
    return null;
  }

  if (isMuted) {
    return (
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]"
        title="Microfone mutado"
      >
        <MicOff className="w-2.5 h-2.5" />
        <span className="font-semibold text-[9px]">Mudo</span>
      </div>
    );
  }

  if (isSpeaking) {
    const waveColor =
      color === 'rose'
        ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
        : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]';

    return (
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-full bg-slate-900 border border-slate-700"
        title="Falando agora"
      >
        <Mic className={`w-2.5 h-2.5 ${color === 'rose' ? 'text-rose-400' : 'text-cyan-400'}`} />
        <div className="flex items-end gap-0.5 h-3 px-0.5">
          <span className={`w-0.5 h-1.5 rounded-full ${waveColor} animate-pulse`} />
          <span className={`w-0.5 h-3 rounded-full ${waveColor} animate-bounce`} />
          <span className={`w-0.5 h-2 rounded-full ${waveColor} animate-pulse`} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-[10px]"
      title="Microfone aberto"
    >
      <Mic className="w-2.5 h-2.5 text-emerald-400" />
      <span className="text-[9px] font-medium text-slate-400">Voz</span>
    </div>
  );
};
