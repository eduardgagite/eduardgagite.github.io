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
        // Support images/ subfolder: images/image.png -> category/section/images/image.png
        // Or direct: image.png -> category/section/image.png
        // Build absolute path: /content/materials/category/section/[images/]image.png
        return `/content/materials/${category}/${section}/${cleanSrc}`;
      }
    }
    return src;
  };
  const headingCounts: Record<string, number> = {};
  const components: Components = {
    h1: (props: any) => {
      const { node, children, ...rest } = props;
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h1 id={headingId} {...rest}>
          {children}
        </h1>
      );
    },
    h2: (props: any) => {
      const { node, children, ...rest } = props;
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h2 id={headingId} {...rest}>
          {children}
        </h2>
      );
    },
    h3: (props: any) => {
      const { node, children, ...rest } = props;
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h3 id={headingId} {...rest}>
          {children}
        </h3>
      );
    },
    h4: (props: any) => {
      const { node, children, ...rest } = props;
      const headingId = resolveHeadingId(node, headingCounts);
      return (
        <h4 id={headingId} {...rest}>
          {children}
        </h4>
      );
    },
    p: (props: any) => <p {...props} />,
    ul: (props: any) => <ul {...props} />,
    ol: (props: any) => <ol {...props} />,
    li: (props: any) => <li {...props} />,
    blockquote: (props: any) => <blockquote {...props} />,
    hr: () => <hr />,
    a: (props: any) => {
      const { href, children, ...rest } = props;
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          {...rest}
        >
          {children}
        </a>
      );
    },
    table: (props: any) => <table {...props} />,
    thead: (props: any) => <thead {...props} />,
    tbody: (props: any) => <tbody {...props} />,
    tr: (props: any) => <tr {...props} />,
    th: (props: any) => <th {...props} />,
    td: (props: any) => <td {...props} />,
    strong: (props: any) => <strong {...props} />,
    em: (props: any) => <em {...props} />,
    code: ((props: any) => {
      const { inline, className, children } = props;
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
    img: (props: any) => {
      const { src, alt, ...rest } = props;
      const resolvedSrc = resolveImagePath(src || '');
      return (
        <figure className="my-6">
          <div className="overflow-hidden rounded-xl border border-theme-border bg-theme-surface max-w-[70%]">
            <img
              src={resolvedSrc}
              alt={alt || ''}
              className="w-full h-auto object-contain"
              loading="lazy"
              {...rest}
            />
          </div>
          {alt && (
            <figcaption className="mt-2 text-sm text-theme-text-muted italic">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    },
  };

  return (
    <div className="prose-article">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, inlineCodeAsHighlightPlugin]}
      components={components}
    >
      {content}
    </ReactMarkdown>
    </div>
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
function inlineCodeAsHighlightPlugin() {
  return (tree: any) => {
    transformInlineCodeNodes(tree);
  };
}

function transformInlineCodeNodes(node: any) {
  if (!node || !Array.isArray(node.children)) return;
  node.children = node.children.map((child: any) => {
    if (child?.type === 'inlineCode') {
      return createInlineHighlightNode(child.value);
    }
    transformInlineCodeNodes(child);
    return child;
  });
}

function createInlineHighlightNode(value: unknown) {
  return {
    type: 'mdInlineHighlight',
    data: {
      hName: 'span',
      hProperties: {
        className: 'inline-md-highlight',
      },
    },
    children: [
      {
        type: 'text',
        value: formatInlineHighlightValue(value),
      },
    ],
  };
}

function formatInlineHighlightValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const normalized = typeof value === 'string' ? value : String(value);
  return normalized.trim();
}

