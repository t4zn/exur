/**
 * CollaborativeEditor — Monaco editor wired for real-time collaboration
 *
 * Responsibilities:
 *   1. Render the Monaco editor with the shared room code
 *   2. Emit code-change events on local edits (with echo-loop prevention)
 *   3. Apply remote code updates without breaking local cursor position
 *   4. Render remote user cursors as Monaco decorations
 *   5. Emit debounced cursor-move events on local cursor movement
 */

'use client';

import { Editor } from '@monaco-editor/react';
import { useTheme } from './ThemeProvider';
import { useEffect, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { SparkIcon } from './SparkIcon';

// ── Types ─────────────────────────────────────────────────────────────

interface RemoteCursor {
  socketId: string;
  username: string;
  color: string;
  cursor: { lineNumber: number; column: number } | null;
}

interface CollaborativeEditorProps {
  /** Current code value (controlled) */
  value: string;
  /** Fires when the LOCAL user edits code */
  onChange: (value: string | undefined) => void;
  /** Monaco language id */
  language: string;
  /** Remote users' cursor data */
  remoteCursors: RemoteCursor[];
  /** Called on local cursor movement (debounced internally) */
  onCursorMove?: (cursor: { lineNumber: number; column: number }) => void;
  /** AI fix: suggested code to show in diff mode */
  suggestedCode?: string;
  /** AI fix: whether to show diff overlay */
  showDiff?: boolean;
  /** AI fix: called when user accepts the diff */
  onApplyDiff?: () => void;
  /** AI fix: called when user rejects the diff */
  onRejectDiff?: () => void;
}

// ── Language map (mirrors your existing Editor.tsx) ───────────────────
const languageMap: Record<string, string> = {
  'assembly': 'asm', 'bash': 'shell', 'basic': 'vb', 'c': 'c',
  'cpp': 'cpp', 'csharp': 'csharp', 'clojure': 'clojure', 'cobol': 'cobol',
  'd': 'd', 'elixir': 'elixir', 'erlang': 'erlang', 'fortran': 'fortran',
  'go': 'go', 'haskell': 'haskell', 'java': 'java', 'javascript': 'javascript',
  'kotlin': 'kotlin', 'lisp': 'lisp', 'lua': 'lua', 'objective_c': 'objective-c',
  'ocaml': 'ocaml', 'octave': 'matlab', 'pascal': 'pascal', 'perl': 'perl',
  'php': 'php', 'prolog': 'prolog', 'python': 'python', 'r': 'r',
  'ruby': 'ruby', 'rust': 'rust', 'scala': 'scala', 'sql': 'sql',
  'swift': 'swift', 'typescript': 'typescript', 'visual_basic': 'vb',
  'sanskrit': 'python',
};

// ── Component ─────────────────────────────────────────────────────────

export default function CollaborativeEditor({
  value,
  onChange,
  language,
  remoteCursors,
  onCursorMove,
  suggestedCode,
  showDiff,
  onApplyDiff,
  onRejectDiff,
}: CollaborativeEditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

  // Track decoration IDs for remote cursors so we can update them
  const cursorDecorationIds = useRef<string[]>([]);
  // Track decoration IDs for diff highlights
  const diffDecorationIds = useRef<string[]>([]);

  // Flag: when true, the next onChange is from a remote update → skip emit
  const isRemoteUpdate = useRef(false);

  // Debounce timer for cursor movement
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resolve Monaco language ────────────────────────────────────────
  const getMonacoLanguage = (lang: string) => languageMap[lang] || 'python';

  // ── Render remote cursors as decorations ───────────────────────────
  const renderRemoteCursors = useCallback(() => {
    const ed = editorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;

    const decorations: editor.IModelDeltaDecoration[] = [];
    const validCursors = remoteCursors.filter(
      (r) => r.cursor && r.socketId && r.username && r.color
    );

    for (const remote of validCursors) {
      const { lineNumber, column } = remote.cursor!;
      const safeId = remote.socketId.replace(/[^a-zA-Z0-9]/g, '');

      // Cursor line decoration — a thin coloured bar (unique class per user)
      decorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column + 1),
        options: {
          className: `remote-cursor-${safeId}`,
          beforeContentClassName: `remote-cursor-bar-${safeId}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Username label above the cursor
      decorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: {
          after: {
            content: ` ${remote.username}`,
            inlineClassName: `remote-cursor-label-${safeId}`,
          },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });
    }

    cursorDecorationIds.current = ed.deltaDecorations(
      cursorDecorationIds.current,
      decorations,
    );

    // Inject dynamic CSS — one block PER user with unique class names
    let styleEl = document.getElementById('remote-cursor-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'remote-cursor-styles';
      document.head.appendChild(styleEl);
    }

    const css = validCursors
      .map((r) => {
        const safeId = r.socketId.replace(/[^a-zA-Z0-9]/g, '');
        return `
        .remote-cursor-bar-${safeId} {
          border-left: 2px solid ${r.color} !important;
          margin-left: -1px;
        }
        .remote-cursor-label-${safeId} {
          background: ${r.color};
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 3px;
          margin-left: 4px;
          pointer-events: none;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          position: relative;
          top: -2px;
          opacity: 0.9;
        }
      `;
      })
      .join('\n');

    styleEl.textContent = css;
  }, [remoteCursors]);

  // Re-render cursors whenever they change
  useEffect(() => {
    renderRemoteCursors();
  }, [renderRemoteCursors]);

  // ── Handle remote code updates ─────────────────────────────────────
  // When the parent sets a new `value` from a remote source, we need
  // to update the editor model without triggering our own onChange.
  // The parent component sets `isRemoteUpdate` before changing value.

  // ── Editor mount ───────────────────────────────────────────────────
  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: typeof import('monaco-editor'),
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monacoInstance;

    // ── Listen for cursor position changes ──────────────────────
    editorInstance.onDidChangeCursorPosition((e) => {
      if (!onCursorMove) return;

      // Debounce: emit at most every 50ms
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => {
        onCursorMove({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      }, 50);
    });

    // Initial cursor render
    renderRemoteCursors();
  };

  // ── Wrapped onChange — prevents echo loops ─────────────────────────
  const handleChange = (newValue: string | undefined) => {
    // If this change came from applying a remote update, skip emitting
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    onChange(newValue);
  };

  // ── Diff decorations (purple highlighted lines) ────────────────────
  const applyDiffDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !showDiff || !suggestedCode || !value) {
      if (editorRef.current && diffDecorationIds.current.length > 0) {
        diffDecorationIds.current = editorRef.current.deltaDecorations(diffDecorationIds.current, []);
      }
      return;
    }

    const originalLines = value.split('\n');
    const suggestedLines = suggestedCode.split('\n');
    const decorations: editor.IModelDeltaDecoration[] = [];

    for (let i = 0; i < suggestedLines.length; i++) {
      if (originalLines[i] !== suggestedLines[i]) {
        decorations.push({
          range: new monacoRef.current!.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            className: 'diff-added-line',
            overviewRuler: {
              color: '#8141e6',
              position: monacoRef.current!.editor.OverviewRulerLane.Left
            },
          },
        });
        decorations.push({
          range: new monacoRef.current!.Range(i + 1, 1, i + 1, suggestedLines[i].length + 1),
          options: {
            inlineClassName: 'diff-inline-added',
            stickiness: monacoRef.current!.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    }

    diffDecorationIds.current = editorRef.current.deltaDecorations(diffDecorationIds.current, decorations);
  }, [showDiff, suggestedCode, value]);

  useEffect(() => { applyDiffDecorations(); }, [applyDiffDecorations]);
  useEffect(() => {
    return () => {
      if (editorRef.current && diffDecorationIds.current.length > 0) {
        diffDecorationIds.current = editorRef.current.deltaDecorations(diffDecorationIds.current, []);
      }
    };
  }, [showDiff]);


  // Determine displayed value: show suggested code during diff, otherwise current code
  const displayValue = showDiff && suggestedCode ? suggestedCode : value;

  return (
    <div
      className="h-full overflow-hidden relative collaborative-editor"
      data-editor-id="collab"
    >
      {/* AI diff accept/reject — same style as main page */}
      {showDiff && suggestedCode && (
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          <button
            onClick={onApplyDiff}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md font-medium transition-colors shadow-sm"
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#8141e6', 
              border: '1px solid #e5e7eb',
              fontFamily: 'var(--font-poppins), Poppins, sans-serif'
            }}
            title="Apply changes"
          >
            <SparkIcon size={12} color="#8141e6" />
            Apply
          </button>
          <button
            onClick={onRejectDiff}
            className="flex items-center justify-center p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Reject changes"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={displayValue}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          fontFamily: 'var(--font-geist-mono), monospace',
          lineHeight: 1.6,
          padding: { top: 20, bottom: 20 },
          renderLineHighlight: 'none',
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          readOnly: showDiff, // Lock editor during diff review
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          wordBasedSuggestions: 'allDocuments',
          matchBrackets: 'always',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          formatOnPaste: true,
          formatOnType: true,
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',
        }}
      />
    </div>
  );
}
