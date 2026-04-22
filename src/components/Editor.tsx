'use client';

import { Editor } from '@monaco-editor/react';
import { useTheme } from './ThemeProvider';
import { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { SparkIcon } from './SparkIcon';
import CustomLanguageService from '../services/customLanguageService';

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  suggestedCode?: string;
  showDiff?: boolean;
  onApplyDiff?: () => void;
  onRejectDiff?: () => void;
}

const languageMap: Record<string, string> = {
  'assembly': 'asm',
  'bash': 'shell',
  'basic': 'vb',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'clojure': 'clojure',
  'cobol': 'cobol',
  'd': 'd',
  'elixir': 'elixir',
  'erlang': 'erlang',
  'fortran': 'fortran',
  'go': 'go',
  'haskell': 'haskell',
  'java': 'java',
  'javascript': 'javascript',
  'kotlin': 'kotlin',
  'lisp': 'lisp',
  'lua': 'lua',
  'objective_c': 'objective-c',
  'ocaml': 'ocaml',
  'octave': 'matlab',
  'pascal': 'pascal',
  'perl': 'perl',
  'php': 'php',
  'prolog': 'prolog',
  'python': 'python',
  'r': 'r',
  'ruby': 'ruby',
  'rust': 'rust',
  'scala': 'scala',
  'sql': 'sql',
  'swift': 'swift',
  'typescript': 'typescript',
  'visual_basic': 'vb',
  'sanskrit': 'sanskrit'
};

