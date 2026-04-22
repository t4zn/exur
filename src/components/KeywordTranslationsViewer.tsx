'use client';

import { useTheme } from './ThemeProvider';
import CustomLanguageService from '../services/customLanguageService';

interface KeywordTranslationsViewerProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

export default function KeywordTranslationsViewer({ isOpen, onClose, language }: KeywordTranslationsViewerProps) {
  const { theme } = useTheme();

  if (!isOpen || !CustomLanguageService.isCustomLanguage(language)) {
    return null;
  }

  const customLang = CustomLanguageService.getCustomLanguage(language);
  if (!customLang) {
    return null;
  }

  const keywordEntries = Object.entries(customLang.keywords);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)' }}>
      <div 
        className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border-0 animate-fade-in"
        style={{ 
          backgroundColor: 'var(--background)', 
          color: 'var(--foreground)',
          boxShadow: theme === 'dark' 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6' }}
              >
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>&lt;/&gt;</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{customLang.name}</h2>
                <p className="text-sm opacity-60">
                  {keywordEntries.length} custom keyword{keywordEntries.length !== 1 ? 's' : ''} defined
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--foreground)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="p-6">

            {keywordEntries.length > 0 ? (
              <div className="space-y-4">
                {/* Keywords Grid */}
                <div 
                  className="rounded-xl overflow-hidden"
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#4b5563' : '#f8fafc',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
                  }}
                >
                  <div className="max-h-96 overflow-y-auto">
                    {keywordEntries.map(([customKeyword, pythonKeyword], index) => (
                      <div 
                        key={customKeyword} 
                        className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-opacity-50 transition-colors" 
                        style={{ 
                          borderColor: theme === 'dark' ? '#374151' : '#e2e8f0',
                          backgroundColor: index % 2 === 0 ? 'transparent' : (theme === 'dark' ? 'rgba(31, 41, 55, 0.3)' : 'rgba(248, 250, 252, 0.5)')
                        }}
                      >
                        {/* Your Keyword */}
                        <div className="flex-1">
                          <div className="text-xs font-medium opacity-60 mb-2" style={{ color: 'var(--foreground)' }}>
                            Your keyword
                          </div>
                          <div
                            className="px-4 py-3 rounded-lg font-mono font-semibold text-sm"
                            style={{
                              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                              color: theme === 'dark' ? '#569cd6' : '#0000ff',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {customKeyword}
                          </div>
                        </div>
                        
                        {/* Arrow */}
                        <div className="flex-shrink-0 opacity-40">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12,5 19,12 12,19" />
                          </svg>
                        </div>
                        
                        {/* Standard Equivalent */}
                        <div className="flex-1">
                          <div className="text-xs font-medium opacity-60 mb-2" style={{ color: 'var(--foreground)' }}>
                            Standard equivalent
                          </div>
                          <div
                            className="px-4 py-3 rounded-lg font-mono text-sm"
                            style={{
                              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {pythonKeyword}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12" style={{ color: 'var(--foreground)' }}>
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6' }}
                >
                  <span style={{ fontSize: '28px', fontWeight: 'bold', opacity: 0.6 }}>&lt;/&gt;</span>
                </div>
                <h3 className="text-lg font-medium mb-2">No custom keywords</h3>
                <p className="text-sm opacity-60">This language uses standard syntax</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}