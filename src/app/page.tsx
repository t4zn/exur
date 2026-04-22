'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CodeEditor from '../components/Editor';
import Output from '../components/Output';
import LanguageSelector, { getLanguageIcon, isOmIcon, isLispIcon, isAssemblyIcon, isBasicIcon } from '../components/LanguageSelector';
import ResizablePanels from '../components/ResizablePanels';

import { useJudge0 } from '../hooks/useJudge0';
import { useAICodeFix } from '../hooks/useAICodeFix';
import { useTheme } from '../components/ThemeProvider';
import InfoOverlay from '../components/info-overlay';
import CustomLanguageCreator from '../components/CustomLanguageCreator';
import KeywordTranslationsViewer from '../components/KeywordTranslationsViewer';
import CustomLanguageService, { CustomLanguage } from '../services/customLanguageService';



const defaultCode: Record<string, string> = {
  assembly: `section .data
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

  bash: `#!/bin/bash
echo "Hello, World!"
echo "Welcome to Pyzun!"`,

  basic: `print "Hello, World!"
print "Welcome to Pyzun!"`,

  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Welcome to Pyzun!\\n");
    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "Welcome to Pyzun!" << endl;
    return 0;
}`,

  csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        Console.WriteLine("Welcome to Pyzun!");
    }
}`,

  clojure: `(println "Hello, World!")
(println "Welcome to Pyzun!")`,

  cobol: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.
       
       PROCEDURE DIVISION.
       DISPLAY "Hello, World!".
       DISPLAY "Welcome to Pyzun!".
       STOP RUN.
`,

  d: `import std.stdio;

void main() {
    writeln("Hello, World!");
    writeln("Welcome to Pyzun!");
}`,

  elixir: `IO.puts("Hello, World!")
IO.puts("Welcome to Pyzun!")`,

  erlang: `-module(main).
-export([start/0]).

start() ->
    io:format("Hello, World!~n"),
    io:format("Welcome to Pyzun!~n").`,

  fortran: `program hello
    print *, 'Hello, World!'
    print *, 'Welcome to Pyzun!'
end program hello`,

  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Welcome to Pyzun!")
}`,

  haskell: `main = do
    putStrLn "Hello, World!"
    putStrLn "Welcome to Pyzun!"`,

  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to Pyzun!");
    }
}`,

  javascript: `console.log("Hello, World!");
console.log("Welcome to Pyzun!");`,

  kotlin: `fun main() {
    println("Hello, World!")
    println("Welcome to Pyzun!")
}`,

  lisp: `(write-line "Hello, World!")
(write-line "Welcome to Pyzun!")`,

  lua: `print("Hello, World!")
print("Welcome to Pyzun!")`,

  objective_c: `#import <Foundation/Foundation.h>

int main() {
    @autoreleasepool {
        NSLog(@"Hello, World!");
        NSLog(@"Welcome to Pyzun!");
    }
    return 0;
}`,

  ocaml: `print_endline "Hello, World!";;
print_endline "Welcome to Pyzun!";;`,

  octave: `disp('Hello, World!')
disp('Welcome to Pyzun!')`,

  pascal: `program Hello;
begin
    writeln('Hello, World!');
    writeln('Welcome to Pyzun!');
end.`,

  perl: `print "Hello, World!\\n";
print "Welcome to Pyzun!\\n";`,

  php: `<?php
echo "Hello, World!\\n";
echo "Welcome to Pyzun!\\n";
?>`,

  prolog: `:- initialization(main).

main :-
    write('Hello, World!'), nl,
    write('Welcome to Pyzun!'), nl,
    halt.`,

  python: `print("Hello, World!")
print("Welcome to Pyzun!")`,

  r: `cat("Hello, World!\\n")
cat("Welcome to Pyzun!\\n")`,

  ruby: `puts "Hello, World!"
puts "Welcome to Pyzun!"`,

  rust: `fn main() {
    println!("Hello, World!");
    println!("Welcome to Pyzun!");
}`,

  scala: `object Main {
    def main(args: Array[String]): Unit = {
        println("Hello, World!")
        println("Welcome to Pyzun!")
    }
}`,

  sql: `SELECT 'Hello, World!' AS greeting;
SELECT 'Welcome to Pyzun!' AS message;`,

  swift: `print("Hello, World!")
print("Welcome to Pyzun!")`,

  typescript: `console.log("Hello, World!");
console.log("Welcome to Pyzun!");`,

  visual_basic: `Imports System

Module Program
    Sub Main()
        Console.WriteLine("Hello, World!")
        Console.WriteLine("Welcome to Pyzun!")
    End Sub
End Module`,

  sanskrit: `वद("नमस्ते विश्व!");
वद("पायज़न में आपका स्वागत है!");`
};

