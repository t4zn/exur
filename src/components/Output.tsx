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
      <div className="p-2 sm:p-3 lg:p-4 xl:p-6 pb-1 sm:pb-1.5 lg:pb-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Output</div>
            {onClear && (output || error) && !isLoading && (
              <button
                onClick={onClear}
                className="p-1 hover:opacity-70 transition-opacity"
                style={{ color: '#8141e6' }}
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
            {showStats && (
              <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-mono opacity-60" style={{ color: 'var(--foreground)' }}>
                {executionTime !== null && (
                  <span>{formatExecutionTime(executionTime)}</span>
                )}
                {memoryUsed !== null && (
                  <span>{formatMemory(memoryUsed)}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center" style={{ width: '300px', justifyContent: 'flex-start', marginLeft: '-48px' }}>
            {onStdinChange && (
              <div className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>Input</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-3 sm:gap-4 px-2 sm:px-3 lg:px-4 xl:px-6 pb-2 sm:pb-3 lg:pb-4 xl:pb-6 font-mono text-[11px] sm:text-sm leading-relaxed overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
        {/* Output Content - Left Side */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden output-scroll">
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
                  <div style={{ color: 'var(--foreground)' }} className="whitespace-pre-wrap break-words mb-3">
                    {error}
                  </div>
                  {onAIFix && (
                    <span
                      onClick={onAIFix}
                      className="group inline-flex items-center gap-1.5 cursor-pointer hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 text-[10px] sm:text-xs font-semibold tracking-wide"
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
                <div style={{ color: 'var(--foreground)' }} className="whitespace-pre-wrap break-words animate-fade-in">
                  {output}
                </div>
              ) : (
                <div style={{ color: 'var(--foreground)' }} className="opacity-50 animate-fade-in">
                  Run code to see output
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Section - Right Side */}
        {onStdinChange && (
          <div className="w-[300px] lg:w-[350px] flex-shrink-0">
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
              placeholder="Enter input..."
              className="w-full h-full px-3 py-2 text-xs font-mono resize-none rounded-2xl outline-none placeholder:opacity-40"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-geist-mono), monospace',
                border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}