import { useEffect, useRef, useState, useCallback } from 'react';
import type { BoardState, PlayerSymbol } from '../game/rules.ts';
import { playJoinSound, playMoveSound, playReactionSound, playWinSound, playDrawSound } from '../utils/audio.ts';

export interface RoomSummary {
  id: string;
  code: string;
  players: Record<string, { id: string; name: string; symbol: PlayerSymbol; connected: boolean; rematchRequested: boolean }>;
  playerCount: number;
  turn: PlayerSymbol;
  board: BoardState;
  status: 'waiting' | 'playing' | 'ended';
  winner: PlayerSymbol | null;
  winningLine: [number, number, number] | null;
  isDraw: boolean;
  scores: { X: number; O: number; draws: number };
  startingPlayer: PlayerSymbol;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  text?: string;
  senderName: string;
  isMe: boolean;
}

export function useMultiplayer() {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('jdv_player_id') || null;
  });
  const [mySymbol, setMySymbol] = useState<PlayerSymbol | null>(() => {
    return (localStorage.getItem('jdv_player_symbol') as PlayerSymbol) || null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Keep references to current state without triggering reconnects
  const roomRef = useRef<RoomSummary | null>(null);
  roomRef.current = room;
  const myPlayerIdRef = useRef<string | null>(myPlayerId);
  myPlayerIdRef.current = myPlayerId;

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Ping periodically
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);

        // Auto rejoin saved room if any
        const savedRoomCode = sessionStorage.getItem('jdv_room_code');
        const savedPlayerId = localStorage.getItem('jdv_player_id');
        const savedPlayerName = localStorage.getItem('jdv_player_name') || 'Jogador';

        if (savedRoomCode && savedPlayerId) {
          socket.send(
            JSON.stringify({
              type: 'join_room',
              payload: {
                code: savedRoomCode,
                playerId: savedPlayerId,
                playerName: savedPlayerName,
              },
            })
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          if (type === 'room_created') {
            setMyPlayerId(payload.playerId);
            setMySymbol(payload.symbol);
            setRoom(payload.room);
            localStorage.setItem('jdv_player_id', payload.playerId);
            localStorage.setItem('jdv_player_symbol', payload.symbol);
            sessionStorage.setItem('jdv_room_code', payload.roomId);
            playJoinSound();
          } else if (type === 'room_joined') {
            setMyPlayerId(payload.playerId);
            setMySymbol(payload.symbol);
            setRoom(payload.room);
            localStorage.setItem('jdv_player_id', payload.playerId);
            localStorage.setItem('jdv_player_symbol', payload.symbol);
            sessionStorage.setItem('jdv_room_code', payload.roomId);
            playJoinSound();
          } else if (type === 'game_started' || type === 'room_updated') {
            setRoom(payload.room);
            playJoinSound();
          } else if (type === 'move_made') {
            setRoom(payload.room);
            playMoveSound(payload.symbol);

            if (payload.room.winner) {
              playWinSound();
            } else if (payload.room.isDraw) {
              playDrawSound();
            }
          } else if (type === 'rematch_requested') {
            setRoom(payload.room);
          } else if (type === 'rematch_accepted') {
            setRoom(payload.room);
            playJoinSound();
          } else if (type === 'player_disconnected' || type === 'player_reconnected') {
            setRoom(payload.room);
          } else if (type === 'reaction_received') {
            playReactionSound();
            const currentRoom = roomRef.current;
            const currentMyId = myPlayerIdRef.current;
            const sender = currentRoom?.players[payload.playerId]?.name || 'Jogador';
            const newReaction: FloatingReaction = {
              id: Math.random().toString(36).substring(2, 9),
              emoji: payload.emoji,
              text: payload.text,
              senderName: sender,
              isMe: payload.playerId === currentMyId,
            };
            setReactions((prev) => [...prev.slice(-4), newReaction]);
            setTimeout(() => {
              setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
            }, 3000);
          } else if (type === 'error') {
            setErrorMessage(payload.message || 'Ocorreu um erro.');
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, 2000);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.error('Failed to establish WS:', e);
    }
  }, []); // Stable: runs once and maintains connection without teardown on state change

  useEffect(() => {
    connect();
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const createRoom = useCallback((playerName: string) => {
    setErrorMessage(null);
    localStorage.setItem('jdv_player_name', playerName);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'create_room',
          payload: { playerName },
        })
      );
    } else {
      setErrorMessage('Conectando ao servidor... tente novamente em instantes.');
    }
  }, []);

  const joinRoom = useCallback((code: string, playerName: string) => {
    setErrorMessage(null);
    localStorage.setItem('jdv_player_name', playerName);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'join_room',
          payload: {
            code: code.toUpperCase().trim(),
            playerName,
          },
        })
      );
    } else {
      setErrorMessage('Conectando ao servidor... tente novamente em instantes.');
    }
  }, []);

  const makeMove = useCallback((index: number) => {
    const currentRoom = roomRef.current;
    const currentMyId = myPlayerIdRef.current;
    if (!currentRoom || !currentMyId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'make_move',
          payload: {
            roomId: currentRoom.id,
            playerId: currentMyId,
            index,
          },
        })
      );
    }
  }, []);

  const requestRematch = useCallback(() => {
    const currentRoom = roomRef.current;
    const currentMyId = myPlayerIdRef.current;
    if (!currentRoom || !currentMyId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'request_rematch',
          payload: {
            roomId: currentRoom.id,
            playerId: currentMyId,
          },
        })
      );
    }
  }, []);

  const sendReaction = useCallback((emoji: string, text?: string) => {
    const currentRoom = roomRef.current;
    const currentMyId = myPlayerIdRef.current;
    if (!currentRoom || !currentMyId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'send_reaction',
          payload: {
            roomId: currentRoom.id,
            playerId: currentMyId,
            emoji,
            text,
          },
        })
      );
    }
  }, []);

  const leaveRoom = useCallback(() => {
    sessionStorage.removeItem('jdv_room_code');
    localStorage.removeItem('jdv_player_symbol');
    setRoom(null);
    setMySymbol(null);
  }, []);

  return {
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
    clearError: () => setErrorMessage(null),
  };
}
