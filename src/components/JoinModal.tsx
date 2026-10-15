import React, { useState } from 'react';
import { X, ArrowRight, QrCode } from 'lucide-react';
import { playClickSound } from '../utils/audio.ts';

interface JoinModalProps {
  initialCode?: string;
  playerName: string;
  onJoin: (code: string, playerName: string) => void;
  onClose: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  initialCode = '',
  playerName,
  onJoin,
  onClose,
}) => {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState(playerName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 3) {
      setError('Insira o código da sala de 4 caracteres.');
      return;
    }

    if (!name.trim()) {
      setError('Insira o seu apelido.');
      return;
    }

    onJoin(trimmedCode, name.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Extract 4-char code if in text
        const match = text.match(/[A-Za-z0-9]{4}/);
        if (match) {
          setCode(match[0].toUpperCase());
        } else {
          setCode(text.trim().toUpperCase().slice(0, 4));
        }
      }
    } catch {
      //
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-center tracking-tight text-white">Entrar na Sala</h2>
        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          Digite o código compartilhado pelo seu amigo no outro Android:
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Código da Sala (4 dígitos/letras)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Ex: A3F9"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-2xl font-black font-mono tracking-widest text-center text-cyan-400 uppercase outline-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition"
              >
                Colar
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Seu Apelido
            </label>
            <input
              type="text"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-950/40 active:scale-98 transition cursor-pointer"
          >
            <span>Conectar e Jogar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
