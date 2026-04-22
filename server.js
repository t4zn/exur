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
 * Get or create a room by its ID.
 * Each room tracks: code, language, connected users, and chat history.
 */
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      code: 'print("Hello, World!")\nprint("Welcome to Exur!")',
      language: 'python',
      users: new Map(),
      chat: [],
      // Multi-tab file system
      files: [
        {
          id: '1',
          filename: 'main.py',
          language: 'python',
          code: 'print("Hello, World!")\nprint("Welcome to Exur!")',
        },
      ],
      activeFileId: '1',
    });
  }
  return rooms.get(roomId);
}

/**
 * Pick a random adjective+noun username, e.g. "SwiftFox42".
 */
function generateUsername() {
  const adjectives = [
    'Swift', 'Clever', 'Bold', 'Bright', 'Cosmic',
    'Lunar', 'Neon', 'Pixel', 'Quantum', 'Zen',
    'Turbo', 'Cyber', 'Nova', 'Stellar', 'Atomic',
  ];
  const nouns = [
    'Fox', 'Wolf', 'Eagle', 'Panda', 'Tiger',
    'Falcon', 'Lynx', 'Otter', 'Phoenix', 'Dragon',
    'Hawk', 'Bear', 'Cobra', 'Raven', 'Shark',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
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

    // ─── join-room ────────────────────────────────────────────────
    // Client sends { roomId } when the editor page mounts.
    // Server replies with the current room state and broadcasts the
    // new user to everyone else in the room.
    socket.on('join-room', ({ roomId }) => {
      const room = getRoom(roomId);
      const username = generateUsername();
      const color = CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

      room.users.set(socket.id, { username, color, cursor: null });
      socket.join(roomId);
      socket.data.roomId = roomId;

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

      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        username,
        color,
      });

      console.log(`[room ${roomId}] ${username} joined (${room.users.size} users)`);
    });

    // ─── code-change ──────────────────────────────────────────────
    // Update code for a specific file tab.
    socket.on('code-change', ({ roomId, code, fileId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Update the specific file's code
      if (fileId) {
        const file = room.files.find(f => f.id === fileId);
        if (file) file.code = code;
      }
      room.code = code; // also keep top-level for backward compat

      socket.to(roomId).emit('code-update', {
        code,
        fileId,
        senderId: socket.id,
      });
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

    // Create a new file tab
    socket.on('file-create', ({ roomId, file }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.files.push(file);
      room.activeFileId = file.id;
      io.to(roomId).emit('file-created', { file, senderId: socket.id });
    });

    // Switch active file
    socket.on('file-switch', ({ roomId, fileId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.activeFileId = fileId;
      socket.to(roomId).emit('file-switched', { fileId, senderId: socket.id });
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
