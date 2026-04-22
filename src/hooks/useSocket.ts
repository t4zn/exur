/**
 * useSocket — React hook for Socket.IO collaboration
 *
 * Full support for: code sync, cursor tracking, chat (with replies/reactions/delete/typing),
 * and multi-tab file operations (create/switch/rename/close).
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ─────────────────────────────────────────────────────────────

export interface RemoteUser {
  socketId: string;
  username: string;
  color: string;
  cursor?: { lineNumber: number; column: number } | null;
}

export interface ChatMessage {
  id: string;
  socketId: string;
  username: string;
  color: string;
  message: string;
  replyTo?: { id: string; message: string; username: string } | null;
  timestamp: number;
  deleted: boolean;
}

export interface FileTab {
  id: string;
  filename: string;
  language: string;
  code: string;
}

export interface RoomState {
  code: string;
  language: string;
  users: Record<string, RemoteUser>;
  chat: ChatMessage[];
  files: FileTab[];
  activeFileId: string;
  you: { socketId: string; username: string; color: string };
}

interface UseSocketOptions {
  roomId: string;
  onRoomState?: (state: RoomState) => void;
  onCodeUpdate?: (code: string, senderId: string, fileId?: string) => void;
  onLanguageUpdate?: (language: string, senderId: string) => void;
  onCursorUpdate?: (data: { socketId: string; cursor: { lineNumber: number; column: number } | null; username: string; color: string }) => void;
  onUserJoined?: (user: RemoteUser) => void;
  onUserLeft?: (data: { socketId: string; username: string }) => void;
  onChatUpdate?: (message: ChatMessage) => void;
  onChatReaction?: (data: { messageId: string; emoji: string; username: string; socketId: string }) => void;
  onChatDelete?: (data: { messageId: string }) => void;
  onChatTyping?: (data: { socketId: string; username: string; isTyping: boolean }) => void;
  // File tab events
  onFileCreated?: (data: { file: FileTab; senderId: string }) => void;
  onFileSwitched?: (data: { fileId: string; senderId: string }) => void;
  onFileRenamed?: (data: { fileId: string; filename: string; senderId: string }) => void;
  onFileClosed?: (data: { fileId: string; newActiveFileId: string; senderId: string }) => void;
}

export function useSocket(opts: UseSocketOptions) {
  const { roomId } = opts;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(opts);

  useEffect(() => { callbacksRef.current = opts; });

  useEffect(() => {
    const socket = io({ transports: ['websocket', 'polling'], reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;

    socket.on('connect', () => { setIsConnected(true); socket.emit('join-room', { roomId }); });
    socket.on('disconnect', () => setIsConnected(false));

    // Room
    socket.on('room-state', (state: RoomState) => callbacksRef.current.onRoomState?.(state));
    socket.on('code-update', ({ code, senderId, fileId }: any) => callbacksRef.current.onCodeUpdate?.(code, senderId, fileId));
    socket.on('language-update', ({ language, senderId }: any) => callbacksRef.current.onLanguageUpdate?.(language, senderId));
    socket.on('cursor-update', (data: any) => callbacksRef.current.onCursorUpdate?.(data));
    socket.on('user-joined', (user: RemoteUser) => callbacksRef.current.onUserJoined?.(user));
    socket.on('user-left', (data: any) => callbacksRef.current.onUserLeft?.(data));

    // Chat
    socket.on('chat-update', (msg: ChatMessage) => callbacksRef.current.onChatUpdate?.(msg));
    socket.on('chat-reaction-update', (data: any) => callbacksRef.current.onChatReaction?.(data));
    socket.on('chat-delete-update', (data: any) => callbacksRef.current.onChatDelete?.(data));
    socket.on('chat-typing-update', (data: any) => callbacksRef.current.onChatTyping?.(data));

    // File tabs
    socket.on('file-created', (data: any) => callbacksRef.current.onFileCreated?.(data));
    socket.on('file-switched', (data: any) => callbacksRef.current.onFileSwitched?.(data));
    socket.on('file-renamed', (data: any) => callbacksRef.current.onFileRenamed?.(data));
    socket.on('file-closed', (data: any) => callbacksRef.current.onFileClosed?.(data));

    return () => { socket.disconnect(); socketRef.current = null; setIsConnected(false); };
  }, [roomId]);

  // ── Emitters ──────────────────────────────────────────────────────
  const emitCodeChange = useCallback((code: string, fileId?: string) => {
    socketRef.current?.emit('code-change', { roomId, code, fileId });
  }, [roomId]);

  const emitLanguageChange = useCallback((language: string) => {
    socketRef.current?.emit('language-change', { roomId, language });
  }, [roomId]);

  const emitCursorMove = useCallback((cursor: { lineNumber: number; column: number }) => {
    socketRef.current?.emit('cursor-move', { roomId, cursor });
  }, [roomId]);

  const emitChatMessage = useCallback((message: string, replyTo?: { id: string; message: string; username: string }) => {
    socketRef.current?.emit('chat-message', { roomId, message, replyTo });
  }, [roomId]);

  const emitChatReaction = useCallback((messageId: string, emoji: string) => {
    socketRef.current?.emit('chat-reaction', { roomId, messageId, emoji });
  }, [roomId]);

  const emitChatDelete = useCallback((messageId: string) => {
    socketRef.current?.emit('chat-delete', { roomId, messageId });
  }, [roomId]);

  const emitChatTyping = useCallback((isTyping: boolean) => {
    socketRef.current?.emit('chat-typing', { roomId, isTyping });
  }, [roomId]);

  // File tab emitters
  const emitFileCreate = useCallback((file: FileTab) => {
    socketRef.current?.emit('file-create', { roomId, file });
  }, [roomId]);

  const emitFileSwitch = useCallback((fileId: string) => {
    socketRef.current?.emit('file-switch', { roomId, fileId });
  }, [roomId]);

  const emitFileRename = useCallback((fileId: string, filename: string) => {
    socketRef.current?.emit('file-rename', { roomId, fileId, filename });
  }, [roomId]);

  const emitFileClose = useCallback((fileId: string) => {
    socketRef.current?.emit('file-close', { roomId, fileId });
  }, [roomId]);

  return {
    isConnected,
    socketId: socketRef.current?.id ?? null,
    emitCodeChange, emitLanguageChange, emitCursorMove,
    emitChatMessage, emitChatReaction, emitChatDelete, emitChatTyping,
    emitFileCreate, emitFileSwitch, emitFileRename, emitFileClose,
  };
}
