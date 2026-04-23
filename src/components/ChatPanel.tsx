/**
 * ChatPanel — Advanced real-time chat for collaborative rooms
 *
 * Fixed: overflow, padding, reply preview, delete, edge breathing
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../hooks/useSocket';
import { useTheme } from './ThemeProvider';

const EMOJI_LIST = [
  '😀', '😂', '🥹', '😍', '🤔', '😎', '🥳', '😴',
  '👍', '👎', '❤️', '🔥', '🎉', '💯', '✨', '🚀',
];

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string, replyTo?: { id: string; message: string; username: string }) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onTyping?: (isTyping: boolean) => void;
  currentUsername: string;
  currentSocketId?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  typingUsers?: { socketId: string; username: string }[];
  reactions?: Record<string, { emoji: string; username: string }>;
  deletedMessages?: Set<string>;
}

export default function ChatPanel({
  messages, onSend, onReaction, onDelete, onTyping,
  currentUsername, currentSocketId,
  isCollapsed, onToggleCollapse,
  typingUsers = [], reactions = {}, deletedMessages = new Set(),
}: ChatPanelProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [textareaRows, setTextareaRows] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    if (!activeReactionMsgId) return;
    const handler = () => setActiveReactionMsgId(null);
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => { clearTimeout(timer); document.removeEventListener('click', handler); };
  }, [activeReactionMsgId]);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const reply = replyingTo
      ? { id: replyingTo.id, message: replyingTo.message, username: replyingTo.username }
      : undefined;
    onSend(trimmed, reply);
    setInput('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    onTyping?.(false);
    setTextareaRows(1);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    
    // Auto-resize textarea based on content (up to 3 lines)
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const lineHeight = 20; // approximate line height
      const maxHeight = lineHeight * 3;
      const scrollHeight = inputRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, maxHeight);
      inputRef.current.style.height = `${newHeight}px`;
      
      const lines = Math.min(Math.ceil(scrollHeight / lineHeight), 3);
      setTextareaRows(lines);
    }
    
    if (val.trim()) {
      onTyping?.(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping?.(false), 2000);
    } else {
      onTyping?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="fixed bottom-20 right-6 z-40 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        style={{ backgroundColor: '#fbbf24', color: '#000' }}
        aria-label="Open chat"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  const isMine = (msg: ChatMessage) => msg.username === currentUsername;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Chat</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', color: 'var(--foreground)', opacity: 0.6 }}>
            {messages.filter(m => !deletedMessages.has(m.id) && !m.deleted).length}
          </span>
        </div>
      </div>

      {/* Messages area with rounded border */}
      <div className="flex-1 min-h-0 mx-3 rounded-2xl overflow-hidden" style={{
        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fafafa',
        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
      }}>
        <div ref={scrollRef} className="h-full overflow-y-auto px-3 py-3 space-y-3 scrollbar-hide">
          {messages.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: 'var(--foreground)', opacity: 0.3 }}>
              No messages yet
            </div>
          )}

          {messages.map((msg, idx) => {
            const mine = isMine(msg);
            const isDeleted = deletedMessages.has(msg.id) || msg.deleted;
            const reaction = reactions[msg.id];
            const showReactions = activeReactionMsgId === msg.id;

            return (
              <div key={msg.id || `msg-${idx}`} className={`flex flex-col ${mine ? 'items-end' : 'items-start'} group`}>
                {/* Username + time */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold" style={{ color: msg.color }}>
                    {mine ? 'You' : msg.username}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                <div className="relative max-w-[85%]">
                  {isDeleted ? (
                    <div className="px-3 py-1.5 rounded-xl text-xs italic" style={{
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      color: 'var(--foreground)', opacity: 0.4,
                      borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}>
                      This message was unsent
                    </div>
                  ) : (
                    <>
                      {/* Reply reference preview */}
                      {msg.replyTo && (
                        <div className="flex items-center gap-1 mb-1 px-2.5 py-1 rounded-lg text-[10px]" style={{
                          backgroundColor: theme === 'dark' ? 'rgba(129,65,230,0.15)' : 'rgba(129,65,230,0.1)',
                          color: 'var(--foreground)', opacity: 0.7,
                          borderLeft: '2px solid #8141e6',
                        }}>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-[9px]" style={{ color: '#8141e6' }}>{msg.replyTo.username}</span>
                            <span className="truncate">{msg.replyTo.message}</span>
                          </div>
                        </div>
                      )}

                      {/* Bubble */}
                      <div className="px-3 py-1.5 rounded-xl text-xs leading-relaxed break-words cursor-default" style={{
                        backgroundColor: mine
                          ? '#8141e6'
                          : (theme === 'dark' ? '#ffffff' : 'rgba(128,128,128,0.15)'),
                        color: mine ? '#ffffff' : (theme === 'dark' ? '#000000' : 'var(--foreground)'),
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      }}>
                        {msg.message}
                      </div>

                      {/* Hover action buttons */}
                      <div className={`absolute ${mine ? '-left-12' : '-right-12'} top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150`}>
                        <button onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--foreground)', opacity: 0.5 }} title="Reply">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-start gap-1">
              <div className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: '16px 16px 16px 4px' }}>
                <span className="inline-flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--foreground)', opacity: 0.4, animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--foreground)', opacity: 0.4, animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--foreground)', opacity: 0.4, animationDelay: '400ms' }} />
                </span>
                <span className="text-[10px] ml-1" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {typingUsers.map(u => u.username).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input area — with bottom margin to clear InfoOverlay */}
      <div className="flex-shrink-0 mx-3 mt-2 mb-14">
        {/* Reply preview bar */}
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-lg text-[10px]" style={{
            backgroundColor: theme === 'dark' ? 'rgba(129,65,230,0.15)' : 'rgba(129,65,230,0.1)',
            color: 'var(--foreground)',
            borderLeft: '2px solid #8141e6',
          }}>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold text-[9px]" style={{ color: '#8141e6' }}>
                Replying to {replyingTo.username === currentUsername ? 'yourself' : replyingTo.username}
              </span>
              <span className="truncate opacity-70">{replyingTo.message}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="ml-2 flex-shrink-0 p-0.5 rounded hover:opacity-70" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full px-3 py-2 chat-input-border" style={{
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        }}>
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-70" style={{ color: 'var(--foreground)', opacity: 0.5 }} aria-label="Emoji">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <circle cx="9" cy="9" r="0.5" fill="currentColor" />
              <circle cx="15" cy="9" r="0.5" fill="currentColor" />
            </svg>
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs leading-relaxed placeholder:opacity-40 outline-none"
            style={{ color: 'var(--foreground)', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif', minHeight: '20px', maxHeight: '60px', overflowY: textareaRows >= 3 ? 'auto' : 'hidden' }}
          />

          <button onClick={handleSend} disabled={!input.trim()} className="flex-shrink-0 p-2 rounded-full transition-all duration-200 disabled:opacity-30 hover:opacity-80"
            style={{ backgroundColor: input.trim() ? '#8141e6' : 'rgba(255,255,255,0.1)', color: input.trim() ? '#fff' : 'var(--foreground)' }} aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
          </button>
        </div>

        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 rounded-xl grid grid-cols-8 gap-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
            {EMOJI_LIST.map((emoji, i) => (
              <button key={i} onClick={() => { setInput(input + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }} className="text-base hover:scale-125 transition-transform p-1 rounded hover:bg-white/10">
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
