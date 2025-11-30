// @ts-nocheck
import { useState, type ReactNode } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lang = (language || 'text').toLowerCase();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="group relative my-6 overflow-hidden rounded-2xl bg-theme-code-background shadow-2xl shadow-black/40 ring-1 ring-theme-border">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-theme-border bg-theme-surface px-4 py-2.5">
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.4)]" />
            <span className="size-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.4)]" />
            <span className="size-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.4)]" />
          </div>
          {/* Language badge */}
          {lang && lang !== 'text' && (
            <span className="ml-3 rounded-md bg-theme-surface-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-theme-text-faint">
              {lang}
            </span>
          )}
        </div>
        
        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-theme-text-faint transition-all hover:bg-theme-surface-elevated hover:text-theme-text-subtle"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5" />
              <span>Скопировано</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      
        {/* Code content */}
        <div className="relative">
        <Highlight
        code={code.trimEnd()}
        language={lang as any}
        theme={themes.oneDark}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
              className={`${className} m-0 overflow-x-auto py-4 pl-5 pr-4 font-mono text-[13px] leading-[1.7]`}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                  <div key={i} {...lineProps} className="group/line relative hover:bg-white/[0.02] transition-colors -mx-5 px-5">
                    {/* Line number */}
                    <span className="mr-6 inline-block w-5 select-none text-right font-mono text-[11px] text-white/20 group-hover/line:text-white/35 transition-colors">
                      {i + 1}
                    </span>
                    {/* Code tokens */}
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token, key });
                    return <span key={key} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export interface InlineCodeProps {
  children: ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="rounded-md bg-theme-accent/15 px-1.5 py-0.5 font-mono text-[13px] text-theme-accent border border-theme-accent/20">
      {children}
    </code>
  );
}