export default function CodeEditor({ 
  value, 
  onChange, 
  language, 
  suggestedCode, 
  showDiff, 
  onApplyDiff, 
  onRejectDiff 
}: EditorProps) {
  const { theme } = useTheme();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  const decorationIds = useRef<string[]>([]);


  // Determine the Monaco language to use
  const getMonacoLanguage = (lang: string) => {
    if (CustomLanguageService.isCustomLanguage(lang)) {
      return 'python'; // Custom languages use Python syntax highlighting
    }
    return languageMap[lang] || 'python';
  };

  // Register custom language highlighting
  const registerCustomLanguageHighlighting = useCallback((monaco: typeof import('monaco-editor')) => {
    if (!CustomLanguageService.isCustomLanguage(language)) return;

    const customLang = CustomLanguageService.getCustomLanguage(language);
    if (!customLang) return;

    const customKeywords = Object.keys(customLang.keywords);
    if (customKeywords.length === 0) return;

    // Create a unique language ID for this custom language
    const customLanguageId = `custom-${language}`;

    // Register the custom language if not already registered
    const languages = monaco.languages.getLanguages();
    if (!languages.find(lang => lang.id === customLanguageId)) {
      monaco.languages.register({ id: customLanguageId });
    }

    // Create tokenizer rules for custom keywords
    const keywordRules: [RegExp, string][] = customKeywords.map(keyword => [
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
      'keyword'
    ]);

    // Set up the tokenizer with Python base + custom keywords
    monaco.languages.setMonarchTokensProvider(customLanguageId, {
      keywords: customKeywords,
      tokenizer: {
        root: [
          // Custom keywords first (higher priority)
          ...keywordRules,
          // Python keywords
          [/\b(and|as|assert|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|not|or|pass|print|raise|return|try|while|with|yield|True|False|None)\b/, 'keyword'],
          // Strings
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'/, 'string', '@string_single'],
          // Comments
          [/#.*$/, 'comment'],
          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          // Operators
          [/[+\-*\/=<>!&|^~%]/, 'operator'],
          // Delimiters
          [/[{}()\[\]]/, 'delimiter.bracket'],
          [/[;,.]/, 'delimiter'],
          // Identifiers
          [/[a-zA-Z_]\w*/, 'identifier']
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Set up language configuration for better editing experience
    monaco.languages.setLanguageConfiguration(customLanguageId, {
      comments: {
        lineComment: '#',
        blockComment: ['"""', '"""']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string', 'comment'] }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      onEnterRules: [
        {
          // Auto-indent after semicolon
          beforeText: /.*;$/,
          action: { indentAction: monaco.languages.IndentAction.None, appendText: '\n' }
        },
        {
          // Auto-indent after colon (for if, for, def, etc.)
          beforeText: /.*:$/,
          action: { indentAction: monaco.languages.IndentAction.Indent }
        }
      ]
    });

    // Apply the custom language to the current model
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, customLanguageId);
      }
    }
  }, [language]);

  const applyDiffDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current || !showDiff || !suggestedCode || !value) {
      // Clear decorations if no diff to show
      if (editorRef.current && decorationIds.current.length > 0) {
        decorationIds.current = editorRef.current.deltaDecorations(decorationIds.current, []);
      }
      return;
    }

    const originalLines = value.split('\n');
    const suggestedLines = suggestedCode.split('\n');
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    
    // Since we're showing the suggested code in the editor, we highlight the changes
    // We'll use green for lines that were changed/added
    for (let i = 0; i < suggestedLines.length; i++) {
      const originalLine = originalLines[i];
      const suggestedLine = suggestedLines[i];
      
      if (originalLine !== suggestedLine) {
        // Line was changed, added, or modified
        decorations.push({
          range: new monacoRef.current.Range(i + 1, 1, i + 1, 1),
          options: {
            isWholeLine: true,
            className: 'diff-added-line',
            overviewRuler: {
              color: '#22c55e',
              position: monacoRef.current.editor.OverviewRulerLane.Left
            },
            minimap: {
              color: '#22c55e',
              position: monacoRef.current.editor.MinimapPosition.Inline
            }
          }
        });
        
        // Add a subtle glow effect for better visibility
        decorations.push({
          range: new monacoRef.current.Range(i + 1, 1, i + 1, suggestedLine.length + 1),
          options: {
            inlineClassName: 'diff-inline-added',
            stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
          }
        });
      }
    }
    
    decorationIds.current = editorRef.current.deltaDecorations(decorationIds.current, decorations);
  }, [showDiff, suggestedCode, value]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    applyDiffDecorations();
    registerCustomLanguageHighlighting(monacoInstance);
  };

  // Clear undo history when language changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // Clear the entire undo/redo stack when language changes
        const currentValue = model.getValue();
        model.setValue('');
        model.setValue(currentValue);
        // This effectively clears the undo history by creating a new baseline
      }
    }
  }, [language]);

  useEffect(() => {
    applyDiffDecorations();
  }, [showDiff, suggestedCode, value, applyDiffDecorations]);

  useEffect(() => {
    if (monacoRef.current) {
      registerCustomLanguageHighlighting(monacoRef.current);
    }
  }, [registerCustomLanguageHighlighting]);

  // Clear decorations when component unmounts or diff is hidden
  useEffect(() => {
    return () => {
      if (editorRef.current && decorationIds.current.length > 0) {
        decorationIds.current = editorRef.current.deltaDecorations(decorationIds.current, []);
      }
    };
  }, [showDiff]);

  return (
    <div className="h-full overflow-hidden relative">
      {showDiff && suggestedCode && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={onApplyDiff}
            className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md font-medium transition-colors shadow-sm"
            style={{ 
              backgroundColor: theme === 'dark' ? '#000000' : '#ffffff', 
              color: theme === 'dark' ? '#ffffff' : '#000000', 
              border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb' 
            }}
            title="Apply changes"
          >
            <SparkIcon size={12} />
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
        language={CustomLanguageService.isCustomLanguage(language) ? `custom-${language}` : getMonacoLanguage(language)}
        value={showDiff && suggestedCode ? suggestedCode : value}
        onChange={onChange}
        onMount={(editor, monaco) => {
          handleEditorDidMount(editor, monaco);
          
          // Ensure all features are enabled after mount
          editor.updateOptions({
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on'
          });

          // Add keyboard shortcuts for common actions
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
          });

          // Force suggestions to show on Ctrl+Space
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Space, () => {
            editor.trigger('keyboard', 'editor.action.triggerParameterHints', {});
          });

          // Add semicolon auto-formatting for custom languages
          editor.onKeyDown((e) => {
            if (e.keyCode === monaco.KeyCode.Semicolon && CustomLanguageService.isCustomLanguage(language)) {
              // Let the semicolon be typed first
              setTimeout(() => {
                const position = editor.getPosition();
                if (position) {
                  const model = editor.getModel();
                  if (model) {
                    const lineContent = model.getLineContent(position.lineNumber);
                    // If line ends with semicolon and cursor is at the end
                    if (lineContent.trim().endsWith(';') && position.column === lineContent.length + 1) {
                      editor.trigger('keyboard', 'type', { text: '\n' });
                    }
                  }
                }
              }, 0);
            }
          });
        }}
        theme={
          language === 'sanskrit' 
            ? (theme === 'dark' ? 'sanskrit-theme-dark' : 'sanskrit-theme-light')
            : (theme === 'dark' ? 'vs-dark' : 'vs-light')
        }
        options={{
          // Basic editor options
          minimap: { enabled: false },
          fontSize: 15,
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
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },

          // Enhanced IntelliSense and autocompletion
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          wordBasedSuggestions: 'allDocuments',
          parameterHints: {
            enabled: true,
            cycle: true
          },

          // Code completion and snippets
          snippetSuggestions: 'top',
          tabCompletion: 'on',
          suggest: {
            insertMode: 'replace',
            filterGraceful: true,
            showKeywords: true,
            showSnippets: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true
          },

          // Error detection and validation (handled by language services)

          // Bracket matching and auto-closing
          matchBrackets: 'always',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoSurround: 'languageDefined',

          // Code formatting
          formatOnPaste: true,
          formatOnType: true,

          // Hover information
          hover: {
            enabled: true,
            delay: 300,
            sticky: true
          },

          // Code lens
          codeLens: true,

          // Folding
          folding: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',

          // Find and replace
          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: 'never',
            seedSearchStringFromSelection: 'always'
          }
        }}
        beforeMount={(monaco) => {
          // Register Sanskrit language
          monaco.languages.register({ id: 'sanskrit' });

          // Define Sanskrit syntax highlighting
          monaco.languages.setMonarchTokensProvider('sanskrit', {
            tokenizer: {
              root: [
                // Sanskrit function 'वद' in blue
                [/वद/, 'keyword'],
                // String literals in red (content inside quotes)
                [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
                [/"/, 'string', '@string'],
                // Parentheses and semicolons
                [/[()]/, 'delimiter.parenthesis'],
                [/;/, 'delimiter.semicolon'],
              ],
              string: [
                [/[^\\"]+/, 'string'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop']
              ]
            }
          });

          // Define Sanskrit theme colors (using Python's colors)
          monaco.editor.defineTheme('sanskrit-theme-light', {
            base: 'vs',
            inherit: true,
            rules: [
              { token: 'keyword', foreground: '0000ff' }, // Python blue for वद
              { token: 'string', foreground: 'a31515' }, // Python red for strings
              { token: 'delimiter.parenthesis', foreground: '000000' },
              { token: 'delimiter.semicolon', foreground: '000000' }
            ],
            colors: {}
          });

          monaco.editor.defineTheme('sanskrit-theme-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'keyword', foreground: '569cd6' }, // Python light blue for वद
              { token: 'string', foreground: 'ce9178' }, // Python light red for strings
              { token: 'delimiter.parenthesis', foreground: 'ffffff' },
              { token: 'delimiter.semicolon', foreground: 'ffffff' }
            ],
            colors: {}
          });

          // Configure TypeScript/JavaScript language features
          monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
          monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false
          });

          monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
          monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            noSuggestionDiagnostics: false
          });

          // Configure compiler options for better IntelliSense
          monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
          });

          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
          });

          // Enable Emmet for HTML, CSS, and related languages
          monaco.languages.registerCompletionItemProvider('html', {
            provideCompletionItems: (model, position) => {
              const word = model.getWordUntilPosition(position);
              const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
              };

              return {
                suggestions: [
                  {
                    label: 'div',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: '<div>$1</div>',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'HTML div element',
                    range: range
                  },
                  {
                    label: 'p',
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: '<p>$1</p>',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    documentation: 'HTML paragraph element',
                    range: range
                  }
                ]
              };
            }
          });

          // Add custom snippets for popular languages
          const addLanguageSnippets = (languageId: string, snippets: Omit<monaco.languages.CompletionItem, 'range' | 'kind'>[]) => {
            monaco.languages.registerCompletionItemProvider(languageId, {
              provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn
                };

                return {
                  suggestions: snippets.map(snippet => ({
                    ...snippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                  }))
                };
              }
            });
          };

          // Python snippets
          addLanguageSnippets('python', [
            {
              label: 'for',
              insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
              documentation: 'For loop',
              detail: 'Python for loop'
            },
            {
              label: 'if',
              insertText: 'if ${1:condition}:\n    ${2:pass}',
              documentation: 'If statement',
              detail: 'Python if statement'
            },
            {
              label: 'def',
              insertText: 'def ${1:function_name}(${2:parameters}):\n    ${3:pass}',
              documentation: 'Function definition',
              detail: 'Python function'
            },
            {
              label: 'class',
              insertText: 'class ${1:ClassName}:\n    def __init__(self${2:, parameters}):\n        ${3:pass}',
              documentation: 'Class definition',
              detail: 'Python class'
            },
            {
              label: 'try',
              insertText: 'try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}',
              documentation: 'Try-except block',
              detail: 'Python exception handling'
            },
            {
              label: 'while',
              insertText: 'while ${1:condition}:\n    ${2:pass}',
              documentation: 'While loop',
              detail: 'Python while loop'
            },
            {
              label: 'with',
              insertText: 'with ${1:expression} as ${2:variable}:\n    ${3:pass}',
              documentation: 'With statement',
              detail: 'Python context manager'
            }
          ]);

          // JavaScript/TypeScript snippets
          ['javascript', 'typescript'].forEach(lang => {
            addLanguageSnippets(lang, [
              {
                label: 'function',
                insertText: 'function ${1:functionName}(${2:parameters}) {\n    ${3:// code}\n}',
                documentation: 'Function declaration'
              },
              {
                label: 'arrow',
                insertText: 'const ${1:functionName} = (${2:parameters}) => {\n    ${3:// code}\n};',
                documentation: 'Arrow function'
              },
              {
                label: 'for',
                insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n    ${3:// code}\n}',
                documentation: 'For loop'
              },
              {
                label: 'if',
                insertText: 'if (${1:condition}) {\n    ${2:// code}\n}',
                documentation: 'If statement'
              }
            ]);
          });

          // Java snippets
          addLanguageSnippets('java', [
            {
              label: 'main',
              insertText: 'public static void main(String[] args) {\n    ${1:// code}\n}',
              documentation: 'Main method'
            },
            {
              label: 'for',
              insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n    ${3:// code}\n}',
              documentation: 'For loop'
            },
            {
              label: 'if',
              insertText: 'if (${1:condition}) {\n    ${2:// code}\n}',
              documentation: 'If statement'
            }
          ]);

          // C/C++ snippets
          ['c', 'cpp'].forEach(lang => {
            addLanguageSnippets(lang, [
              {
                label: 'main',
                insertText: 'int main() {\n    ${1:// code}\n    return 0;\n}',
                documentation: 'Main function',
                detail: 'C/C++ main function'
              },
              {
                label: 'for',
                insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}',
                documentation: 'For loop',
                detail: 'C/C++ for loop'
              },
              {
                label: 'if',
                insertText: 'if (${1:condition}) {\n    ${2:// code}\n}',
                documentation: 'If statement',
                detail: 'C/C++ if statement'
              },
              {
                label: 'include',
                insertText: '#include <${1:stdio.h}>',
                documentation: 'Include header',
                detail: 'C/C++ include directive'
              }
            ]);
          });

          // Add more aggressive suggestion triggers
          monaco.languages.setLanguageConfiguration('python', {
            wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
            comments: {
              lineComment: '#',
              blockComment: ['"""', '"""']
            },
            brackets: [
              ['{', '}'],
              ['[', ']'],
              ['(', ')']
            ],
            autoClosingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"', notIn: ['string'] },
              { open: "'", close: "'", notIn: ['string', 'comment'] }
            ],
            surroundingPairs: [
              { open: '{', close: '}' },
              { open: '[', close: ']' },
              { open: '(', close: ')' },
              { open: '"', close: '"' },
              { open: "'", close: "'" }
            ],
            folding: {
              offSide: true,
              markers: {
                start: new RegExp('^\\s*#region\\b'),
                end: new RegExp('^\\s*#endregion\\b')
              }
            }
          });
        }}
      />
    </div>
  );
}