/**
 * Custom server for Exur — wraps Next.js with Socket.IO
 * for real-time collaborative editing.
 *
 * Room state (code, users, chat) is kept entirely in-memory.
 * No database required.
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Colour palette for cursor labels ──────────────────────────────────
const CURSOR_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
  '#f472b6', '#e879f9', '#ff6b6b', '#51cf66',
  '#339af0', '#cc5de8', '#ff922b', '#20c997',
];

// ── In-memory room store ──────────────────────────────────────────────
const rooms = new Map();

/**
 * Generate a 4-character lowercase alphabetic room code.
 */
function generateRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(code)); // Ensure uniqueness
  return code;
}

/**
 * Create a new room with the given ID.
 */
function createRoom(roomId) {
  const room = {
    code: 'print("Hello, World!")\nprint("Welcome to Exur!")',
    language: 'python',
    users: new Map(),
    chat: [],
    files: [
      {
        id: '1',
        filename: 'main.py',
        language: 'python',
        code: 'print("Hello, World!")\nprint("Welcome to Exur!")',
      },
    ],
    activeFileId: '1',
    // Version history: Map<fileId, Array<{id, code, username, timestamp, label}>>
    versions: new Map(),
    // Debounce timers for auto-snapshots per file
    _autoSnapshotTimers: new Map(),
  };
  // Seed initial version for the default file
  room.versions.set('1', [{
    id: 'v-init',
    code: 'print("Hello, World!")\nprint("Welcome to Exur!")',
    username: 'System',
    timestamp: Date.now(),
    label: 'Initial code',
  }]);
  rooms.set(roomId, room);
  return room;
}

/**
 * Get an existing room by its ID. Returns null if not found.
 */
function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

/**
 * Pick a random single-word techy username.
 */
function generateUsername() {
  const names = [
    'Void', 'Flux', 'Byte', 'Pixel', 'Node',
    'Zinc', 'Apex', 'Onyx', 'Echo', 'Sage',
    'Neon', 'Volt', 'Drift', 'Pulse', 'Ember',
    'Helix', 'Prism', 'Blaze', 'Crypt', 'Glitch',
    'Orbit', 'Synth', 'Qubit', 'Warp', 'Haze',
    'Iris', 'Kern', 'Lumen', 'Mist', 'Nexus',
    'Oxide', 'Rune', 'Spark', 'Trace', 'Unix',
    'Vex', 'Wren', 'Xenon', 'Zeta', 'Arc',
    'Cipher', 'Delta', 'Ether', 'Fuse', 'Grid',
    'Hex', 'Ion', 'Jolt', 'Kite', 'Loop',
    'Macro', 'Null', 'Optic', 'Port', 'Quartz',
    'Relay', 'Shard', 'Turbo', 'Ultra', 'Vector',
  ];
  return names[Math.floor(Math.random() * names.length)];
}

