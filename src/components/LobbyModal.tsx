import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Share2, MessageCircle, X, Users, Loader2 } from 'lucide-react';
import { playClickSound } from '../utils/audio.ts';

interface LobbyModalProps {
  roomCode: string;
  playerName: string;
  opponentName?: string;
  onCancel: () => void;
}

export const LobbyModal: React.FC<LobbyModalProps> = ({
  roomCode,
  playerName,
  opponentName,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrGeneratedRef = useRef(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}?room=${roomCode}`
    : '';

  useEffect(() => {
    if (roomCode && !qrGeneratedRef.current) {
      qrGeneratedRef.current = true;
      QRCode.toDataURL(shareUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [roomCode, shareUrl]);

  const handleCopyCode = async () => {
    playClickSound();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    playClickSound();
    const text = `Vamos jogar Jogo da Velha! Entre na sala com o código: ${roomCode} ou acesse o link:`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Jogo da Velha Multiplayer',
          text,
          url: shareUrl,
        });
        return;
      } catch {
        // user cancelled or share failed, fallback
      }
    }
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      //
    }
  };

  const handleWhatsAppShare = () => {
    playClickSound();
    const text = `Bora jogar Jogo da Velha online! Entre na sala ${roomCode}: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            playClickSound();
            onCancel();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Cancelar e fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-center tracking-tight text-white">Sala Criada</h2>
        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          Peça para a outra pessoa escanear o QR Code ou digitar o código abaixo em seu Android:
        </p>

        {/* Room Code Badge */}
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/70 border border-cyan-500/30 mb-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Código da Sala</span>
            <span className="text-2xl font-black tracking-widest text-cyan-400 font-mono">{roomCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl shadow-lg mb-5 flex flex-col items-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR Code para sala ${roomCode}`} className="w-40 h-40 rounded-xl" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            </div>
          )}
          <span className="text-[11px] text-slate-800 font-semibold mt-1">Aponte a câmera do Android</span>
        </div>

        {/* Action Share Buttons */}
        <div className="w-full grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Compartilhar</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-emerald-950/40"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Player Status Cluster */}
        <div className="w-full p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-semibold text-slate-300">{playerName} (Você - X)</span>
          </div>

          <div className="flex items-center gap-2">
            {opponentName ? (
              <span className="text-xs font-bold text-rose-400">{opponentName} (O)</span>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                <span>Aguardando 2º jogador...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
