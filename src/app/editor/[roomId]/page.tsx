'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
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
  assembly: { 
    code: `section .data
    hello db 'Hello, World!', 10, 0
    hello_len equ $ - hello
    
section .text
    global _start
    
_start:
    ; Print hello
    mov eax, 4
    mov ebx, 1
    mov ecx, hello
    mov edx, hello_len
    int 0x80
    
    ; Exit
    mov eax, 1
    mov ebx, 0
    int 0x80`, 
    filename: 'main.asm' 
  },
  bash: { code: `#!/bin/bash\necho "Hello, World!"\necho "Welcome to Exur!"`, filename: 'script.sh' },
  basic: { code: `print "Hello, World!"\nprint "Welcome to Exur!"`, filename: 'main.bas' },
  c: { code: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    printf("Welcome to Exur!\\n");\n    return 0;\n}`, filename: 'main.c' },
  cpp: { code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    cout << "Welcome to Exur!" << endl;\n    return 0;\n}`, filename: 'main.cpp' },
  csharp: { code: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n        Console.WriteLine("Welcome to Exur!");\n    }\n}`, filename: 'Program.cs' },
  clojure: { code: `(println "Hello, World!")\n(println "Welcome to Exur!")`, filename: 'main.clj' },
  cobol: { code: `       IDENTIFICATION DIVISION.\n       PROGRAM-ID. HELLO.\n       \n       PROCEDURE DIVISION.\n       DISPLAY "Hello, World!".\n       DISPLAY "Welcome to Exur!".\n       STOP RUN.\n`, filename: 'main.cob' },
  d: { code: `import std.stdio;\n\nvoid main() {\n    writeln("Hello, World!");\n    writeln("Welcome to Exur!");\n}`, filename: 'main.d' },
  elixir: { code: `IO.puts("Hello, World!")\nIO.puts("Welcome to Exur!")`, filename: 'main.ex' },
  erlang: { code: `-module(main).\n-export([start/0]).\n\nstart() ->\n    io:format("Hello, World!~n"),\n    io:format("Welcome to Exur!~n").`, filename: 'main.erl' },
  fortran: { code: `program hello\n    print *, 'Hello, World!'\n    print *, 'Welcome to Exur!'\nend program hello`, filename: 'main.f90' },
  go: { code: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n    fmt.Println("Welcome to Exur!")\n}`, filename: 'main.go' },
  haskell: { code: `main = do\n    putStrLn "Hello, World!"\n    putStrLn "Welcome to Exur!"`, filename: 'main.hs' },
  java: { code: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        System.out.println("Welcome to Exur!");\n    }\n}`, filename: 'Main.java' },
  javascript: { code: `console.log("Hello, World!");\nconsole.log("Welcome to Exur!");`, filename: 'script.js' },
  kotlin: { code: `fun main() {\n    println("Hello, World!")\n    println("Welcome to Exur!")\n}`, filename: 'Main.kt' },
  lisp: { code: `(write-line "Hello, World!")\n(write-line "Welcome to Exur!")`, filename: 'main.lisp' },
  lua: { code: `print("Hello, World!")\nprint("Welcome to Exur!")`, filename: 'main.lua' },
  objective_c: { code: `#import <Foundation/Foundation.h>\n\nint main() {\n    @autoreleasepool {\n        NSLog(@"Hello, World!");\n        NSLog(@"Welcome to Exur!");\n    }\n    return 0;\n}`, filename: 'main.m' },
  ocaml: { code: `print_endline "Hello, World!";;\nprint_endline "Welcome to Exur!";;`, filename: 'main.ml' },
  octave: { code: `disp('Hello, World!')\ndisp('Welcome to Exur!')`, filename: 'main.m' },
  pascal: { code: `program Hello;\nbegin\n    writeln('Hello, World!');\n    writeln('Welcome to Exur!');\nend.`, filename: 'main.pas' },
  perl: { code: `print "Hello, World!\\n";\nprint "Welcome to Exur!\\n";`, filename: 'script.pl' },
  php: { code: `<?php\necho "Hello, World!\\n";\necho "Welcome to Exur!\\n";\n?>`, filename: 'index.php' },
  prolog: { code: `:- initialization(main).\n\nmain :-\n    write('Hello, World!'), nl,\n    write('Welcome to Exur!'), nl,\n    halt.`, filename: 'main.pl' },
  python: { code: `print("Hello, World!")\nprint("Welcome to Exur!")`, filename: 'main.py' },
  r: { code: `cat("Hello, World!\\n")\ncat("Welcome to Exur!\\n")`, filename: 'script.r' },
  ruby: { code: `puts "Hello, World!"\nputs "Welcome to Exur!"`, filename: 'main.rb' },
  rust: { code: `fn main() {\n    println!("Hello, World!");\n    println!("Welcome to Exur!");\n}`, filename: 'main.rs' },
  scala: { code: `object Main {\n    def main(args: Array[String]): Unit = {\n        println("Hello, World!")\n        println("Welcome to Exur!")\n    }\n}`, filename: 'Main.scala' },
  sql: { code: `SELECT 'Hello, World!' AS greeting;\nSELECT 'Welcome to Exur!' AS message;`, filename: 'query.sql' },
  swift: { code: `print("Hello, World!")\nprint("Welcome to Exur!")`, filename: 'main.swift' },
  typescript: { code: `console.log("Hello, World!");\nconsole.log("Welcome to Exur!");`, filename: 'script.ts' },
  visual_basic: { code: `Imports System\n\nModule Program\n    Sub Main()\n        Console.WriteLine("Hello, World!")\n        Console.WriteLine("Welcome to Exur!")\n    End Sub\nEnd Module`, filename: 'Main.vb' },
};

