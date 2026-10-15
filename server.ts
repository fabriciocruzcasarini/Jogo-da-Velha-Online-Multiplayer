import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  checkWinner,
  createEmptyBoard,
  generateRoomCode,
  isMoveValid,
  type BoardState,
  type PlayerSymbol,
} from './src/game/rules.ts';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const hasDist = fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
const isProd = process.env.NODE_ENV === 'production' || hasDist;

app.use(express.json());

interface PlayerData {
  id: string;
  name: string;
  symbol: PlayerSymbol;
  connected: boolean;
  rematchRequested: boolean;
  ws?: WebSocket;
}

interface RoomData {
  id: string;
  code: string;
  players: Record<string, PlayerData>;
  turn: PlayerSymbol;
  board: BoardState;
  status: 'waiting' | 'playing' | 'ended';
  winner: PlayerSymbol | null;
  winningLine: [number, number, number] | null;
  isDraw: boolean;
  scores: { X: number; O: number; draws: number };
  startingPlayer: PlayerSymbol;
  lastActivity: number;
}

const rooms = new Map<string, RoomData>();

// Periodic cleanup of inactive rooms (after 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > 30 * 60 * 1000) {
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000);

function sanitizeRoom(room: RoomData) {
  const playersSummary: Record<string, { id: string; name: string; symbol: PlayerSymbol; connected: boolean; rematchRequested: boolean }> = {};
  for (const [pid, p] of Object.entries(room.players)) {
    playersSummary[pid] = {
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      connected: p.connected,
      rematchRequested: p.rematchRequested,
    };
  }

  return {
    id: room.id,
    code: room.code,
    players: playersSummary,
    playerCount: Object.keys(room.players).length,
    turn: room.turn,
    board: room.board,
    status: room.status,
    winner: room.winner,
    winningLine: room.winningLine,
    isDraw: room.isDraw,
    scores: room.scores,
    startingPlayer: room.startingPlayer,
  };
}

function broadcastToRoom(room: RoomData, type: string, payload: unknown) {
  const message = JSON.stringify({ type, payload });
  for (const player of Object.values(room.players)) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}

// WebSocket Server with subpath support (supports /ws and /jogo-da-velha/ws)
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);
    if (url.pathname === '/ws' || url.pathname.endsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }
  } catch (err) {
    console.error('Error handling upgrade:', err);
  }
  socket.destroy();
});

