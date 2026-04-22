'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import CustomLanguageService, { CustomLanguage } from '../services/customLanguageService';

interface CustomLanguagesDropdownProps {
  onSelectLanguage: (languageId: string) => void;
  onCreateNew: () => void;
  onViewLanguage?: (languageId: string) => void;
  onDeleteLanguage?: (languageId: string) => void;
  refreshTrigger?: number;
}

export default function CustomLanguagesDropdown({ onSelectLanguage, onCreateNew, onViewLanguage, onDeleteLanguage, refreshTrigger }: CustomLanguagesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customLanguages, setCustomLanguages] = useState<Record<string, CustomLanguage>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Load custom languages on mount and when refreshTrigger changes
  useEffect(() => {
    setCustomLanguages(CustomLanguageService.getLanguages());
  }, [refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (languageId: string) => {
    onSelectLanguage(languageId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew();
    setIsOpen(false);
  };

  const handleView = (languageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onViewLanguage?.(languageId);
    setIsOpen(false);
  };

  const handleDelete = (languageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteLanguage?.(languageId);
  };

  const languageEntries = Object.entries(customLanguages);
  const hasLanguages = languageEntries.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 sm:px-4 py-2 sm:py-3 font-medium uppercase tracking-wider text-xs sm:text-sm flex items-center justify-between min-w-[100px] sm:min-w-[140px] transition-all duration-200 hover:opacity-80"
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)'
        }}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span className="truncate">My Languages</span>
        </div>
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`transition-transform duration-200 sm:w-3 sm:h-3 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 max-h-60 overflow-hidden z-50 animate-fade-in border rounded-b"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}
        >
          {/* Create New Button */}
          <button
            onClick={handleCreateNew}
            className="w-full px-4 py-2 text-left hover:opacity-70 transition-all duration-150 font-medium text-sm hover:translate-x-1 flex items-center gap-2 border-b"
            style={{
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Create New</span>
          </button>

          {/* Custom Languages List */}
          <div className="overflow-y-auto max-h-48">
            {hasLanguages ? (
              languageEntries.map(([id, lang]) => (
                <div key={id} className="flex items-center">
                  <button
                    onClick={() => handleSelect(id)}
                    className="flex-1 px-4 py-2 text-left hover:opacity-70 transition-all duration-150 font-medium text-sm hover:translate-x-1 flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>&lt;/&gt;</span>
                    <span>{lang.name}</span>
                    <span 
                      className="px-1 py-0.5 font-medium rounded opacity-70"
                      style={{
                        backgroundColor: 'var(--foreground)',
                        color: 'var(--background)',
                        fontSize: '8px'
                      }}
                    >
                      .{lang.extension}
                    </span>
                  </button>
                  
                  <div className="flex items-center">
                    {/* View Button */}
                    {Object.keys(lang.keywords).length > 0 && (
                      <button
                        onClick={(e) => handleView(id, e)}
                        className="px-2 py-2 hover:opacity-70 transition-all duration-150"
                        style={{ color: 'var(--foreground)' }}
                        title="View keywords"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    )}
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(id, e)}
                      className="px-2 py-2 transition-all duration-150"
                      style={{ color: '#ca8a04' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#a16207';
                        e.currentTarget.style.opacity = '0.7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#ca8a04';
                        e.currentTarget.style.opacity = '1';
                      }}
                      title="Delete language"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm opacity-50 text-center" style={{ color: 'var(--foreground)' }}>
                No custom languages yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}