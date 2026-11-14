const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

// Active rooms in memory
const rooms = new Map();

function generateRoomCode() {
  const prefixes = ['SKY', 'ORBIT', 'APOLLO', 'ARES', 'ARTEMIS', 'VOYAGER', 'TITAN'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}-${num}`;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/rooms') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const list = Array.from(rooms.values()).map((r) => ({
      code: r.code,
      playerCount: Object.keys(r.players).length,
      status: r.status,
    }));
    res.end(JSON.stringify(list));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      status: 'SkyRift Multi-Crew Realtime Server Active',
      activeRooms: rooms.size,
      uptime: Math.floor(process.uptime()),
    })
  );
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // console.log(`[Socket] Connected: ${socket.id}`);

  // 1. Create Room
  socket.on('room:create', ({ hostName, role }, callback) => {
    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const playerId = socket.id;
    const initialPlayer = {
      id: playerId,
      name: hostName || 'Flight Director',
      role: role || 'director',
      isReady: true,
      joinedAt: Date.now(),
    };

    const newRoom = {
      code,
      hostPlayerId: playerId,
      status: 'lobby',
      fillEmptyRoles: true,
      players: { [playerId]: initialPlayer },
      designReviews: {
        director: { approved: false, rejected: false },
        engineer: { approved: false, rejected: false },
        science: { approved: false, rejected: false },
        comms: { approved: false, rejected: false },
      },
      turnVotes: {},
      chatMessages: [
        {
          id: `msg-${Date.now()}`,
          senderName: 'SkyRift Uplink',
          role: null,
          text: `Mission Control room ${code} initialized. Crew members may join using this code.`,
          timestamp: Date.now(),
          isQuickMsg: true,
        },
      ],
      lastSyncedTimestamp: Date.now(),
    };

    rooms.set(code, newRoom);
    socket.join(code);

    if (typeof callback === 'function') {
      callback({ success: true, room: newRoom, playerId });
    }
  });

  // 2. Join Room
  socket.on('room:join', ({ roomCode, playerName, role }, callback) => {
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: `Room ${code} was not found.` });
      }
      return;
    }

    const existingPlayerCount = Object.keys(room.players).length;
    if (existingPlayerCount >= 4) {
      if (typeof callback === 'function') {
        callback({ success: false, error: `Room ${code} is full (max 4 players).` });
      }
      return;
    }

    // Determine an unassigned role if not supplied or already taken
    const takenRoles = Object.values(room.players).map((p) => p.role).filter(Boolean);
    const availableRoles = ['director', 'engineer', 'science', 'comms'].filter(
      (r) => !takenRoles.includes(r)
    );
    const assignedRole = role && availableRoles.includes(role) ? role : (availableRoles[0] || null);

    const playerId = socket.id;
    const player = {
      id: playerId,
      name: playerName || `Crew Member ${existingPlayerCount + 1}`,
      role: assignedRole,
      isReady: true,
      joinedAt: Date.now(),
    };

    room.players[playerId] = player;
    room.lastSyncedTimestamp = Date.now();

    // Welcome message
    room.chatMessages.push({
      id: `msg-${Date.now()}`,
      senderName: 'SkyRift Uplink',
      role: null,
      text: `${player.name} joined as ${assignedRole ? assignedRole.toUpperCase() : 'OBSERVER'}.`,
      timestamp: Date.now(),
      isQuickMsg: true,
    });

    socket.join(code);

    io.to(code).emit('room:updated', room);

    if (typeof callback === 'function') {
      callback({ success: true, room, playerId });
    }
  });

  // 3. Claim / Switch Role
  socket.on('role:select', ({ roomCode, playerId, role }, callback) => {
    const room = rooms.get(roomCode);
    if (!room || !room.players[playerId]) return;

    // Check if role is already claimed by someone else
    const currentHolder = Object.values(room.players).find(
      (p) => p.id !== playerId && p.role === role
    );

    if (currentHolder) {
      if (typeof callback === 'function') {
        callback({ success: false, error: `${role.toUpperCase()} is already assigned to ${currentHolder.name}.` });
      }
      return;
    }

    room.players[playerId].role = role;
    room.lastSyncedTimestamp = Date.now();

    io.to(roomCode).emit('room:updated', room);
    if (typeof callback === 'function') {
      callback({ success: true, room });
    }
  });

  // 4. Spacecraft Design State Sync (Parts, Mission, Rocket)
  socket.on('state:sync', ({ roomCode, senderRole, stateDiff }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Reset design reviews if spacecraft configuration changes
    if (stateDiff.installedParts || stateDiff.selectedMission || stateDiff.selectedRocket) {
      room.designReviews = {
        director: { approved: false, rejected: false },
        engineer: { approved: false, rejected: false },
        science: { approved: false, rejected: false },
        comms: { approved: false, rejected: false },
      };
    }

    room.lastSyncedTimestamp = Date.now();
    socket.to(roomCode).emit('state:received', { senderRole, stateDiff });
    io.to(roomCode).emit('room:updated', room);
  });

  // 5. Design Review Submission (Approve / Reject)
  socket.on('design_review:update', ({ roomCode, role, decision, reason }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.designReviews[role]) return;

    if (decision === 'approved') {
      room.designReviews[role] = { approved: true, rejected: false, timestamp: Date.now() };

      // If fillEmptyRoles is enabled and this is the host approving, auto-approve unassigned empty roles!
      if (room.fillEmptyRoles !== false && socket.id === room.hostPlayerId) {
        const assignedRoles = Object.values(room.players).map((p) => p.role).filter(Boolean);
        ['director', 'engineer', 'science', 'comms'].forEach((r) => {
          if (!assignedRoles.includes(r)) {
            room.designReviews[r] = {
              approved: true,
              rejected: false,
              autoApproved: true,
              timestamp: Date.now(),
            };
          }
        });
      }
    } else {
      room.designReviews[role] = {
        approved: false,
        rejected: true,
        reason: reason || 'Design parameters need optimization before launch.',
        timestamp: Date.now(),
      };
    }

    room.lastSyncedTimestamp = Date.now();
    io.to(roomCode).emit('design_review:updated', room.designReviews);
    io.to(roomCode).emit('room:updated', room);
  });

  // 5b. Toggle Fill Empty Roles (Host Only)
  socket.on('room:toggle_fill_empty_roles', ({ roomCode, fillEmptyRoles }) => {
    const room = rooms.get(roomCode);
    if (!room) return;
    room.fillEmptyRoles = Boolean(fillEmptyRoles);

    // If turned on and host already approved, sync auto-approval for empty roles
    if (room.fillEmptyRoles) {
      const hostPlayer = room.players[room.hostPlayerId];
      const hostRole = hostPlayer?.role;
      if (hostRole && room.designReviews[hostRole]?.approved) {
        const assignedRoles = Object.values(room.players).map((p) => p.role).filter(Boolean);
        ['director', 'engineer', 'science', 'comms'].forEach((r) => {
          if (!assignedRoles.includes(r)) {
            room.designReviews[r] = {
              approved: true,
              rejected: false,
              autoApproved: true,
              timestamp: Date.now(),
            };
          }
        });
      }
    }

    room.lastSyncedTimestamp = Date.now();
    io.to(roomCode).emit('design_review:updated', room.designReviews);
    io.to(roomCode).emit('room:updated', room);
  });

  // 6. In-Flight Action Vote (Suggestions by other crew)
  socket.on('flight:vote', ({ roomCode, role, senderName, action }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.turnVotes[role] = { role, senderName, action, timestamp: Date.now() };
    io.to(roomCode).emit('flight:votes_updated', room.turnVotes);
  });

  // 7. In-Flight Turn Executed (by Comms & Ops)
  socket.on('flight:execute', ({ roomCode, action, flightState }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Clear votes for next turn
    room.turnVotes = {};
    io.to(roomCode).emit('flight:executed', { action, flightState });
    io.to(roomCode).emit('flight:votes_updated', {});
  });

  // 8. Chat Message
  socket.on('chat:send', ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const fullMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderName: message.senderName || 'Crew Member',
      role: message.role || null,
      text: message.text,
      timestamp: Date.now(),
      isQuickMsg: !!message.isQuickMsg,
    };

    room.chatMessages.push(fullMsg);
    if (room.chatMessages.length > 60) {
      room.chatMessages.shift();
    }

    io.to(roomCode).emit('chat:received', fullMsg);
  });

  // Disconnect Handling
  socket.on('disconnect', () => {
    for (const [code, room] of rooms.entries()) {
      if (room.players[socket.id]) {
        const pName = room.players[socket.id].name;
        delete room.players[socket.id];

        if (Object.keys(room.players).length === 0) {
          rooms.delete(code);
        } else {
          room.chatMessages.push({
            id: `msg-${Date.now()}`,
            senderName: 'SkyRift Uplink',
            role: null,
            text: `${pName} disconnected.`,
            timestamp: Date.now(),
            isQuickMsg: true,
          });
          io.to(code).emit('room:updated', room);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`[SkyRift] Team Socket Server listening on port ${PORT}`);
});