export default function CollaborativeEditorPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // State
  const [files, setFiles] = useState<FileTab[]>([{ 
    id: '1', 
    filename: defaultCodes.python.filename, 
    language: 'python', 
    code: defaultCodes.python.code 
  }]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [language, setLanguage] = useState('python');
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
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const isRemoteUpdateRef = useRef(false);

  const { executeCode, isLoading } = useJudge0();

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const code = activeFile?.code || '';

  // Reset remote update flag after render
  useEffect(() => {
    if (isRemoteUpdateRef.current) {
      // Use a small timeout to ensure the editor has processed the change
      const timer = setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [code]);

  // Socket callbacks
  const handleRoomState = useCallback((state: RoomState) => {
    isRemoteUpdateRef.current = true;
    if (state.files?.length) {
      setFiles(state.files);
      setActiveFileId(state.activeFileId || state.files[0].id);
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
    const targetFileId = fileId || activeFileId;
    setFiles(prev => prev.map(f => {
      if (f.id === targetFileId) {
        isRemoteUpdateRef.current = true;
        return { ...f, code: newCode };
      }
      return f;
    }));
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
    // Only add the file if it doesn't already exist (avoid duplicates from own actions)
    setFiles(p => {
      if (p.find(f => f.id === d.file.id)) {
        return p; // File already exists, don't add it again
      }
      return [...p, d.file];
    });
    setActiveFileId(d.file.id);
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
    // Skip if this is a remote update
    if (isRemoteUpdateRef.current) {
      return;
    }
    setFiles(p => p.map(f => f.id === activeFileId ? { ...f, code: val } : f));
    saveToLocal(roomId, val);
    emitCodeChange(val, activeFileId);
  }, [roomId, emitCodeChange, activeFileId]);

  // Language change
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const d = defaultCodes[lang] || { code: '// Write your code here', filename: 'main.txt' };
    const newFile: FileTab = { id: uuidv4(), filename: d.filename, language: lang, code: d.code };
    setFiles(p => [...p, newFile]);
    setActiveFileId(newFile.id);
    emitFileCreate(newFile);
    emitLanguageChange(lang);
  };

  // File tab operations
  const createNewFile = () => {
    const d = defaultCodes[language] || { code: '', filename: 'untitled.txt' };
    const newFile: FileTab = { id: uuidv4(), filename: d.filename, language, code: d.code };
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

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2500);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile?.filename || 'code.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const remoteCursorsArray = Array.from(remoteUsers.values());

  // Tab bar component
  const renderTabs = () => (
    <div className="flex items-center overflow-x-auto scrollbar-hide">
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer group min-w-0 rounded-t-md transition-all duration-200 ${file.id === activeFileId ? 'shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          style={{
            backgroundColor: file.id === activeFileId && theme === 'dark' ? '#1e1e1e' : 'transparent',
            boxShadow: file.id === activeFileId ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' : 'none'
          }}
          onClick={() => switchFile(file.id)}
        >
          {/* File Icon */}
          <div className="flex-shrink-0">
            <i className={`devicon-${file.language}-plain`} style={{ fontSize: '14px', color: file.id === activeFileId ? '#8141e6' : 'currentColor' }}></i>
          </div>

          {/* Filename */}
          {isEditingFilename && file.id === activeFileId ? (
            <input
              type="text" 
              value={editingName} 
              autoFocus
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => finishRenaming(file.id)}
              onKeyDown={(e) => { 
                if (e.key === 'Enter') finishRenaming(file.id); 
                if (e.key === 'Escape') setIsEditingFilename(false); 
              }}
              className="bg-transparent text-xs font-medium outline-none min-w-0"
              style={{ color: 'var(--foreground)' }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <span 
              className="text-xs font-medium truncate min-w-0" 
              style={{ color: 'var(--foreground)' }}
              onDoubleClick={() => file.id === activeFileId && startRenaming(file)}
            >
              {file.filename}
            </span>
          )}

          {/* Edit Button - Only show for active file on hover */}
          {file.id === activeFileId && (
            <button
              onClick={(e) => { e.stopPropagation(); startRenaming(file); }}
              className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity p-1"
              style={{ color: 'var(--foreground)' }}
              title="Edit filename"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m13.5 3.5-11 11V19h4.5l11-11a1.5 1.5 0 0 0 0-2.12l-2.38-2.38a1.5 1.5 0 0 0-2.12 0Z" />
                <path d="m13.5 6.5 3 3" />
              </svg>
            </button>
          )}

          {/* Close Button */}
          {files.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
              className={`flex-shrink-0 transition-opacity p-1 ${file.id === activeFileId ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'}`}
              style={{ color: 'var(--foreground)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      ))}
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
            {myInfo && <div key={myInfo.socketId} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: myInfo.color }} title={`${myInfo.username} (you)`}>{myInfo.username.charAt(0)}</div>}
            {remoteCursorsArray.slice(0, 3).map(u => <div key={u.socketId} className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: u.color }} title={u.username}>{u.username.charAt(0)}</div>)}
            {remoteCursorsArray.length > 3 && <div key="more-users" className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: theme === 'dark' ? '#333' : '#e5e7eb', color: 'var(--foreground)' }}>+{remoteCursorsArray.length - 3}</div>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={createNewFile} className="p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: '#8141e6' }} aria-label="New file" title="New file">
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button onClick={handleCopyLink} className="p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: isLinkCopied ? '#22c55e' : '#8141e6' }} aria-label="Copy invite link">
            {isLinkCopied ? (
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#22c55e' }}>
                <polyline points="20,6 9,17 4,12" />
              </svg>
            ) : (
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </button>
          <button onClick={handleCopyCode} className="p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: '#8141e6' }} aria-label="Copy code">
            <div className="relative transition-all duration-300 ease-in-out">
              {isCodeCopied ? (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-bounce-in" style={{ color: '#fbbf24' }}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </div>
          </button>
          <button onClick={handleDownloadCode} className="p-2 transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: '#8141e6' }} aria-label="Download code">
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button onClick={handleRunCode} disabled={isLoading} className="p-2 transition-all duration-200 disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center hover:opacity-70" style={{ color: '#8141e6' }} aria-label="Run">
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
            <Image src="/logo.svg" alt="Exur" width={120} height={40} className="h-6 sm:h-7 lg:h-9 xl:h-10 w-auto" />
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
          <ResizablePanels defaultLeftWidth={70} minLeftWidth={50} maxLeftWidth={85}
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

      {/* Footer */}
      <footer className="text-center py-4 text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
        © 2026 <a href="https://t4z.in" target="_blank" rel="noopener noreferrer" className="font-medium hover:opacity-80 transition-opacity">Taizun</a>. All rights reserved.
      </footer>

      <InfoOverlay />
    </div>
  );
}
