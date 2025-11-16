// @ts-nocheck
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock, InlineCode } from './code-block';

export interface MarkdownArticleProps {
  content: string;
}

export function MarkdownArticle({ content }: MarkdownArticleProps) {
  const headingCounts: Record<string, number> = {};
  const components: Components = {
    h1: ({ node, children, ...props }) => {
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h1 id={headingId} className="mb-4 text-2xl font-semibold" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ node, children, ...props }) => {
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h2 id={headingId} className="mt-6 mb-3 text-xl font-semibold" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ node, children, ...props }) => {
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h3 id={headingId} className="mt-4 mb-2 text-lg font-semibold" {...props}>
          {children}
        </h3>
      );
    },
    p: ({ node, ...props }) => (
      <p className="mb-3 text-sm leading-6 text-white/90" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="mb-3 list-disc pl-5 text-sm leading-6 text-white/90" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="mb-3 list-decimal pl-5 text-sm leading-6 text-white/90" {...props} />
    ),
    code: (({ inline, className, children }) => {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match) {
        return (
          <CodeBlock
            code={String(children ?? '')}
            language={match[1]}
          />
        );
      }
      if (inline) return <InlineCode>{children}</InlineCode>;
      return (
        <CodeBlock
          code={String(children ?? '')}
          language={match?.[1]}
        />
      );
    }) as Components['code'],
    img: ({ node, src, alt, ...props }) => (
      <div className="my-4 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-auto object-contain"
          loading="lazy"
          {...props}
        />
        {alt && (
          <p className="px-3 py-2 text-xs text-white/60 border-t border-white/10">
            {alt}
          </p>
        )}
      </div>
    ),
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

export function slugifyHeading(value: string): string {
  if (!value) return 'section';
  const normalized = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return normalized || 'section';
}

export function assignHeadingSlug({ value, counts }: { value: string; counts: Record<string, number> }): string {
  const base = slugifyHeading(value);
  const count = counts[base] ?? 0;
  counts[base] = count + 1;
  if (count === 0) return base;
  return `${base}-${count + 1}`;
}

function resolveHeadingId(node: any, counts: Record<string, number>): string {
  const text = extractHeadingText(node);
  return assignHeadingSlug({ value: text, counts });
}

function extractHeadingText(node: any): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node.value === 'string') return node.value;
  if (!Array.isArray(node.children)) return '';
  return node.children.map(extractHeadingText).join('');
}