interface FileTab {
  id: string;
  filename: string;
  language: string;
  code: string;
  isModified: boolean;
  output?: string;
  error?: string;
  executionStats?: {
    time: number | null;
    memory: number | null;
  };
}

export default function Home() {
  const getDefaultFilename = (lang: string) => {
    // Check if it's a custom language
    if (CustomLanguageService.isCustomLanguage(lang)) {
      const customLang = CustomLanguageService.getCustomLanguage(lang);
      return customLang ? `main.${customLang.extension}` : 'main.txt';
    }

    const defaults: Record<string, string> = {
      assembly: 'main.asm',
      bash: 'script.sh',
      basic: 'main.bas',
      c: 'main.c',
      cpp: 'main.cpp',
      csharp: 'Program.cs',
      clojure: 'main.clj',
      cobol: 'main.cob',
      d: 'main.d',
      elixir: 'main.ex',
      erlang: 'main.erl',
      fortran: 'main.f90',
      go: 'main.go',
      haskell: 'main.hs',
      java: 'Main.java',
      javascript: 'script.js',
      kotlin: 'Main.kt',
      lisp: 'main.lisp',
      lua: 'main.lua',
      objective_c: 'main.m',
      ocaml: 'main.ml',
      octave: 'main.m',
      pascal: 'main.pas',
      perl: 'script.pl',
      php: 'index.php',
      prolog: 'main.pl',
      python: 'main.py',
      r: 'script.r',
      ruby: 'main.rb',
      rust: 'main.rs',
      scala: 'Main.scala',
      sql: 'query.sql',
      swift: 'main.swift',
      typescript: 'script.ts',
      visual_basic: 'Main.vb',
      sanskrit: 'hello.ved'
    };
    return defaults[lang] || 'main.txt';
  };

  // Load custom languages on mount
  useEffect(() => {
    setCustomLanguages(CustomLanguageService.getLanguages());
  }, []);

  // Initialize with one default file
  const [files, setFiles] = useState<FileTab[]>([
    {
      id: '1',
      filename: getDefaultFilename('python'),
      language: 'python',
      code: defaultCode.python,
      isModified: false,
      output: '',
      error: '',
      executionStats: { time: null, memory: null }
    }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [stdin, setStdin] = useState('');
  const [showCustomLanguageCreator, setShowCustomLanguageCreator] = useState(false);
  const [showKeywordViewer, setShowKeywordViewer] = useState(false);
  const [viewingLanguage, setViewingLanguage] = useState<string>('');
  const [customLanguages, setCustomLanguages] = useState<Record<string, CustomLanguage>>({});
  const [customLanguagesRefresh, setCustomLanguagesRefresh] = useState(0);

  // Get current active file
  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const language = activeFile?.language || 'python';
  const code = activeFile?.code || '';
  const filename = activeFile?.filename || 'main.py';
  const output = activeFile?.output || '';
  const error = activeFile?.error || '';
  const executionStats = activeFile?.executionStats || { time: null, memory: null };
  const { executeCode, isLoading: judge0Loading } = useJudge0();
  const [sanskritLoading, setSanskritLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isLoading = language === 'sanskrit' ? sanskritLoading : judge0Loading;
  const { theme, toggleTheme } = useTheme();
  const { isLoading: isFixingCode, suggestedCode, showDiff, fixCode, applyFix, rejectFix } = useAICodeFix();

  const updateActiveFile = (updates: Partial<FileTab>) => {
    setFiles(prev => prev.map(file =>
      file.id === activeFileId
        ? { ...file, ...updates, isModified: true }
        : file
    ));
  };

  const handleLanguageChange = (newLanguage: string) => {
    const newFilename = getDefaultFilename(newLanguage);
    let newCode = '// Write your code here';

    // Check if it's a custom language
    if (CustomLanguageService.isCustomLanguage(newLanguage)) {
      const customLang = CustomLanguageService.getCustomLanguage(newLanguage);
      if (customLang) {
        newCode = CustomLanguageService.getDefaultCode(customLang);
      }
    } else {
      newCode = defaultCode[newLanguage] || '// Write your code here';
    }

    updateActiveFile({
      language: newLanguage,
      filename: newFilename,
      code: newCode,
      isModified: false,
      output: '',
      error: '',
      executionStats: { time: null, memory: null }
    });
  };

  const handleCodeChange = (newCode: string | undefined) => {
    updateActiveFile({ code: newCode || '' });
  };

  const createNewFile = () => {
    const newId = Date.now().toString();
    const currentLanguage = language; // Use the currently active file's language
    const newFile: FileTab = {
      id: newId,
      filename: getDefaultFilename(currentLanguage),
      language: currentLanguage,
      code: defaultCode[currentLanguage] || '// Write your code here',
      isModified: false,
      output: '',
      error: '',
      executionStats: { time: null, memory: null }
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newId);
  };

  const closeFile = (fileId: string) => {
    if (files.length === 1) return; // Don't close the last file

    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      // If we're closing the active file, switch to another one
      if (fileId === activeFileId) {
        const currentIndex = prev.findIndex(f => f.id === fileId);
        const nextFile = prev[currentIndex + 1] || prev[currentIndex - 1] || newFiles[0];
        setActiveFileId(nextFile.id);
      }
      return newFiles;
    });
  };

  const switchToFile = (fileId: string) => {
    setActiveFileId(fileId);
  };

  const getFilenameWithoutExtension = (fullFilename: string): string => {
    const lastDotIndex = fullFilename.lastIndexOf('.');
    return lastDotIndex === -1 ? fullFilename : fullFilename.substring(0, lastDotIndex);
  };

  const handleStartEditing = () => {
    const nameWithoutExt = getFilenameWithoutExtension(filename);
    setEditingName(nameWithoutExt);
    setIsEditingFilename(true);
  };

  const handleFinishEditing = () => {
    if (editingName.trim()) {
      const currentExtension = getFileExtension(language);
      const newFilename = `${editingName.trim()}.${currentExtension}`;
      updateActiveFile({ filename: newFilename });
    }
    setIsEditingFilename(false);
    setEditingName('');
  };

  const handleEditingNameChange = (newName: string) => {
    // Only allow alphanumeric characters, hyphens, underscores, and spaces
    const sanitizedName = newName.replace(/[^a-zA-Z0-9\-_\s]/g, '');
    setEditingName(sanitizedName);
  };

  const executeSanskritCode = (code: string) => {
    const lines = code.split('\n');
    const output: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();

      // Skip empty lines
      if (!trimmedLine) continue;

      // Check if line starts with वद
      if (trimmedLine.startsWith('वद(')) {
        // Validate proper syntax: वद("message");
        const validSyntax = /^वद\("([^"]*)"\);$/.test(trimmedLine);

        if (validSyntax) {
          // Extract content between quotes
          const match = trimmedLine.match(/वद\("([^"]*)"\);/);
          if (match && match[1]) {
            output.push(match[1]);
          }
        } else {
          // Invalid वद syntax
          errors.push(`Syntax error on line ${i + 1}`);
        }
      } else {
        // Any other syntax is not allowed
        errors.push(`Unsupported syntax on line ${i + 1}`);
      }
    }

    if (errors.length > 0) {
      return {
        output: '',
        error: 'Your code either has errors or uses different syntax.\n\nSubscribe to unlock full Sanskrit support and advance syntax!'
      };
    }

    return {
      output: output.join('\n'),
      error: ''
    };
  };

  const handleRunCode = async () => {
    // Clear current file's output
    updateActiveFile({
      output: '',
      error: '',
      executionStats: { time: null, memory: null }
    });

    if (language === 'sanskrit') {
      // Handle Sanskrit code execution locally with delay
      setSanskritLoading(true);
      const startTime = Date.now();

      // Simulate execution delay of 2-3 seconds
      await new Promise(resolve => setTimeout(resolve, 2500));

      const result = executeSanskritCode(code);
      const executionTime = (Date.now() - startTime) / 1000;

      updateActiveFile({
        output: result.output,
        error: result.error,
        executionStats: {
          time: executionTime,
          memory: 0
        }
      });

      setSanskritLoading(false);
    } else if (CustomLanguageService.isCustomLanguage(language)) {
      // Handle custom language execution
      const customLang = CustomLanguageService.getCustomLanguage(language);
      if (customLang) {
        const translatedCode = CustomLanguageService.translateCode(code, customLang);
        const result = await executeCode(translatedCode, 'python', stdin);

        // Update current file's output
        updateActiveFile({
          output: result.output,
          error: result.error,
          executionStats: {
            time: result.executionTime,
            memory: result.memoryUsed
          }
        });
      }
    } else {
      // Use Judge0 for other languages
      const result = await executeCode(code, language, stdin);

      // Update current file's output
      updateActiveFile({
        output: result.output,
        error: result.error,
        executionStats: {
          time: result.executionTime,
          memory: result.memoryUsed
        }
      });
    }
  };

  const handleAIFix = async () => {
    if (error && code) {
      await fixCode(code, error, language);
    }
  };

  const handleApplyFix = () => {
    applyFix((fixedCode: string) => {
      updateActiveFile({
        code: fixedCode,
        error: '',
        output: ''
      });
    });
  };

  const handleRejectFix = () => {
    rejectFix((originalCode: string) => {
      updateActiveFile({ code: originalCode });
    });
  };

  const handleClear = () => {
    updateActiveFile({
      output: '',
      error: '',
      executionStats: { time: null, memory: null }
    });
  };

  const getFileExtension = (lang: string): string => {
    // Check if it's a custom language
    if (CustomLanguageService.isCustomLanguage(lang)) {
      const customLang = CustomLanguageService.getCustomLanguage(lang);
      return customLang?.extension || 'txt';
    }

    const extensionMap: Record<string, string> = {
      assembly: 'asm',
      bash: 'sh',
      basic: 'bas',
      c: 'c',
      cpp: 'cpp',
      csharp: 'cs',
      clojure: 'clj',
      cobol: 'cob',
      d: 'd',
      elixir: 'ex',
      erlang: 'erl',
      fortran: 'f90',
      go: 'go',
      haskell: 'hs',
      java: 'java',
      javascript: 'js',
      kotlin: 'kt',
      lisp: 'lisp',
      lua: 'lua',
      objective_c: 'm',
      ocaml: 'ml',
      octave: 'm',
      pascal: 'pas',
      perl: 'pl',
      php: 'php',
      prolog: 'pl',
      python: 'py',
      r: 'r',
      ruby: 'rb',
      rust: 'rs',
      scala: 'scala',
      sql: 'sql',
      swift: 'swift',
      typescript: 'ts',
      visual_basic: 'vb',
      sanskrit: 'ved'
    };
    return extensionMap[lang] || 'txt';
  };

  const handleCreateCustomLanguage = (language: CustomLanguage) => {
    CustomLanguageService.saveLanguage(language);
    setCustomLanguages(CustomLanguageService.getLanguages());
    setCustomLanguagesRefresh(prev => prev + 1);
    
    // Generate the language ID the same way the service does
    const languageId = `custom_${language.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Automatically switch to the newly created custom language
    handleLanguageChange(languageId);
    
    // Close the custom language creator modal
    setShowCustomLanguageCreator(false);
  };

  const handleViewLanguage = (languageId: string) => {
    setViewingLanguage(languageId);
    setShowKeywordViewer(true);
  };

  const handleDeleteLanguage = (languageId: string) => {
    CustomLanguageService.deleteLanguage(languageId);
    setCustomLanguages(CustomLanguageService.getLanguages());
    setCustomLanguagesRefresh(prev => prev + 1);

    // If the deleted language is currently active, switch to Python
    if (language === languageId) {
      handleLanguageChange('python');
    }
  };

  const isCustomLanguage = (languageId: string) => {
    return CustomLanguageService.isCustomLanguage(languageId);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500); // Show tick for 2.5 seconds
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500); // Show tick for 2.5 seconds
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename; // Use the current filename from state
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => window.location.reload()}
          >
            <Image src="/pyzun.svg" alt="Pyzun" width={32} height={32} className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-medium tracking-wide" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-league-spartan), sans-serif' }}>Pyzun</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 xl:gap-6">
            <LanguageSelector
              language={language}
              onChange={handleLanguageChange}
              onCreateNew={() => setShowCustomLanguageCreator(true)}
              onViewLanguage={handleViewLanguage}
              onDeleteLanguage={handleDeleteLanguage}
              refreshTrigger={customLanguagesRefresh}
            />
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 lg:p-3 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
              style={{
                color: 'var(--foreground)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg width="16" height="16" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-128px)] lg:h-[calc(100vh-149px)]">
        {/* Mobile/Tablet Layout - Stacked vertically on small screens, resizable on medium+ */}
        <div className="xl:hidden h-full">
          {/* Mobile Portrait - Stacked Layout */}
          <div className="md:hidden h-full flex flex-col">
            {/* Editor Section */}
            <div className="flex-1 min-h-[50%] flex flex-col p-2 animate-slide-in" style={{ backgroundColor: 'var(--background)' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-light" style={{ color: 'var(--foreground)' }}>Editor</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={createNewFile}
                    className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    style={{
                      color: 'var(--foreground)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    aria-label="New file"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    style={{
                      color: 'var(--foreground)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    aria-label="Copy code"
                  >
                    <div className="relative transition-all duration-300 ease-in-out">
                      {isCopied ? (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5" 
                          className="animate-bounce-in"
                          style={{ color: '#fbbf24' }}
                        >
                          <polyline 
                            points="20,6 9,17 4,12" 
                            style={{
                              strokeDasharray: '20',
                              strokeDashoffset: '20',
                              animation: 'draw 0.4s ease-out 0.1s forwards'
                            }}
                          />
                        </svg>
                      ) : (
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          className="transition-all duration-200 ease-out transform hover:scale-110 hover:rotate-3"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" className="transition-all duration-200" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" className="transition-all duration-200" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={handleDownloadCode}
                    className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    style={{
                      color: 'var(--foreground)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    aria-label="Download code"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRunCode}
                    disabled={isLoading}
                    className="p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    style={{
                      color: 'var(--foreground)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.opacity = '0.7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                    aria-label={isLoading ? 'Running code...' : 'Run code'}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center w-4 h-4">
                        <span className="inline-flex">
                          <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-current rounded-full animate-pulse mx-0.5" style={{ animationDelay: '200ms' }}></span>
                          <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                        </span>
                      </div>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto scrollbar-hide mb-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group min-w-0 rounded-t-md transition-all duration-200 ${file.id === activeFileId
                        ? 'shadow-sm'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      style={{
                        backgroundColor: file.id === activeFileId && theme === 'dark' ? '#1e1e1e' : 'transparent',
                        boxShadow: file.id === activeFileId
                          ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                          : 'none'
                      }}
                      onClick={() => switchToFile(file.id)}
                    >
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {isCustomLanguage(file.language) ? (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 'bold',
                              color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                            }}
                          >
                            &lt;/&gt;
                          </span>
                        ) : isOmIcon(getLanguageIcon(file.language)) ? (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                            }}
                          >
                            ॐ
                          </span>
                        ) : isLispIcon(getLanguageIcon(file.language)) ? (
                          <Image
                            src="/lisp.png"
                            alt="Lisp"
                            width={10}
                            height={10}
                            style={{
                              width: '10px',
                              height: '10px',
                              filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                            }}
                          />
                        ) : isAssemblyIcon(getLanguageIcon(file.language)) ? (
                          <Image
                            src={theme === 'dark' ? '/assemblydark.PNG' : '/assemblylight.PNG'}
                            alt="Assembly"
                            width={12}
                            height={12}
                            style={{
                              width: '12px',
                              height: '12px',
                              filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                            }}
                          />
                        ) : isBasicIcon(getLanguageIcon(file.language)) ? (
                          <Image
                            src={theme === 'dark' ? '/basicdark.PNG' : '/basiclight.PNG'}
                            alt="Basic"
                            width={8}
                            height={8}
                            style={{
                              width: '8px',
                              height: '8px',
                              filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                            }}
                          />
                        ) : (
                          <i
                            className={getLanguageIcon(file.language)}
                            style={{
                              fontSize: '10px',
                              color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                            }}
                          ></i>
                        )}
                      </div>

                      {/* Filename */}
                      {isEditingFilename && file.id === activeFileId ? (
                        <div className="flex items-center min-w-0">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => handleEditingNameChange(e.target.value)}
                            onBlur={handleFinishEditing}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleFinishEditing();
                              } else if (e.key === 'Escape') {
                                setIsEditingFilename(false);
                                setEditingName('');
                              }
                            }}
                            className="bg-transparent text-xs font-medium outline-none min-w-0 flex-1"
                            style={{ color: 'var(--foreground)' }}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                          />
                          <span className="text-xs font-medium opacity-60 flex-shrink-0" style={{ color: 'var(--foreground)' }}>
                            .{getFileExtension(file.language)}
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-xs font-medium truncate min-w-0 flex-1"
                          style={{ color: 'var(--foreground)' }}
                          onDoubleClick={() => file.id === activeFileId && handleStartEditing()}
                        >
                          <span>{getFilenameWithoutExtension(file.filename)}</span>
                          <span className="opacity-60">.{getFileExtension(file.language)}</span>
                          {file.isModified && <span className="ml-1 opacity-80">•</span>}
                        </span>
                      )}

                      {/* Close Button */}
                      {files.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFile(file.id);
                          }}
                          className={`flex-shrink-0 transition-opacity p-1 ${file.id === activeFileId
                            ? 'opacity-60 hover:opacity-100'
                            : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                            }`}
                          style={{ color: 'var(--foreground)' }}
                        >
                          <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Code Editor */}
                <div className="flex-1 min-h-0 rounded-b-md overflow-hidden shadow-md" style={{
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                  <CodeEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={language}
                    suggestedCode={suggestedCode || undefined}
                    showDiff={showDiff}
                    onApplyDiff={handleApplyFix}
                    onRejectDiff={handleRejectFix}
                  />
                </div>
              </div>
            </div>

            {/* Output Section */}
            <div className="flex-1 min-h-[40%] animate-fade-in" style={{ backgroundColor: 'var(--background)' }}>
              <Output
                output={output}
                error={error}
                isLoading={isLoading}
                executionTime={executionStats.time}
                memoryUsed={executionStats.memory}
                onAIFix={language !== 'sanskrit' ? handleAIFix : undefined}
                isFixingCode={isFixingCode}
                stdin={stdin}
                onStdinChange={setStdin}
                code={code}
                onClear={handleClear}
              />
            </div>
          </div>

          {/* Tablet/Medium screens - Resizable panels */}
          <div className="hidden md:block h-full">
            <ResizablePanels
              defaultLeftWidth={60}
              minLeftWidth={30}
              maxLeftWidth={80}
              leftPanel={
                <div className="h-full flex flex-col p-3 animate-slide-in" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-light" style={{ color: 'var(--foreground)' }}>Editor</h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={createNewFile}
                        className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        style={{
                          color: 'var(--foreground)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        aria-label="New file"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        style={{
                          color: 'var(--foreground)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        aria-label="Copy code"
                      >
                        <div className="relative transition-all duration-300 ease-in-out">
                          {isCopied ? (
                            <svg 
                              width="18" 
                              height="18" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              className="animate-bounce-in"
                              style={{ color: '#fbbf24' }}
                            >
                              <polyline 
                                points="20,6 9,17 4,12" 
                                style={{
                                  strokeDasharray: '20',
                                  strokeDashoffset: '20',
                                  animation: 'draw 0.4s ease-out 0.1s forwards'
                                }}
                              />
                            </svg>
                          ) : (
                            <svg 
                              width="18" 
                              height="18" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              className="transition-all duration-200 ease-out transform hover:scale-110 hover:rotate-3"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" className="transition-all duration-200" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" className="transition-all duration-200" />
                            </svg>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={handleDownloadCode}
                        className="p-2 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        style={{
                          color: 'var(--foreground)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        aria-label="Download code"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7,10 12,15 17,10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button
                        onClick={handleRunCode}
                        disabled={isLoading}
                        className="p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        style={{
                          color: 'var(--foreground)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.opacity = '0.7';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                        aria-label={isLoading ? 'Running code...' : 'Run code'}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center w-4 h-4">
                            <span className="inline-flex">
                              <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 bg-current rounded-full animate-pulse mx-0.5" style={{ animationDelay: '200ms' }}></span>
                              <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                            </span>
                          </div>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col">
                    {/* Tabs */}
                    <div className="flex items-center overflow-x-auto scrollbar-hide">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-2 px-2 py-2 cursor-pointer group min-w-0 rounded-t-md transition-all duration-200 ${file.id === activeFileId
                            ? 'shadow-sm'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          style={{
                            backgroundColor: file.id === activeFileId && theme === 'dark' ? '#1e1e1e' : 'transparent',
                            boxShadow: file.id === activeFileId
                              ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                              : 'none'
                          }}
                          onClick={() => switchToFile(file.id)}
                        >
                          {/* File Icon */}
                          <div className="flex-shrink-0">
                            {isCustomLanguage(file.language) ? (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                                }}
                              >
                                &lt;/&gt;
                              </span>
                            ) : isOmIcon(getLanguageIcon(file.language)) ? (
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                                }}
                              >
                                ॐ
                              </span>
                            ) : isLispIcon(getLanguageIcon(file.language)) ? (
                              <Image
                                src="/lisp.png"
                                alt="Lisp"
                                width={12}
                                height={12}
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                                }}
                              />
                            ) : isAssemblyIcon(getLanguageIcon(file.language)) ? (
                              <Image
                                src={theme === 'dark' ? '/assemblydark.PNG' : '/assemblylight.PNG'}
                                alt="Assembly"
                                width={14}
                                height={14}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                                }}
                              />
                            ) : isBasicIcon(getLanguageIcon(file.language)) ? (
                              <Image
                                src={theme === 'dark' ? '/basicdark.PNG' : '/basiclight.PNG'}
                                alt="Basic"
                                width={10}
                                height={10}
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                                }}
                              />
                            ) : (
                              <i
                                className={getLanguageIcon(file.language)}
                                style={{
                                  fontSize: '12px',
                                  color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                                }}
                              ></i>
                            )}
                          </div>

                          {/* Filename */}
                          {isEditingFilename && file.id === activeFileId ? (
                            <div className="flex items-center min-w-0">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => handleEditingNameChange(e.target.value)}
                                onBlur={handleFinishEditing}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFinishEditing();
                                  } else if (e.key === 'Escape') {
                                    setIsEditingFilename(false);
                                    setEditingName('');
                                  }
                                }}
                                className="bg-transparent text-xs font-medium outline-none min-w-0 flex-1"
                                style={{ color: 'var(--foreground)' }}
                                autoFocus
                                onFocus={(e) => e.target.select()}
                              />
                              <span className="text-xs font-medium opacity-60 flex-shrink-0" style={{ color: 'var(--foreground)' }}>
                                .{getFileExtension(file.language)}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="text-xs font-medium truncate min-w-0 flex-1"
                              style={{ color: 'var(--foreground)' }}
                              onDoubleClick={() => file.id === activeFileId && handleStartEditing()}
                            >
                              <span>{getFilenameWithoutExtension(file.filename)}</span>
                              <span className="opacity-60">.{getFileExtension(file.language)}</span>
                              {file.isModified && <span className="ml-1 opacity-80">•</span>}
                            </span>
                          )}

                          {/* Close Button */}
                          {files.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                closeFile(file.id);
                              }}
                              className={`flex-shrink-0 transition-opacity p-1 ${file.id === activeFileId
                                ? 'opacity-60 hover:opacity-100'
                                : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                                }`}
                              style={{ color: 'var(--foreground)' }}
                            >
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 min-h-0 rounded-b-md overflow-hidden shadow-md" style={{
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                      <CodeEditor
                        value={code}
                        onChange={handleCodeChange}
                        language={language}
                        suggestedCode={suggestedCode || undefined}
                        showDiff={showDiff}
                        onApplyDiff={handleApplyFix}
                        onRejectDiff={handleRejectFix}
                      />
                    </div>
                  </div>
                </div>
              }
              rightPanel={
                <div className="h-full flex flex-col p-3 animate-fade-in" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="flex-1 min-h-0">
                    <Output
                      output={output}
                      error={error}
                      isLoading={isLoading}
                      executionTime={executionStats.time}
                      memoryUsed={executionStats.memory}
                      onAIFix={language !== 'sanskrit' ? handleAIFix : undefined}
                      isFixingCode={isFixingCode}
                      stdin={stdin}
                      onStdinChange={setStdin}
                      code={code}
                      onClear={handleClear}
                    />
                  </div>
                </div>
              }
            />
          </div>
        </div>

        {/* Desktop Layout - Resizable panels */}
        <div className="hidden xl:block h-full">
          <ResizablePanels
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            leftPanel={
              <div className="h-full flex flex-col p-6 lg:p-8 animate-slide-in" style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light" style={{ color: 'var(--foreground)' }}>Editor</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={createNewFile}
                      className="p-3 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      style={{
                        color: 'var(--foreground)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      aria-label="New file"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="p-3 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      style={{
                        color: 'var(--foreground)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      aria-label="Copy code"
                    >
                      <div className="relative transition-all duration-300 ease-in-out">
                        {isCopied ? (
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            className="animate-bounce-in"
                            style={{ color: '#fbbf24' }}
                          >
                            <polyline 
                              points="20,6 9,17 4,12" 
                              style={{
                                strokeDasharray: '20',
                                strokeDashoffset: '20',
                                animation: 'draw 0.4s ease-out 0.1s forwards'
                              }}
                            />
                          </svg>
                        ) : (
                          <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            className="transition-all duration-200 ease-out transform hover:scale-110 hover:rotate-3"
                          >
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" className="transition-all duration-200" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" className="transition-all duration-200" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={handleDownloadCode}
                      className="p-3 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      style={{
                        color: 'var(--foreground)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      aria-label="Download code"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={isLoading}
                      className="p-3 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      style={{
                        color: 'var(--foreground)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.opacity = '0.7';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      aria-label={isLoading ? 'Running code...' : 'Run code'}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center w-5 h-5">
                          <span className="inline-flex">
                            <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 bg-current rounded-full animate-pulse mx-0.5" style={{ animationDelay: '200ms' }}></span>
                            <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
                          </span>
                        </div>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform hover:scale-110">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {/* Minimal Tabs attached to code editor */}
                <div className="flex-1 min-h-[300px] flex flex-col">
                  {/* Tabs */}
                  <div className="flex items-center overflow-x-auto scrollbar-hide">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer group min-w-0 rounded-t-md transition-all duration-200 ${file.id === activeFileId
                          ? 'shadow-sm'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        style={{
                          backgroundColor: file.id === activeFileId && theme === 'dark' ? '#1e1e1e' : 'transparent',
                          boxShadow: file.id === activeFileId
                            ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                            : 'none'
                        }}
                        onClick={() => switchToFile(file.id)}
                      >
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {isCustomLanguage(file.language) ? (
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                              }}
                            >
                              &lt;/&gt;
                            </span>
                          ) : isOmIcon(getLanguageIcon(file.language)) ? (
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                              }}
                            >
                              ॐ
                            </span>
                          ) : isLispIcon(getLanguageIcon(file.language)) ? (
                            <Image
                              src="/lisp.png"
                              alt="Lisp"
                              width={14}
                              height={14}
                              style={{
                                width: '14px',
                                height: '14px',
                                filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                              }}
                            />
                          ) : isAssemblyIcon(getLanguageIcon(file.language)) ? (
                            <Image
                              src={theme === 'dark' ? '/assemblydark.PNG' : '/assemblylight.PNG'}
                              alt="Assembly"
                              width={16}
                              height={16}
                              style={{
                                width: '16px',
                                height: '16px',
                                filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                              }}
                            />
                          ) : isBasicIcon(getLanguageIcon(file.language)) ? (
                            <Image
                              src={theme === 'dark' ? '/basicdark.PNG' : '/basiclight.PNG'}
                              alt="Basic"
                              width={12}
                              height={12}
                              style={{
                                width: '12px',
                                height: '12px',
                                filter: file.id === activeFileId ? 'sepia(1) saturate(3) hue-rotate(35deg)' : 'none'
                              }}
                            />
                          ) : (
                            <i
                              className={getLanguageIcon(file.language)}
                              style={{
                                fontSize: '14px',
                                color: file.id === activeFileId ? '#fbbf24' : 'currentColor'
                              }}
                            ></i>
                          )}
                        </div>

                        {/* Filename */}
                        {isEditingFilename && file.id === activeFileId ? (
                          <div className="flex items-center min-w-0">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => handleEditingNameChange(e.target.value)}
                              onBlur={handleFinishEditing}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleFinishEditing();
                                } else if (e.key === 'Escape') {
                                  setIsEditingFilename(false);
                                  setEditingName('');
                                }
                              }}
                              className="bg-transparent text-xs font-medium outline-none min-w-0 flex-1"
                              style={{ color: 'var(--foreground)' }}
                              autoFocus
                              onFocus={(e) => e.target.select()}
                            />
                            <span className="text-xs font-medium opacity-60 flex-shrink-0" style={{ color: 'var(--foreground)' }}>
                              .{getFileExtension(file.language)}
                            </span>
                          </div>
                        ) : (
                          <span
                            className="text-xs font-medium truncate min-w-0 flex-1"
                            style={{ color: 'var(--foreground)' }}
                            onDoubleClick={() => file.id === activeFileId && handleStartEditing()}
                          >
                            <span>{getFilenameWithoutExtension(file.filename)}</span>
                            <span className="opacity-60">.{getFileExtension(file.language)}</span>
                            {file.isModified && <span className="ml-1 opacity-80">•</span>}
                          </span>
                        )}

                        {/* Edit Button - Only show for active file on hover */}
                        {file.id === activeFileId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditing();
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              closeFile(file.id);
                            }}
                            className={`flex-shrink-0 transition-opacity p-1 ${file.id === activeFileId
                              ? 'opacity-60 hover:opacity-100'
                              : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                              }`}
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

                  {/* Code Editor */}
                  <div className="flex-1 rounded-b-md overflow-hidden shadow-md" style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}>
                    <CodeEditor
                      value={code}
                      onChange={handleCodeChange}
                      language={language}
                      suggestedCode={suggestedCode || undefined}
                      showDiff={showDiff}
                      onApplyDiff={handleApplyFix}
                      onRejectDiff={handleRejectFix}
                    />
                  </div>
                </div>
              </div>
            }
            rightPanel={
              <div className="h-full flex flex-col p-6 lg:p-8 animate-fade-in" style={{ backgroundColor: 'var(--background)' }}>
                <div className="flex-1 min-h-[300px]">
                  <Output
                    output={output}
                    error={error}
                    isLoading={isLoading}
                    executionTime={executionStats.time}
                    memoryUsed={executionStats.memory}
                    onAIFix={language !== 'sanskrit' ? handleAIFix : undefined}
                    isFixingCode={isFixingCode}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    code={code}
                    onClear={handleClear}
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Info Overlay */}
      <InfoOverlay />

      {/* Custom Language Creator */}
      <CustomLanguageCreator
        isOpen={showCustomLanguageCreator}
        onClose={() => setShowCustomLanguageCreator(false)}
        onSave={handleCreateCustomLanguage}
      />

      {/* Keyword Translations Viewer */}
      <KeywordTranslationsViewer
        isOpen={showKeywordViewer}
        onClose={() => setShowKeywordViewer(false)}
        language={viewingLanguage}
      />

      {/* Footer */}
      <footer className="text-center py-4 text-xs opacity-60" style={{ color: 'var(--foreground)' }}>
        © 2025 Taizun. All rights reserved.
      </footer>
    </div>
  );
}
