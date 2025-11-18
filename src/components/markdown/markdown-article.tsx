// @ts-nocheck
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock, InlineCode } from './code-block';

export interface MarkdownArticleProps {
  content: string;
  materialPath?: string;
}

export function MarkdownArticle({ content, materialPath }: MarkdownArticleProps) {
  // Resolve image paths relative to the material file
  const resolveImagePath = (src: string): string => {
    if (!src) return src;
    // If it's already an absolute URL, return as is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    // If it's already an absolute path from root, return as is
    if (src.startsWith('/')) {
      return src;
    }
    // If materialPath is provided, resolve relative to it
    if (materialPath) {
      // materialPath is like: /content/materials/redis/intro/01-what-is-redis.ru.md
      // Extract category/section from path: redis/intro
      const pathParts = materialPath.split('/');
      const materialsIndex = pathParts.indexOf('materials');
      if (materialsIndex !== -1 && pathParts.length > materialsIndex + 2) {
        const category = pathParts[materialsIndex + 1];
        const section = pathParts[materialsIndex + 2];
        // Remove ./ prefix if present
        const cleanSrc = src.startsWith('./') ? src.substring(2) : src;
        // Build absolute path: /content/materials/category/section/image.png
        return `/content/materials/${category}/${section}/${cleanSrc}`;
      }
    }
    return src;
  };
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
    img: ({ node, src, alt, ...props }) => {
      const resolvedSrc = resolveImagePath(src || '');
      return (
        <div className="my-4 flex justify-center">
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] max-w-[80%]">
            <img
              src={resolvedSrc}
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
        </div>
      );
    },
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


