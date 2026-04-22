'use client';

import { useState } from 'react';
import { fixCodeWithAI } from '../services/groqService';

export function useAICodeFix() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [originalCode, setOriginalCode] = useState<string>('');

  const fixCode = async (code: string, error: string, language: string) => {
    setIsLoading(true);
    setOriginalCode(code);
    try {
      const fixed = await fixCodeWithAI(code, error, language);
      setSuggestedCode(fixed);
      setShowDiff(true);
    } catch (error) {
      console.error('Failed to fix code:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const applyFix = (onApply: (code: string) => void) => {
    if (suggestedCode) {
      onApply(suggestedCode);
    }
    closeDiff();
  };

  const rejectFix = (onReject: (code: string) => void) => {
    if (originalCode) {
      onReject(originalCode);
    }
    closeDiff();
  };

  const closeDiff = () => {
    setShowDiff(false);
    setSuggestedCode(null);
    setOriginalCode('');
  };

  return {
    isLoading,
    suggestedCode,
    showDiff,
    originalCode,
    fixCode,
    applyFix,
    rejectFix,
    closeDiff,
  };
}