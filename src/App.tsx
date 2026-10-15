import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { PlayerHUD } from './components/PlayerHUD.tsx';
import { LobbyModal } from './components/LobbyModal.tsx';
import { JoinModal } from './components/JoinModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { ReactionDrawer } from './components/ReactionDrawer.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { useMultiplayer } from './hooks/useMultiplayer.ts';
import {
  checkWinner,
  createEmptyBoard,
  getBestMove,
  isMoveValid,
  type BoardState,
  type PlayerSymbol,
} from './game/rules.ts';
import {
  getMuted,
  setMuted,
  playMoveSound,
  playWinSound,
  playDrawSound,
  playClickSound,
} from './utils/audio.ts';

type GameMode = 'title' | 'online' | 'pass_and_play' | 'bot';

export default function App() {
  const [mode, setMode] = useState<GameMode>('title');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('jdv_player_name') || 'Jogador 1';
  });

  // Local modes state (Pass & Play and Bot)
  const [localBoard, setLocalBoard] = useState<BoardState>(createEmptyBoard);
  const [localTurn, setLocalTurn] = useState<PlayerSymbol>('X');
  const [localWinner, setLocalWinner] = useState<PlayerSymbol | null>(null);
  const [localWinningLine, setLocalWinningLine] = useState<[number, number, number] | null>(null);
  const [localIsDraw, setLocalIsDraw] = useState(false);
  const [localScores, setLocalScores] = useState({ X: 0, O: 0, draws: 0 });
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('hard');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Online Multiplayer Hook
  const {
    isConnected,
    room,
    myPlayerId,
    mySymbol,
    errorMessage,
    reactions,
    createRoom,
    joinRoom,
    makeMove,
    requestRematch,
    sendReaction,
    leaveRoom,
    clearError,
  } = useMultiplayer();

  // Modals
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [initialJoinCode, setInitialJoinCode] = useState('');
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [muted, setLocalMuted] = useState(getMuted());

  // Sync document.body.dataset.state for ultra mode game shell specification
  useEffect(() => {
    if (mode === 'title') {
      document.body.dataset.state = 'title';
    } else if (room?.status === 'ended' || localWinner || localIsDraw) {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [mode, room?.status, localWinner, localIsDraw]);

  // Read URL parameters on mount (?room=XYZ or ?autostart=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const autoStartParam = params.get('autostart');

    if (roomParam) {
      setInitialJoinCode(roomParam.toUpperCase());
      setIsJoinModalOpen(true);
    } else if (autoStartParam === '1') {
      // Skip directly to pass & play or bot mode
      setMode('pass_and_play');
    }
  }, []);

  // Keyboard shortcut: Enter or Space starts game from title screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'title' && !isJoinModalOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCreateOnlineRoom();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isJoinModalOpen, playerName]);

  // When room is created or joined, close modals and switch mode
  useEffect(() => {
    if (room) {
      setMode('online');
      if (room.status === 'waiting') {
        setIsLobbyOpen(true);
      } else {
        setIsLobbyOpen(false);
        setIsJoinModalOpen(false);
      }
    }
  }, [room]);

  const handleCreateOnlineRoom = () => {
    createRoom(playerName);
  };

  const handleJoinOnlineRoom = (code: string, name: string) => {
    setPlayerName(name);
    joinRoom(code, name);
    setIsJoinModalOpen(false);
  };

  const handleStartPassAndPlay = () => {
    setLocalBoard(createEmptyBoard());
    setLocalTurn('X');
    setLocalWinner(null);
    setLocalWinningLine(null);
    setLocalIsDraw(false);
    setMode('pass_and_play');
  };

  const handleStartBotMode = () => {
    setLocalBoard(createEmptyBoard());
    setLocalTurn('X');
    setLocalWinner(null);
    setLocalWinningLine(null);
    setLocalIsDraw(false);
    setMode('bot');
  };

  const handleBackToTitle = () => {
    if (mode === 'online') {
      leaveRoom();
    }
    setMode('title');
    setIsLobbyOpen(false);
    setIsJoinModalOpen(false);
  };

  const handleToggleMute = () => {
    const next = !muted;
    setLocalMuted(next);
    setMuted(next);
    if (!next) playClickSound();
  };

  // Local move handler (Pass & Play or Bot)
  const handleLocalCellClick = (index: number) => {
    if (localWinner || localIsDraw || isBotThinking) return;
    if (!isMoveValid(localBoard, index)) return;

    const currentSymbol = localTurn;
    const nextBoard = [...localBoard];
    nextBoard[index] = currentSymbol;
    setLocalBoard(nextBoard);
    playMoveSound(currentSymbol);

    const winRes = checkWinner(nextBoard);
    if (winRes.winner) {
      setLocalWinner(winRes.winner);
      setLocalWinningLine(winRes.line);
      setLocalScores((prev) => ({
        ...prev,
        [winRes.winner!]: prev[winRes.winner!] + 1,
      }));
      playWinSound();
      return;
    }

    if (winRes.isDraw) {
      setLocalIsDraw(true);
      setLocalScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      playDrawSound();
      return;
    }

    const nextTurn = currentSymbol === 'X' ? 'O' : 'X';
    setLocalTurn(nextTurn);

    // If bot mode and next turn is O
    if (mode === 'bot' && nextTurn === 'O') {
      setIsBotThinking(true);
      setTimeout(() => {
        const botMove = getBestMove(nextBoard, 'O', botDifficulty);
        if (botMove !== -1) {
          const afterBotBoard = [...nextBoard];
          afterBotBoard[botMove] = 'O';
          setLocalBoard(afterBotBoard);
          playMoveSound('O');

          const botWinRes = checkWinner(afterBotBoard);
          if (botWinRes.winner) {
            setLocalWinner(botWinRes.winner);
            setLocalWinningLine(botWinRes.line);
            setLocalScores((prev) => ({
              ...prev,
              O: prev.O + 1,
            }));
            playWinSound();
          } else if (botWinRes.isDraw) {
            setLocalIsDraw(true);
            setLocalScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
            playDrawSound();
          } else {
            setLocalTurn('X');
          }
        }
        setIsBotThinking(false);
      }, 400);
    }
  };

  const handleLocalRematch = () => {
    setLocalBoard(createEmptyBoard());
    setLocalTurn('X');
    setLocalWinner(null);
    setLocalWinningLine(null);
    setLocalIsDraw(false);
  };

  // Players presentation data
  const onlinePlayersInfo = useMemo(() => {
    if (!room) return null;
    const playersArr = Object.values(room.players);
    const pX = playersArr.find((p) => p.symbol === 'X');
    const pO = playersArr.find((p) => p.symbol === 'O');

    return {
      playerX: {
        name: pX?.name || 'Aguardando...',
        symbol: 'X' as PlayerSymbol,
        score: room.scores.X,
        isMe: mySymbol === 'X',
        connected: pX?.connected ?? false,
      },
      playerO: {
        name: pO?.name || 'Aguardando...',
        symbol: 'O' as PlayerSymbol,
        score: room.scores.O,
        isMe: mySymbol === 'O',
        connected: pO?.connected ?? false,
      },
    };
  }, [room, mySymbol]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-rose-500/90 text-white text-xs font-bold shadow-xl">
          <span>{errorMessage}</span>
          <button
            onClick={clearError}
            className="px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/40 text-[11px]"
          >
            OK
          </button>
        </div>
      )}

      {/* Screen 1: Title Screen */}
      {mode === 'title' && (
        <TitleScreen
          playerName={playerName}
          onUpdatePlayerName={(name) => {
            setPlayerName(name);
            localStorage.setItem('jdv_player_name', name);
          }}
          onCreateOnlineRoom={handleCreateOnlineRoom}
          onOpenJoinModal={() => {
            setInitialJoinCode('');
            setIsJoinModalOpen(true);
          }}
          onStartPassAndPlay={handleStartPassAndPlay}
          onStartBotMode={handleStartBotMode}
        />
      )}

      {/* Screen 2: Online Gameplay */}
      {mode === 'online' && room && onlinePlayersInfo && (
        <main className="relative flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full z-10">
          <PlayerHUD
            playerX={onlinePlayersInfo.playerX}
            playerO={onlinePlayersInfo.playerO}
            currentTurn={room.turn}
            draws={room.scores.draws}
            isOnline={isConnected}
            muted={muted}
            onToggleMute={handleToggleMute}
            onLeave={handleBackToTitle}
            modeLabel={`Sala ${room.code}`}
          />

          {/* Turn Prompt Banner */}
          <div className="text-center my-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                room.status === 'playing'
                  ? room.turn === mySymbol
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {room.status === 'playing'
                ? room.turn === mySymbol
                  ? '🎯 Sua vez de jogar!'
                  : `⏳ Aguardando ${room.turn === 'X' ? onlinePlayersInfo.playerX.name : onlinePlayersInfo.playerO.name}...`
                : 'Partida Concluída'}
            </span>
          </div>

          {/* Interactive Game Board */}
          <GameBoard
            board={room.board}
            onCellClick={(index) => makeMove(index)}
            isMyTurn={room.turn === mySymbol && room.status === 'playing'}
            mySymbol={mySymbol}
            winningLine={room.winningLine}
            disabled={room.status !== 'playing' || room.turn !== mySymbol}
          />

          {/* Real-time Emoji Reactions */}
          <ReactionDrawer
            onSendReaction={(emoji, text) => sendReaction(emoji, text)}
            reactions={reactions}
          />

          {/* Lobby modal when waiting for 2nd Android player */}
          {isLobbyOpen && (
            <LobbyModal
              roomCode={room.code}
              playerName={playerName}
              opponentName={Object.values(room.players).find((p) => p.symbol === 'O')?.name}
              onCancel={handleBackToTitle}
            />
          )}

          {/* Game Over modal on win or draw */}
          {room.status === 'ended' && (
            <GameOverModal
              winner={room.winner}
              isDraw={room.isDraw}
              mySymbol={mySymbol}
              winnerName={room.winner ? room.players[Object.keys(room.players).find((k) => room.players[k].symbol === room.winner) || '']?.name : undefined}
              myRematchRequested={room.players[myPlayerId || '']?.rematchRequested || false}
              opponentRematchRequested={
                Object.values(room.players).find((p) => p.id !== myPlayerId)?.rematchRequested || false
              }
              onRematch={requestRematch}
              onHome={handleBackToTitle}
              scores={room.scores}
            />
          )}
        </main>
      )}

      {/* Screen 3: Local Pass & Play or Bot Mode */}
      {(mode === 'pass_and_play' || mode === 'bot') && (
        <main className="relative flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full z-10">
          <PlayerHUD
            playerX={{
              name: mode === 'bot' ? playerName : 'Jogador 1',
              symbol: 'X',
              score: localScores.X,
              isMe: true,
            }}
            playerO={{
              name: mode === 'bot' ? 'Robô IA' : 'Jogador 2',
              symbol: 'O',
              score: localScores.O,
              isMe: mode === 'pass_and_play',
            }}
            currentTurn={localTurn}
            draws={localScores.draws}
            isOnline={false}
            muted={muted}
            onToggleMute={handleToggleMute}
            onLeave={handleBackToTitle}
            modeLabel={mode === 'bot' ? `Robô (${botDifficulty})` : '1 Aparelho'}
          />

          {/* Bot Difficulty Selector when in bot mode */}
          {mode === 'bot' && (
            <div className="flex justify-center items-center gap-1.5 my-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Dificuldade:</span>
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    playClickSound();
                    setBotDifficulty(diff);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition ${
                    botDifficulty === diff
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Médio' : 'Difícil'}
                </button>
              ))}
            </div>
          )}

          {/* Turn Prompt Banner */}
          <div className="text-center my-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
              {isBotThinking
                ? '🤖 Robô pensando na jogada...'
                : `Vez de ${localTurn === 'X' ? (mode === 'bot' ? playerName : 'Jogador 1 (X)') : (mode === 'bot' ? 'Robô (O)' : 'Jogador 2 (O)')}`}
            </span>
          </div>

          {/* Interactive Game Board */}
          <GameBoard
            board={localBoard}
            onCellClick={handleLocalCellClick}
            isMyTurn={!isBotThinking && !localWinner && !localIsDraw}
            mySymbol={localTurn}
            winningLine={localWinningLine}
            disabled={isBotThinking || localWinner !== null || localIsDraw}
          />

          {/* Game Over modal for local games */}
          {(localWinner || localIsDraw) && (
            <GameOverModal
              winner={localWinner}
              isDraw={localIsDraw}
              mySymbol={mode === 'bot' ? 'X' : null}
              winnerName={
                localWinner === 'X'
                  ? mode === 'bot'
                    ? playerName
                    : 'Jogador 1'
                  : mode === 'bot'
                  ? 'Robô IA'
                  : 'Jogador 2'
              }
              myRematchRequested={false}
              opponentRematchRequested={false}
              onRematch={handleLocalRematch}
              onHome={handleBackToTitle}
              scores={localScores}
            />
          )}

          {/* Bottom spacing footer */}
          <div className="py-2" />
        </main>
      )}

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <JoinModal
          initialCode={initialJoinCode}
          playerName={playerName}
          onJoin={handleJoinOnlineRoom}
          onClose={() => setIsJoinModalOpen(false)}
        />
      )}
    </div>
  );
}
