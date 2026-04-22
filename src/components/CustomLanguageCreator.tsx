'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import CustomLanguageService from '../services/customLanguageService';
import { languages } from './LanguageSelector';

interface CustomLanguage {
  name: string;
  extension: string;
  keywords: Record<string, string>;
}

interface CustomLanguageCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (language: CustomLanguage) => void;
}

const pythonKeywords = [
  'print', 'if', 'else', 'elif', 'for', 'while', 'def', 'class',
  'import', 'from', 'return', 'try', 'except', 'with', 'as',
  'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'
];

export default function CustomLanguageCreator({ isOpen, onClose, onSave }: CustomLanguageCreatorProps) {
  const { theme } = useTheme();
  const [languageName, setLanguageName] = useState('');
  const [extension, setExtension] = useState('');
  const [keywordTranslations, setKeywordTranslations] = useState<Record<string, string>>({});
  const [nameError, setNameError] = useState('');
  const [extensionError, setExtensionError] = useState('');

  const handleKeywordChange = (pythonKeyword: string, customTranslation: string) => {
    setKeywordTranslations(prev => {
      const updated = { ...prev };

      // First, remove any existing translation for this python keyword
      Object.keys(updated).forEach(key => {
        if (updated[key] === pythonKeyword) {
          delete updated[key];
        }
      });

      // Then add the new translation if it's not empty
      if (customTranslation.trim()) {
        updated[customTranslation.trim()] = pythonKeyword;
      }

      return updated;
    });
  };

  const getCurrentTranslation = (pythonKeyword: string): string => {
    const entry = Object.entries(keywordTranslations).find(([, value]) => value === pythonKeyword);
    return entry ? entry[0] : '';
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('');
      return true;
    }

    // Check against built-in languages
    const builtInLanguage = languages.find(lang =>
      lang.label.toLowerCase() === name.trim().toLowerCase()
    );
    if (builtInLanguage) {
      setNameError('This name is already used by a built-in language');
      return false;
    }

    // Check against existing custom languages
    const customLanguages = CustomLanguageService.getLanguages();
    const existingCustom = Object.values(customLanguages).find(lang =>
      lang.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingCustom) {
      setNameError('This name is already used by another custom language');
      return false;
    }

    setNameError('');
    return true;
  };

  const validateExtension = (ext: string) => {
    if (!ext.trim()) {
      setExtensionError('');
      return true;
    }

    // Get built-in extensions
    const builtInExtensions = [
      'asm', 'sh', 'bas', 'c', 'cpp', 'cs', 'clj', 'cob', 'd', 'ex', 'erl',
      'f90', 'go', 'hs', 'java', 'js', 'kt', 'lisp', 'lua', 'm', 'ml', 'pas',
      'pl', 'php', 'py', 'r', 'rb', 'rs', 'scala', 'sql', 'swift', 'ts', 'vb', 'ved'
    ];

    if (builtInExtensions.includes(ext.trim().toLowerCase())) {
      setExtensionError('This extension is already used by a built-in language');
      return false;
    }

    // Check against existing custom languages
    const customLanguages = CustomLanguageService.getLanguages();
    const existingCustom = Object.values(customLanguages).find(lang =>
      lang.extension.toLowerCase() === ext.trim().toLowerCase()
    );
    if (existingCustom) {
      setExtensionError('This extension is already used by another custom language');
      return false;
    }

    setExtensionError('');
    return true;
  };

  const handleSave = () => {
    const isNameValid = validateName(languageName);
    const isExtensionValid = validateExtension(extension);

    if (languageName.trim() && extension.trim() && isNameValid && isExtensionValid) {
      onSave({
        name: languageName.trim(),
        extension: extension.trim(),
        keywords: keywordTranslations
      });
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setLanguageName('');
    setExtension('');
    setKeywordTranslations({});
    setNameError('');
    setExtensionError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-md max-h-[75vh] overflow-hidden rounded-xl shadow-2xl border-0 animate-fade-in"
        style={{
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          boxShadow: theme === 'dark'
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: theme === 'dark' ? '#6b7280' : '#f3f4f6' }}
              >
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>&lt;/&gt;</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create Language</h2>
                <p className="text-sm opacity-60">Design your custom programming language</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                color: 'var(--foreground)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(75vh-120px)]">
          <div className="p-4">

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Language Name</label>
                  <input
                    type="text"
                    value={languageName}
                    onChange={(e) => {
                      setLanguageName(e.target.value);
                      validateName(e.target.value);
                    }}
                    placeholder="MyLang"
                    className="w-full px-4 py-3 text-sm rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{
                      backgroundColor: nameError
                        ? (theme === 'dark' ? '#2d1b1b' : '#fef2f2')
                        : (theme === 'dark' ? '#6b7280' : '#f8fafc'),
                      color: 'var(--foreground)',
                      boxShadow: nameError
                        ? '0 0 0 1px #ef4444'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                    }}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {nameError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">File Extension</label>
                  <input
                    type="text"
                    value={extension}
                    onChange={(e) => {
                      const cleanExt = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setExtension(cleanExt);
                      validateExtension(cleanExt);
                    }}
                    placeholder="mylang"
                    className="w-full px-4 py-3 text-sm rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{
                      backgroundColor: extensionError
                        ? (theme === 'dark' ? '#2d1b1b' : '#fef2f2')
                        : (theme === 'dark' ? '#6b7280' : '#f8fafc'),
                      color: 'var(--foreground)',
                      boxShadow: extensionError
                        ? '0 0 0 1px #ef4444'
                        : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                    }}
                  />
                  {extensionError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {extensionError}
                    </p>
                  )}
                </div>
              </div>

              {/* Keywords Mapping */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: theme === 'dark' ? '#6b7280' : '#f3f4f6' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Custom Keywords</h3>
                    <p className="text-xs opacity-60">Personalize your language syntax</p>
                  </div>
                </div>

                {/* Keywords Grid */}
                <div
                  className="rounded-xl overflow-hidden max-h-48 overflow-y-auto"
                  style={{
                    backgroundColor: theme === 'dark' ? '#4b5563' : '#f8fafc',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
                  }}
                >
                  {pythonKeywords.map((pythonKeyword) => (
                    <div key={pythonKeyword} className="flex items-center gap-3 p-3 border-b last:border-b-0" style={{ borderColor: theme === 'dark' ? '#374151' : '#e2e8f0' }}>
                      {/* Standard Keyword (Locked) */}
                      <div
                        className="flex-1 px-3 py-2.5 text-sm rounded-lg font-mono font-medium"
                        style={{
                          backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
                          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                          border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                        }}
                      >
                        {pythonKeyword}
                      </div>

                      {/* Custom Keyword (Editable) */}
                      <input
                        type="text"
                        value={getCurrentTranslation(pythonKeyword)}
                        onChange={(e) => handleKeywordChange(pythonKeyword, e.target.value)}
                        placeholder="your word"
                        className="flex-1 px-3 py-2.5 text-sm rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        style={{
                          backgroundColor: theme === 'dark' ? '#6b7280' : '#ffffff',
                          color: getCurrentTranslation(pythonKeyword)
                            ? (theme === 'dark' ? '#569cd6' : '#0000ff')
                            : 'var(--foreground)',
                          border: `1px solid ${theme === 'dark' ? '#6b7280' : '#e5e7eb'}`,
                          fontWeight: getCurrentTranslation(pythonKeyword) ? '600' : '400'
                        }}
                      />
                    </div>
                  ))}

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!languageName.trim() || !extension.trim() || !!nameError || !!extensionError}
              className="flex-1 py-3 px-6 text-sm font-medium text-white rounded-full transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: (!languageName.trim() || !extension.trim() || !!nameError || !!extensionError)
                  ? (theme === 'dark' ? '#374151' : '#9ca3af')
                  : '#ca8a04',
                opacity: (!languageName.trim() || !extension.trim() || !!nameError || !!extensionError) ? 0.5 : 1,
                transform: (!languageName.trim() || !extension.trim() || !!nameError || !!extensionError) ? 'none' : 'scale(1)',
                boxShadow: (!languageName.trim() || !extension.trim() || !!nameError || !!extensionError)
                  ? 'none'
                  : '0 4px 14px 0 rgba(202, 138, 4, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!(!languageName.trim() || !extension.trim() || !!nameError || !!extensionError)) {
                  e.currentTarget.style.backgroundColor = '#a16207';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!(!languageName.trim() || !extension.trim() || !!nameError || !!extensionError)) {
                  e.currentTarget.style.backgroundColor = '#ca8a04';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Create Language
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 text-sm font-medium rounded-full transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: theme === 'dark' ? '#374151' : '#f8fafc',
                color: 'var(--foreground)',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e2e8f0'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#f8fafc';
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}