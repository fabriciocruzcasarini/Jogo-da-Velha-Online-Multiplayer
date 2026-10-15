import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { playClickSound } from '../utils/audio.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = () => {
    playClickSound();
    install();
  };

  if (compact) {
    return (
      <button
        onClick={handleInstall}
        aria-label="Instalar aplicativo no Android"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/25 active:scale-95 transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstall}
      className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 hover:from-cyan-500 hover:to-blue-500 active:scale-98 transition"
    >
      <Smartphone className="w-4 h-4 text-cyan-200" />
      <span>Instalar App no seu Android</span>
    </button>
  );
};
