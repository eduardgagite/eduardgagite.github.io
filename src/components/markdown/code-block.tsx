// @ts-nocheck
import type { ReactNode } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

export interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const lang = (language || 'text').toLowerCase();

  return (
    <div className="group relative my-5 overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-lg shadow-black/20">
      {/* Language badge */}
      {lang && lang !== 'text' && (
        <div className="absolute right-3 top-2 z-10">
          <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/50">
            {lang}
          </span>
        </div>
      )}
      
      <Highlight
        code={code.trimEnd()}
        language={lang as any}
        theme={themes.oneDark}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} m-0 overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6`}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div key={i} {...lineProps} className="relative">
                  {/* Line number */}
                  <span className="mr-4 inline-block w-6 select-none text-right text-white/25">
                    {i + 1}
                  </span>
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
  );
}

export interface InlineCodeProps {
  children: ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="rounded-md bg-sky-500/15 px-1.5 py-0.5 font-mono text-[13px] text-sky-300 border border-sky-500/20">
      {children}
    </code>
  );
}
