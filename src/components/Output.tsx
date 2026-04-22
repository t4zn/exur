'use client';

import { SparkIcon } from './SparkIcon';
import { useTheme } from './ThemeProvider';

interface OutputProps {
  output: string;
  error: string;
  isLoading: boolean;
  executionTime: number | null;
  memoryUsed: number | null;
  onAIFix?: () => void;
  isFixingCode?: boolean;
  stdin?: string;
  onStdinChange?: (value: string) => void;
  code?: string;
  onClear?: () => void;
}

export default function Output({
  output,
  error,
  isLoading,
  executionTime,
  memoryUsed,
  onAIFix,
  isFixingCode = false,
  stdin = '',
  onStdinChange,
  code = '',
  onClear
}: OutputProps) {
  const { theme } = useTheme();
  const formatExecutionTime = (time: number | null) => {
    if (time === null) return null;
    if (time < 0.001) return '<1ms';
    if (time < 1) return `${Math.round(time * 1000)}ms`;
    return `${time.toFixed(3)}s`;
  };

  const formatMemory = (memory: number | null) => {
    if (memory === null) return null;
    if (memory < 1024) return `${memory}KB`;
    return `${(memory / 1024).toFixed(1)}MB`;
  };

  const showStats = !isLoading && (output || error) && (executionTime !== null || memoryUsed !== null);

  // Check if code likely needs input (currently unused but kept for future use)
  // const needsInput = code && (
  //   code.includes('input(') ||
  //   code.includes('scanf(') ||
  //   code.includes('cin >>') ||
  //   code.includes('Scanner') ||
  //   code.includes('readLine') ||
  //   code.includes('Console.ReadLine')
  // );

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <div className="p-2 sm:p-3 lg:p-4 xl:p-6 pb-2 sm:pb-3 lg:pb-4" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-base sm:text-lg lg:text-xl font-light" style={{ color: 'var(--foreground)' }}>Output</div>
            {onClear && (output || error) && !isLoading && (
              <button
                onClick={onClear}
                className="p-1 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--foreground)' }}
                title="Clear output"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            )}
          </div>
          {showStats && (
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 text-xs font-mono opacity-60" style={{ color: 'var(--foreground)' }}>
              {executionTime !== null && (
                <span>{formatExecutionTime(executionTime)}</span>
              )}
              {memoryUsed !== null && (
                <span>{formatMemory(memoryUsed)}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-2 sm:p-3 lg:p-4 xl:p-6 font-mono text-sm leading-relaxed" style={{ backgroundColor: 'var(--background)' }}>
        {/* Input Section - Always show if onStdinChange is provided */}
        {onStdinChange && (
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs font-medium mb-1 sm:mb-2 opacity-70" style={{ color: 'var(--foreground)' }}>
              Input for the program (optional):
            </label>
            <textarea
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const textarea = e.currentTarget;
                  const currentValue = textarea.value;
                  const cursorPosition = textarea.selectionStart;
                  const newValue = currentValue.slice(0, cursorPosition) + '\n' + currentValue.slice(cursorPosition);
                  onStdinChange(newValue);
                  // Set cursor position after the new line
                  setTimeout(() => {
                    if (textarea && typeof textarea.selectionStart === 'number') {
                      textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
                    }
                  }, 0);
                }
              }}
              placeholder="Enter input for your program..."
              className="w-full h-12 sm:h-16 lg:h-20 px-2 sm:px-3 py-2 text-xs sm:text-sm font-mono resize-none border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-geist-mono), monospace',
                boxShadow: theme === 'dark'
                  ? '0 0 0 1px rgba(255, 255, 255, 0.1), 0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
            />
            <div className="text-xs opacity-60 mt-1" style={{ color: 'var(--foreground)' }}>
              Tip: Enter each input value on a new line.
            </div>
          </div>
        )}

        {/* Output Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div style={{ color: 'var(--foreground)' }} className="flex items-center gap-1">
              Running code
              <span className="inline-flex">
                <span className="animate-pulse" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-pulse" style={{ animationDelay: '200ms' }}>.</span>
                <span className="animate-pulse" style={{ animationDelay: '400ms' }}>.</span>
              </span>
            </div>
          ) : (
            <>
              {error ? (
                <div className="animate-fade-in">
                  <div style={{ color: 'var(--foreground)' }} className="whitespace-pre-wrap mb-3">
                    {error}
                  </div>
                  {onAIFix && (
                    <span
                      onClick={onAIFix}
                      className="group inline-flex items-center gap-1.5 cursor-pointer hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 text-xs font-semibold tracking-wide"
                      style={{
                        color: 'var(--foreground)',
                        fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif'
                      }}
                      title="Fix code with AI"
                    >
                      <div className="group-hover:rotate-12 transition-transform duration-200">
                        <SparkIcon size={12} />
                      </div>
                      {isFixingCode ? 'Fixing...' : 'AI Fix'}
                    </span>
                  )}
                </div>
              ) : output ? (
                <div style={{ color: 'var(--foreground)' }} className="whitespace-pre-wrap animate-fade-in">
                  {output}
                </div>
              ) : (
                <div style={{ color: 'var(--foreground)' }} className="opacity-50 animate-fade-in">
                  Click Run to execute your code
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
}