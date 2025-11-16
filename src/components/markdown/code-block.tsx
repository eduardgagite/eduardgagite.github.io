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
    <div className="my-3 overflow-hidden rounded-lg border border-white/10 bg-black/60">
      <Highlight
        code={code.trimEnd()}
        language={lang as any}
        theme={themes.oneDark}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} m-0 px-3 py-2 text-[12px] leading-5 sm:px-4 sm:py-3`}
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line, key: i });
              return (
                <div key={i} {...lineProps}>
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
    <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12px] font-mono text-emerald-300">
      {children}
    </code>
  );
}


