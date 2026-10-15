import React, { useState } from 'react';
import { Smile, Send } from 'lucide-react';
import type { FloatingReaction } from '../hooks/useMultiplayer.ts';
import { playReactionSound } from '../utils/audio.ts';

interface ReactionDrawerProps {
  onSendReaction: (emoji: string, text?: string) => void;
  reactions: FloatingReaction[];
  disabled?: boolean;
}

const QUICK_EMOJIS = ['🔥', '👏', '😂', '😱', '🏆', '🎯'];
const QUICK_PHRASES = ['Boa jogada!', 'Agora é comigo!', 'Ops!', 'Quero revanche!'];

export const ReactionDrawer: React.FC<ReactionDrawerProps> = ({
  onSendReaction,
  reactions,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = (emoji: string, text?: string) => {
    playReactionSound();
    onSendReaction(emoji, text);
  };

  return (
    <>
      {/* Floating Reactions Overlay */}
      <div className="fixed inset-x-0 bottom-24 top-24 pointer-events-none z-40 flex flex-col items-center justify-end overflow-hidden p-4">
        {reactions.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-2 mb-3 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              r.isMe
                ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 self-end'
                : 'bg-rose-950/80 border border-rose-500/40 text-rose-200 self-start'
            }`}
          >
            <span className="text-2xl animate-bounce">{r.emoji}</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold opacity-75">{r.senderName}</span>
              {r.text && <span className="text-xs font-semibold">{r.text}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button & Reactions Dock */}
      <div className="w-full max-w-sm mx-auto mt-4 z-30 select-none">
        {isOpen ? (
          <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-2.5 animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Reações Rápidas
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded-lg"
              >
                Fechar
              </button>
            </div>

            {/* Quick Emoji Bar */}
            <div className="flex items-center justify-between gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  disabled={disabled}
                  onClick={() => handleSend(emoji)}
                  className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-90 text-xl flex items-center justify-center transition"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick Phrase Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  disabled={disabled}
                  onClick={() => handleSend('💬', phrase)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 active:scale-95 text-slate-300 text-xs font-medium truncate text-left transition"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setIsOpen(true)}
              disabled={disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold hover:border-slate-700 transition active:scale-95 shadow"
            >
              <Smile className="w-4 h-4 text-amber-400" />
              <span>Enviar Reação</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
