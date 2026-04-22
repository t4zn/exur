'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import CustomLanguageService from '../services/customLanguageService';

interface KeywordTranslationsViewProps {
  language: string;
}

export default function KeywordTranslationsView({ language }: KeywordTranslationsViewProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (!CustomLanguageService.isCustomLanguage(language)) {
    return null;
  }

  const customLang = CustomLanguageService.getCustomLanguage(language);
  if (!customLang || Object.keys(customLang.keywords).length === 0) {
    return null;
  }

  const keywordEntries = Object.entries(customLang.keywords);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs rounded transition-all duration-200 hover:opacity-70 flex items-center gap-1"
        style={{
          backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
          color: 'var(--foreground)'
        }}
      >
        <span>&lt;/&gt;</span>
        <span>{keywordEntries.length}</span>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 min-w-48 max-h-40 overflow-y-auto rounded border shadow-lg z-10"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}
        >
          <div className="p-2">
            <div className="text-xs font-medium mb-2 opacity-70" style={{ color: 'var(--foreground)' }}>
              {customLang.name} Keywords
            </div>
            <div className="space-y-1">
              {keywordEntries.map(([customKeyword, pythonKeyword]) => (
                <div key={customKeyword} className="flex items-center gap-2 text-xs">
                  <span 
                    className="px-1.5 py-0.5 rounded font-mono font-semibold"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      color: theme === 'dark' ? '#569cd6' : '#0000ff'
                    }}
                  >
                    {customKeyword}
                  </span>
                  <span className="opacity-40">→</span>
                  <span 
                    className="px-1.5 py-0.5 rounded font-mono opacity-70"
                    style={{
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#f3f4f6',
                      color: 'var(--foreground)'
                    }}
                  >
                    {pythonKeyword}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}