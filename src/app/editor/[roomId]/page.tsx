'use client';

import { useState, useCallback, useRef } from 'react';
import { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../components/ThemeProvider';
import CollaborativeEditor from '../../../components/CollaborativeEditor';
import ChatPanel from '../../../components/ChatPanel';
import Output from '../../../components/Output';
import ResizablePanels from '../../../components/ResizablePanels';
import ResizablePanelsVertical from '../../../components/ResizablePanelsVertical';
import LanguageSelector from '../../../components/LanguageSelector';
import InfoOverlay from '../../../components/info-overlay';
import { useSocket, RemoteUser, ChatMessage, RoomState, FileTab } from '../../../hooks/useSocket';
import { useJudge0 } from '../../../hooks/useJudge0';

const STORAGE_PREFIX = 'exur-collab-';
function saveToLocal(roomId: string, code: string) { try { localStorage.setItem(`${STORAGE_PREFIX}${roomId}`, code); } catch {} }

const defaultCodes: Record<string, { code: string; filename: string }> = {
  python: { code: 'print("Hello, World!")', filename: 'main.py' },
  javascript: { code: 'console.log("Hello, World!");', filename: 'script.js' },
  typescript: { code: 'console.log("Hello, World!");', filename: 'script.ts' },
  java: { code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}', filename: 'Main.java' },
  cpp: { code: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}', filename: 'main.cpp' },
  c: { code: '#include <stdio.h>\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}', filename: 'main.c' },
  go: { code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}', filename: 'main.go' },
  rust: { code: 'fn main() {\n    println!("Hello, World!");\n}', filename: 'main.rs' },
  ruby: { code: 'puts "Hello, World!"', filename: 'main.rb' },
  php: { code: '<?php\necho "Hello, World!\\n";\n?>', filename: 'index.php' },
  swift: { code: 'print("Hello, World!")', filename: 'main.swift' },
  kotlin: { code: 'fun main() {\n    println("Hello, World!")\n}', filename: 'Main.kt' },
};

export default function CollaborativeEditorPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // State
  const [files, setFiles] = useState<FileTab[]>([{ id: '1', filename: 'script.js', language: 'javascript', code: '// Connecting...' }]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [language, setLanguage] = useState('javascript');
  const [remoteUsers, setRemoteUsers] = useState<Map<string, RemoteUser>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myInfo, setMyInfo] = useState<{ socketId: string; username: string; color: string } | null>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [executionStats, setExecutionStats] = useState<{ time: number | null; memory: number | null }>({ time: null, memory: null });
  const [chatReactions, setChatReactions] = useState<Record<string, { emoji: string; username: string }>>({});
  const [deletedMsgIds, setDeletedMsgIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<{ socketId: string; username: string }[]>([]);
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [editingName, setEditingName] = useState('');
  const isRemoteUpdateRef = useRef(false);
  const fileIdCounter = useRef(2);

  const { executeCode, isLoading } = useJudge0();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const code = activeFile?.code || '';

  // Socket callbacks
  const handleRoomState = useCallback((state: RoomState) => {
    isRemoteUpdateRef.current = true;
    if (state.files?.length) {
      setFiles(state.files);
      setActiveFileId(state.activeFileId || state.files[0].id);
      fileIdCounter.current = Math.max(...state.files.map(f => parseInt(f.id) || 0)) + 1;
    }
    setLanguage(state.language);
    setMyInfo(state.you);
    const usersMap = new Map<string, RemoteUser>();
    for (const [sid, user] of Object.entries(state.users)) {
      if (sid !== state.you.socketId) usersMap.set(sid, user as RemoteUser);
    }
    setRemoteUsers(usersMap);
    setOnlineCount(Object.keys(state.users).length);
    setChatMessages(state.chat);
  }, []);

  const handleCodeUpdate = useCallback((newCode: string, _sid: string, fileId?: string) => {
    isRemoteUpdateRef.current = true;
    setFiles(prev => prev.map(f => f.id === (fileId || activeFileId) ? { ...f, code: newCode } : f));
  }, [activeFileId]);

  const handleLanguageUpdate = useCallback((l: string) => setLanguage(l), []);
  const handleCursorUpdate = useCallback((d: any) => {
    setRemoteUsers(prev => { const n = new Map(prev); n.set(d.socketId, { ...d }); return n; });
  }, []);
  const handleUserJoined = useCallback((u: RemoteUser) => {
    setRemoteUsers(prev => { const n = new Map(prev); n.set(u.socketId, u); return n; });
    setOnlineCount(c => c + 1);
  }, []);
  const handleUserLeft = useCallback((d: any) => {
    setRemoteUsers(prev => { const n = new Map(prev); n.delete(d.socketId); return n; });
    setOnlineCount(c => Math.max(1, c - 1));
  }, []);
  const handleChatUpdate = useCallback((m: ChatMessage) => setChatMessages(p => [...p, m]), []);
  const handleChatReaction = useCallback((d: any) => {
    setChatReactions(p => { const n = { ...p }; if (n[d.messageId]?.emoji === d.emoji) delete n[d.messageId]; else n[d.messageId] = { emoji: d.emoji, username: d.username }; return n; });
  }, []);
  const handleChatDelete = useCallback((d: any) => setDeletedMsgIds(p => new Set(p).add(d.messageId)), []);
  const handleChatTyping = useCallback((d: any) => {
    setTypingUsers(p => d.isTyping ? (p.find(u => u.socketId === d.socketId) ? p : [...p, { socketId: d.socketId, username: d.username }]) : p.filter(u => u.socketId !== d.socketId));
  }, []);

  // File tab callbacks from server
  const handleFileCreated = useCallback((d: any) => {
    setFiles(p => [...p, d.file]);
    setActiveFileId(d.file.id);
    fileIdCounter.current = Math.max(fileIdCounter.current, parseInt(d.file.id) || 0) + 1;
  }, []);
  const handleFileSwitched = useCallback((d: any) => setActiveFileId(d.fileId), []);
  const handleFileRenamed = useCallback((d: any) => {
    setFiles(p => p.map(f => f.id === d.fileId ? { ...f, filename: d.filename } : f));
  }, []);
  const handleFileClosed = useCallback((d: any) => {
    setFiles(p => p.filter(f => f.id !== d.fileId));
    setActiveFileId(prev => prev === d.fileId ? d.newActiveFileId : prev);
  }, []);

  const {
    isConnected, emitCodeChange, emitLanguageChange, emitCursorMove,
    emitChatMessage, emitChatReaction, emitChatDelete, emitChatTyping,
    emitFileCreate, emitFileSwitch, emitFileRename, emitFileClose,
  } = useSocket({
    roomId,
    onRoomState: handleRoomState, onCodeUpdate: handleCodeUpdate,
    onLanguageUpdate: handleLanguageUpdate, onCursorUpdate: handleCursorUpdate,
    onUserJoined: handleUserJoined, onUserLeft: handleUserLeft,
    onChatUpdate: handleChatUpdate, onChatReaction: handleChatReaction,
    onChatDelete: handleChatDelete, onChatTyping: handleChatTyping,
    onFileCreated: handleFileCreated, onFileSwitched: handleFileSwitched,
    onFileRenamed: handleFileRenamed, onFileClosed: handleFileClosed,
  });

  // Local code change
  const handleCodeChange = useCallback((v: string | undefined) => {
    const val = v ?? '';
    if (isRemoteUpdateRef.current) { isRemoteUpdateRef.current = false; return; }
    setFiles(p => p.map(f => f.id === activeFileId ? { ...f, code: val } : f));
    saveToLocal(roomId, val);
    emitCodeChange(val, activeFileId);
  }, [roomId, emitCodeChange, activeFileId]);

  // Language change
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const d = defaultCodes[lang] || { code: '// Write your code here', filename: 'main.txt' };
    const newFile: FileTab = { id: String(fileIdCounter.current++), filename: d.filename, language: lang, code: d.code };
    setFiles(p => [...p, newFile]);
    setActiveFileId(newFile.id);
    emitFileCreate(newFile);
    emitLanguageChange(lang);
  };

  // File tab operations
  const createNewFile = () => {
    const d = defaultCodes[language] || { code: '', filename: 'untitled.txt' };
    const newFile: FileTab = { id: String(fileIdCounter.current++), filename: d.filename, language, code: d.code };
    setFiles(p => [...p, newFile]);
    setActiveFileId(newFile.id);
    emitFileCreate(newFile);
  };

  const switchFile = (fileId: string) => {
    setActiveFileId(fileId);
    emitFileSwitch(fileId);
  };

  const closeFile = (fileId: string) => {
    if (files.length <= 1) return;
    const idx = files.findIndex(f => f.id === fileId);
    setFiles(p => p.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      const newActive = files[idx > 0 ? idx - 1 : 1]?.id || files[0]?.id;
      setActiveFileId(newActive);
    }
    emitFileClose(fileId);
  };

  const startRenaming = (file: FileTab) => {
    setIsEditingFilename(true);
    setEditingName(file.filename);
  };

  const finishRenaming = (fileId: string) => {
    if (editingName.trim()) {
      setFiles(p => p.map(f => f.id === fileId ? { ...f, filename: editingName.trim() } : f));
      emitFileRename(fileId, editingName.trim());
    }
    setIsEditingFilename(false);
  };

  // Run code
  const handleRunCode = async () => {
    setOutput(''); setError(''); setExecutionStats({ time: null, memory: null });
    const result = await executeCode(code, activeFile?.language || language, stdin);
    setOutput(result.output); setError(result.error);
    setExecutionStats({ time: result.executionTime, memory: result.memoryUsed });
  };
  const handleClear = () => { setOutput(''); setError(''); setExecutionStats({ time: null, memory: null }); };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.href); } catch {
      const ta = document.createElement('textarea'); ta.value = window.location.href;
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setIsLinkCopied(true); setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const remoteCursorsArray = Array.from(remoteUsers.values());

  // Tab bar component
  const renderTabs = () => (
    <div className="flex items-center overflow-x-auto scrollbar-hide" style={{ borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer group min-w-0 transition-all duration-200 ${file.id === activeFileId ? 'shadow-sm' : ''}`}
          style={{
            backgroundColor: file.id === activeFileId ? (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') : 'transparent',
            borderBottom: file.id === activeFileId ? '2px solid #fbbf24' : '2px solid transparent',
          }}
          onClick={() => switchFile(file.id)}
          onDoubleClick={() => startRenaming(file)}
        >
          {isEditingFilename && file.id === activeFileId ? (
            <input
              type="text" value={editingName} autoFocus
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => finishRenaming(file.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') finishRenaming(file.id); if (e.key === 'Escape') setIsEditingFilename(false); }}
              className="bg-transparent text-xs font-mono outline-none w-20"
              style={{ color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs font-mono truncate max-w-[120px]" style={{ color: 'var(--foreground)', opacity: file.id === activeFileId ? 1 : 0.5 }}>
              {file.filename}
            </span>
          )}
          {files.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-0.5"
              style={{ color: 'var(--foreground)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {/* New file button */}
      <button onClick={createNewFile} className="p-1.5 mx-1 transition-opacity hover:opacity-70" style={{ color: 'var(--foreground)', opacity: 0.4 }} title="New file">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );

  // Editor panel
  const renderEditorPanel = (padding: string, iconSize: number) => (
    <div className={`h-full flex flex-col ${padding}`} style={{ backgroundColor: 'var(--background)' }}>
      <div className="flex items-center justify-between mb-2 lg:mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Editor</h2>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isConnected ? '#22c55e' : '#ef4444', boxShadow: isConnected ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)' }} />
          <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
            {onlineCount}
          </div>
          <div className="hidden md:flex items-center -space-x-1">
            {myInfo && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: myInfo.color }} title={`${myInfo.username} (you)`}>{myInfo.username.charAt(0)}</div>}
            {remoteCursorsArray.slice(0, 3).map(u => <div key={u.socketId} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: u.color }} title={u.username}>{u.username.charAt(0)}</div>)}
            {remoteCursorsArray.length > 3 && <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: theme === 'dark' ? '#333' : '#e5e7eb', color: 'var(--foreground)' }}>+{remoteCursorsArray.length - 3}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleCopyLink} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all duration-200 hover:opacity-80" style={{ backgroundColor: isLinkCopied ? (theme === 'dark' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)') : '#fbbf24', color: isLinkCopied ? '#22c55e' : '#000' }}>
            {isLinkCopied ? '✓ Copied' : '🔗 Invite'}
          </button>
          <button onClick={() => setIsChatCollapsed(!isChatCollapsed)} className="p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: 'var(--foreground)' }} aria-label="Chat">
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </button>
          <button onClick={handleRunCode} disabled={isLoading} className="p-2 transition-all duration-200 disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: 'var(--foreground)' }} aria-label="Run">
            {isLoading ? <span className="inline-flex"><span className="w-1 h-1 bg-current rounded-full animate-pulse" /><span className="w-1 h-1 bg-current rounded-full animate-pulse mx-0.5" style={{ animationDelay: '200ms' }} /><span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }} /></span>
            : <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110"><polygon points="5,3 19,12 5,21" /></svg>}
          </button>
        </div>
      </div>
      {/* File tabs */}
      {renderTabs()}
      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg" style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <CollaborativeEditor value={code} onChange={handleCodeChange} language={activeFile?.language || language} remoteCursors={remoteCursorsArray.map(u => ({ ...u, cursor: u.cursor ?? null }))} onCursorMove={emitCursorMove} />
      </div>
    </div>
  );

  const renderOutputPanel = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <div className="flex-1 min-h-0">
        <Output output={output} error={error} isLoading={isLoading} executionTime={executionStats.time} memoryUsed={executionStats.memory} stdin={stdin} onStdinChange={setStdin} code={code} onClear={handleClear} />
      </div>
    </div>
  );

  const chatProps = { messages: chatMessages, onSend: emitChatMessage, onReaction: emitChatReaction, onDelete: emitChatDelete, onTyping: emitChatTyping, currentUsername: myInfo?.username ?? '', currentSocketId: myInfo?.socketId, typingUsers, reactions: chatReactions, deletedMessages: deletedMsgIds };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
            <Image src="/exur.svg" alt="Exur" width={32} height={32} className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium tracking-wide" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-league-spartan), sans-serif' }}>Exur</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 xl:gap-6">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-mono" style={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: 'var(--foreground)' }}>
              <span style={{ opacity: 0.5 }}>Room</span>
              <span className="font-semibold">{roomId}</span>
            </div>
            <LanguageSelector language={language} onChange={handleLanguageChange} />
            <button onClick={toggleTheme} className="p-2 sm:p-2.5 lg:p-3 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center hover:opacity-70" style={{ color: 'var(--foreground)' }} aria-label="Toggle theme">
              {theme === 'light' ? <svg width="16" height="16" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              : <svg width="16" height="16" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-100px)] sm:h-[calc(100vh-108px)] lg:h-[calc(100vh-120px)]">
        {/* Desktop */}
        <div className="h-full hidden lg:block">
          <ResizablePanels defaultLeftWidth={75} minLeftWidth={50} maxLeftWidth={85}
            leftPanel={
              <ResizablePanelsVertical defaultTopHeight={70} minTopHeight={40} maxTopHeight={85}
                topPanel={<div className="h-full">{renderEditorPanel('p-3 lg:p-6', 18)}</div>}
                bottomPanel={<div className="h-full p-3 lg:p-4">{renderOutputPanel()}</div>}
              />
            }
            rightPanel={
              <div className="h-full overflow-hidden pr-3">
                <ChatPanel {...chatProps} isCollapsed={false} onToggleCollapse={() => {}} />
              </div>
            }
          />
        </div>
        {/* Mobile */}
        <div className="h-full lg:hidden flex flex-col">
          <div className="flex-1 min-h-0">{renderEditorPanel('p-3', 16)}</div>
          <div className="h-[150px] flex-shrink-0" style={{ borderTop: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
            <div className="h-full p-3">{renderOutputPanel()}</div>
          </div>
        </div>
      </div>

      {/* Mobile chat overlay */}
      {!isChatCollapsed && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsChatCollapsed(true)} />
          <div className="relative mt-auto h-[60vh] rounded-t-2xl overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
            <ChatPanel {...chatProps} isCollapsed={false} onToggleCollapse={() => setIsChatCollapsed(true)} />
          </div>
        </div>
      )}

      <InfoOverlay />
    </div>
  );
}