// ── Boot ──────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Attach Socket.IO to the same HTTP server
  const { Server } = require('socket.io');
  const io = new Server(httpServer, {
    cors: { 
      origin: [
        'https://exur.in',
        'https://www.exur.in',
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Increase max buffer for large code payloads
    maxHttpBufferSize: 1e7,
  });

  // ── Socket event handlers ─────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ─── create-room ──────────────────────────────────────────────
    // Client requests a new room. Server generates a 4-char code,
    // creates the room, and sends back the room ID.
    socket.on('create-room', (callback) => {
      const roomId = generateRoomCode();
      createRoom(roomId);
      console.log(`[room ${roomId}] created`);
      if (typeof callback === 'function') {
        callback({ success: true, roomId });
      }
    });

    // ─── check-room ──────────────────────────────────────────────
    // Client checks if a room exists before joining.
    socket.on('check-room', ({ roomId }, callback) => {
      const normalizedId = roomId.toLowerCase();
      const exists = rooms.has(normalizedId);
      if (typeof callback === 'function') {
        callback({ exists, roomId: normalizedId });
      }
    });

    // ─── join-room ────────────────────────────────────────────────
    // Client sends { roomId } when the editor page mounts.
    // Server replies with the current room state and broadcasts the
    // new user to everyone else in the room. Room must already exist.
    socket.on('join-room', ({ roomId, username: clientUsername }) => {
      const normalizedId = roomId.toLowerCase();
      const room = getRoom(normalizedId);

      if (!room) {
        socket.emit('room-not-found', { roomId: normalizedId });
        return;
      }

      // Use client-provided username if valid, otherwise generate one
      const username = (clientUsername && clientUsername.trim().length > 0)
        ? clientUsername.trim().substring(0, 20) // max 20 chars
        : generateUsername();
      const color = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

      const defaultFileId = room.files.length > 0 ? room.files[0].id : '1';
      room.users.set(socket.id, { username, color, cursor: null, activeFileId: defaultFileId });
      socket.join(normalizedId);
      socket.data.roomId = normalizedId;

      // Send full room state including files
      socket.emit('room-state', {
        code: room.code,
        language: room.language,
        users: Object.fromEntries(room.users),
        chat: room.chat,
        files: room.files,
        activeFileId: room.activeFileId,
        you: { socketId: socket.id, username, color },
      });

      socket.to(normalizedId).emit('user-joined', {
        socketId: socket.id,
        username,
        color,
        activeFileId: defaultFileId,
      });

      console.log(`[room ${normalizedId}] ${username} joined (${room.users.size} users)`);
    });

    // ─── code-change ──────────────────────────────────────────────
    // Update code for a specific file tab only.
    socket.on('code-change', ({ roomId, code, fileId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Update the specific file's code
      if (fileId) {
        const file = room.files.find(f => f.id === fileId);
        if (file) file.code = code;
        // Track which file this user is editing
        const user = room.users.get(socket.id);
        if (user) user.activeFileId = fileId;
      }

      socket.to(roomId).emit('code-update', {
        code,
        fileId,
        senderId: socket.id,
      });

      // Auto-snapshot: debounce 30s after last edit per file
      const timerKey = `${roomId}-${fileId || 'main'}`;
      if (room._autoSnapshotTimers.has(timerKey)) {
        clearTimeout(room._autoSnapshotTimers.get(timerKey));
      }
      room._autoSnapshotTimers.set(timerKey, setTimeout(() => {
        const fId = fileId || '1';
        const user = room.users.get(socket.id);
        const versions = room.versions.get(fId) || [];
        const lastVersion = versions[versions.length - 1];
        // Only snapshot if code actually changed from last version
        if (!lastVersion || lastVersion.code !== code) {
          const entry = {
            id: `v-${Date.now()}`,
            code,
            username: user?.username || 'Unknown',
            timestamp: Date.now(),
            label: 'Auto-save',
          };
          versions.push(entry);
          // Keep max 30 versions per file
          if (versions.length > 30) versions.shift();
          room.versions.set(fId, versions);
        }
        room._autoSnapshotTimers.delete(timerKey);
      }, 30000));
    });

    // ─── language-change ──────────────────────────────────────────
    socket.on('language-change', ({ roomId, language }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.language = language;
      socket.to(roomId).emit('language-update', {
        language,
        senderId: socket.id,
      });
    });

    // ─── File tab operations ─────────────────────────────────────

    // Create a new file tab — broadcast to OTHERS so they see the tab,
    // but don't force them to switch to it.
    socket.on('file-create', ({ roomId, file }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.files.push(file);
      // Broadcast to others only (sender already added it locally)
      socket.to(roomId).emit('file-created', { file, senderId: socket.id });
    });

    // Switch active file — tracks file presence for other users.
    // Each user navigates tabs independently, but we broadcast
    // which file they're viewing so others can see presence.
    socket.on('file-switch', ({ roomId, fileId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const user = room.users.get(socket.id);
      if (user) user.activeFileId = fileId;
      // Broadcast presence change to others
      socket.to(roomId).emit('user-file-focus', {
        socketId: socket.id,
        fileId,
      });
    });

    // Rename a file tab
    socket.on('file-rename', ({ roomId, fileId, filename }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const file = room.files.find(f => f.id === fileId);
      if (file) file.filename = filename;
      socket.to(roomId).emit('file-renamed', { fileId, filename, senderId: socket.id });
    });

    // Close/delete a file tab
    socket.on('file-close', ({ roomId, fileId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.files = room.files.filter(f => f.id !== fileId);
      // If the closed file was active, switch to the first remaining file
      if (room.activeFileId === fileId && room.files.length > 0) {
        room.activeFileId = room.files[0].id;
      }
      io.to(roomId).emit('file-closed', { fileId, newActiveFileId: room.activeFileId, senderId: socket.id });
    });

    // ─── cursor-move ──────────────────────────────────────────────
    // Each client debounces this to ~50ms on the frontend.
    // We just relay it to the rest of the room.
    socket.on('cursor-move', ({ roomId, cursor }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (user) user.cursor = cursor;

      socket.to(roomId).emit('cursor-update', {
        socketId: socket.id,
        cursor,
        username: user?.username,
        color: user?.color,
        activeFileId: user?.activeFileId,
      });
    });

    // ─── chat-message ─────────────────────────────────────────────
    // Now supports message IDs and reply-to references.
    socket.on('chat-message', ({ roomId, message, replyTo }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      const chatEntry = {
        id: `${socket.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        socketId: socket.id,
        username: user.username,
        color: user.color,
        message,
        replyTo: replyTo || null, // { id, message, username }
        timestamp: Date.now(),
        deleted: false,
      };

      // Keep last 200 messages in memory per room
      room.chat.push(chatEntry);
      if (room.chat.length > 200) room.chat.shift();

      // Broadcast to EVERYONE in the room (including sender for confirmation)
      io.to(roomId).emit('chat-update', chatEntry);
    });

    // ─── chat-reaction ────────────────────────────────────────────
    // Toggle an emoji reaction on a message.
    socket.on('chat-reaction', ({ roomId, messageId, emoji }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      io.to(roomId).emit('chat-reaction-update', {
        messageId,
        emoji,
        username: user.username,
        socketId: socket.id,
      });
    });

    // ─── chat-delete ──────────────────────────────────────────────
    // Mark a message as "unsent" (soft delete).
    // Match by username since socketId can change on reconnection.
    socket.on('chat-delete', ({ roomId, messageId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      // Find the message — allow delete if username matches (handles reconnects)
      const msg = room.chat.find(m => m.id === messageId && m.username === user.username);
      if (msg) {
        msg.deleted = true;
        io.to(roomId).emit('chat-delete-update', { messageId });
      }
    });

    // ─── chat-typing ──────────────────────────────────────────────
    // Broadcast typing indicator to other users.
    socket.on('chat-typing', ({ roomId, isTyping }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      if (!user) return;

      socket.to(roomId).emit('chat-typing-update', {
        socketId: socket.id,
        username: user.username,
        isTyping,
      });
    });

    // ─── Version history ─────────────────────────────────────────

    // Manual save — user clicks "Save Version"
    socket.on('save-version', ({ roomId, fileId, label }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const user = room.users.get(socket.id);
      const fId = fileId || '1';
      const file = room.files.find(f => f.id === fId);
      if (!file) return;

      const versions = room.versions.get(fId) || [];
      const entry = {
        id: `v-${Date.now()}`,
        code: file.code,
        username: user?.username || 'Unknown',
        timestamp: Date.now(),
        label: label || 'Manual save',
      };
      versions.push(entry);
      if (versions.length > 30) versions.shift();
      room.versions.set(fId, versions);

      // Notify all users in room
      io.to(roomId).emit('version-saved', { fileId: fId, version: entry });
    });

    // Get version history for a file
    socket.on('get-versions', ({ roomId, fileId }, callback) => {
      const room = rooms.get(roomId);
      if (!room) { if (callback) callback([]); return; }
      const versions = room.versions.get(fileId || '1') || [];
      if (callback) callback(versions);
    });

    // Revert to a specific version
    socket.on('version-revert', ({ roomId, fileId, versionId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const fId = fileId || '1';
      const versions = room.versions.get(fId) || [];
      const version = versions.find(v => v.id === versionId);
      if (!version) return;

      // Update the file's code
      const file = room.files.find(f => f.id === fId);
      if (file) file.code = version.code;

      // Save a new version marking the revert
      const user = room.users.get(socket.id);
      const revertEntry = {
        id: `v-${Date.now()}`,
        code: version.code,
        username: user?.username || 'Unknown',
        timestamp: Date.now(),
        label: `Reverted to "${version.label}"`,
      };
      versions.push(revertEntry);
      if (versions.length > 30) versions.shift();
      room.versions.set(fId, versions);

      // Broadcast the reverted code to all users
      io.to(roomId).emit('code-update', {
        code: version.code,
        fileId: fId,
        senderId: socket.id,
      });
      io.to(roomId).emit('version-reverted', { fileId: fId, version: revertEntry });
    });

    // ─── disconnect ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.get(socket.id);
      room.users.delete(socket.id);

      // Tell remaining users to remove this cursor
      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        username: user?.username,
      });

      console.log(`[room ${roomId}] ${user?.username} left (${room.users.size} users)`);

      // Garbage-collect empty rooms after 5 minutes
      if (room.users.size === 0) {
        setTimeout(() => {
          const r = rooms.get(roomId);
          if (r && r.users.size === 0) {
            rooms.delete(roomId);
            console.log(`[room ${roomId}] cleaned up (empty)`);
          }
        }, 5 * 60 * 1000);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Exur ready on http://${hostname}:${port}`);
  });
});