wss.on('connection', (ws: WebSocket) => {
  let boundRoomId: string | null = null;
  let boundPlayerId: string | null = null;

  ws.on('message', (rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      const { type, payload } = data;

      if (type === 'create_room') {
        const playerName = (payload?.playerName || 'Jogador 1').trim().slice(0, 20);
        let code = generateRoomCode();
        while (rooms.has(code)) {
          code = generateRoomCode();
        }

        const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const newRoom: RoomData = {
          id: code,
          code,
          players: {
            [playerId]: {
              id: playerId,
              name: playerName,
              symbol: 'X',
              connected: true,
              rematchRequested: false,
              ws,
            },
          },
          turn: 'X',
          board: createEmptyBoard(),
          status: 'waiting',
          winner: null,
          winningLine: null,
          isDraw: false,
          scores: { X: 0, O: 0, draws: 0 },
          startingPlayer: 'X',
          lastActivity: Date.now(),
        };

        rooms.set(code, newRoom);
        boundRoomId = code;
        boundPlayerId = playerId;

        ws.send(
          JSON.stringify({
            type: 'room_created',
            payload: {
              roomId: code,
              playerId,
              symbol: 'X',
              room: sanitizeRoom(newRoom),
            },
          })
        );
        return;
      }

      if (type === 'join_room') {
        const code = (payload?.code || '').toUpperCase().trim();
        const playerName = (payload?.playerName || 'Jogador 2').trim().slice(0, 20);
        const existingPlayerId = payload?.playerId;

        const room = rooms.get(code);
        if (!room) {
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Sala não encontrada. Verifique o código.' },
            })
          );
          return;
        }

        room.lastActivity = Date.now();

        // Check if player is rejoining
        if (existingPlayerId && room.players[existingPlayerId]) {
          const player = room.players[existingPlayerId];
          player.connected = true;
          player.ws = ws;
          boundRoomId = code;
          boundPlayerId = existingPlayerId;

          ws.send(
            JSON.stringify({
              type: 'room_joined',
              payload: {
                roomId: code,
                playerId: existingPlayerId,
                symbol: player.symbol,
                room: sanitizeRoom(room),
              },
            })
          );

          broadcastToRoom(room, 'player_reconnected', {
            playerId: existingPlayerId,
            room: sanitizeRoom(room),
          });
          return;
        }

        // Check player count
        const existingPlayerKeys = Object.keys(room.players);
        if (existingPlayerKeys.length >= 2) {
          // Check if any player is disconnected and can be replaced
          const disconnectedKey = existingPlayerKeys.find((k) => !room.players[k].connected);
          if (!disconnectedKey) {
            ws.send(
              JSON.stringify({
                type: 'error',
                payload: { message: 'Esta sala já está cheia (2 jogadores).' },
              })
            );
            return;
          }
          // Replace disconnected slot
          const slotSymbol = room.players[disconnectedKey].symbol;
          delete room.players[disconnectedKey];
          const newPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
          room.players[newPlayerId] = {
            id: newPlayerId,
            name: playerName,
            symbol: slotSymbol,
            connected: true,
            rematchRequested: false,
            ws,
          };
          boundRoomId = code;
          boundPlayerId = newPlayerId;

          ws.send(
            JSON.stringify({
              type: 'room_joined',
              payload: {
                roomId: code,
                playerId: newPlayerId,
                symbol: slotSymbol,
                room: sanitizeRoom(room),
              },
            })
          );

          broadcastToRoom(room, 'room_updated', {
            room: sanitizeRoom(room),
          });
          return;
        }

        // New second player joins
        const secondPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
        const assignedSymbol: PlayerSymbol = room.players[existingPlayerKeys[0]].symbol === 'X' ? 'O' : 'X';

        room.players[secondPlayerId] = {
          id: secondPlayerId,
          name: playerName,
          symbol: assignedSymbol,
          connected: true,
          rematchRequested: false,
          ws,
        };
        room.status = 'playing';
        boundRoomId = code;
        boundPlayerId = secondPlayerId;

        ws.send(
          JSON.stringify({
            type: 'room_joined',
            payload: {
              roomId: code,
              playerId: secondPlayerId,
              symbol: assignedSymbol,
              room: sanitizeRoom(room),
            },
          })
        );

        broadcastToRoom(room, 'game_started', {
          room: sanitizeRoom(room),
        });
        return;
      }

      if (type === 'make_move') {
        const { roomId, playerId, index } = payload || {};
        const room = rooms.get(roomId);
        console.log(`[SERVER make_move] room: ${roomId}, player: ${playerId}, cell: ${index}, roomTurn: ${room?.turn}`);
        if (!room || room.status !== 'playing') {
          console.log(`[SERVER make_move REJECTED] room status is not playing: ${room?.status}`);
          return;
        }

        const player = room.players[playerId];
        if (!player) {
          console.log(`[SERVER make_move REJECTED] player not found in room`);
          return;
        }

        // Verify it is this player's turn
        if (room.turn !== player.symbol) {
          console.log(`[SERVER make_move REJECTED] not player turn: roomTurn=${room.turn}, playerSymbol=${player.symbol}`);
          ws.send(
            JSON.stringify({
              type: 'error',
              payload: { message: 'Não é a sua vez!' },
            })
          );
          return;
        }

        // Validate cell
        if (!isMoveValid(room.board, index)) {
          console.log(`[SERVER make_move REJECTED] cell not empty: ${room.board[index]}`);
          return;
        }

        room.board[index] = player.symbol;
        room.lastActivity = Date.now();

        const winResult = checkWinner(room.board);

        if (winResult.winner) {
          room.status = 'ended';
          room.winner = winResult.winner;
          room.winningLine = winResult.line;
          room.scores[winResult.winner] += 1;
        } else if (winResult.isDraw) {
          room.status = 'ended';
          room.isDraw = true;
          room.scores.draws += 1;
        } else {
          // Toggle turn
          room.turn = room.turn === 'X' ? 'O' : 'X';
        }

        console.log(`[SERVER move_made] cell: ${index}, symbol: ${player.symbol}, nextTurn: ${room.turn}, status: ${room.status}`);
        broadcastToRoom(room, 'move_made', {
          cellIndex: index,
          symbol: player.symbol,
          room: sanitizeRoom(room),
        });
        return;
      }

      if (type === 'request_rematch') {
        const { roomId, playerId } = payload || {};
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players[playerId];
        if (!player) return;

        player.rematchRequested = true;
        room.lastActivity = Date.now();

        const allPlayers = Object.values(room.players);
        const bothWantRematch = allPlayers.length === 2 && allPlayers.every((p) => p.rematchRequested);

        if (bothWantRematch) {
          // Reset board, toggle starting player
          room.board = createEmptyBoard();
          room.status = 'playing';
          room.winner = null;
          room.winningLine = null;
          room.isDraw = false;
          room.startingPlayer = room.startingPlayer === 'X' ? 'O' : 'X';
          room.turn = room.startingPlayer;

          for (const p of allPlayers) {
            p.rematchRequested = false;
          }

          broadcastToRoom(room, 'rematch_accepted', {
            room: sanitizeRoom(room),
          });
        } else {
          broadcastToRoom(room, 'rematch_requested', {
            playerId,
            room: sanitizeRoom(room),
          });
        }
        return;
      }

      if (type === 'send_reaction') {
        const { roomId, playerId, emoji, text } = payload || {};
        const room = rooms.get(roomId);
        if (!room) return;

        broadcastToRoom(room, 'reaction_received', {
          playerId,
          emoji,
          text,
          timestamp: Date.now(),
        });
        return;
      }

      if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (boundRoomId && boundPlayerId) {
      const room = rooms.get(boundRoomId);
      if (room && room.players[boundPlayerId]) {
        room.players[boundPlayerId].connected = false;
        room.players[boundPlayerId].ws = undefined;
        broadcastToRoom(room, 'player_disconnected', {
          playerId: boundPlayerId,
          room: sanitizeRoom(room),
        });
      }
    }
  });
});

// REST API
app.get(['/api/health', '/jogo-da-velha/api/health'], (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

app.get(['/api/room/:code', '/jogo-da-velha/api/room/:code'], (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ error: 'Sala não encontrada' });
  }
  res.json(sanitizeRoom(room));
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use('/assets', express.static(path.resolve(distPath, 'assets')));
    app.use('/jogo-da-velha', express.static(distPath));
    app.use('/jogo-da-velha/assets', express.static(path.resolve(distPath, 'assets')));
    app.get(['/jogo-da-velha', '/jogo-da-velha/*'], (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
