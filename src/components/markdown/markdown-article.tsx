import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock, InlineCode } from './code-block';
import { extractArticleHeadings, slugifyHeading } from './article-metadata';

export interface MarkdownArticleProps {
  content: string;
  materialPath?: string;
}

export function MarkdownArticle({ content, materialPath }: MarkdownArticleProps) {
  const headingIdsByLine = useMemo(
    () => new Map(extractArticleHeadings(content).map((heading) => [heading.line, heading.id])),
    [content],
  );

  const components = useMemo<Components>(() => {
    const resolveImagePath = (src: string): string => {
      if (!src) return src;
      if (src.startsWith('http://') || src.startsWith('https://')) return src;
      if (src.startsWith('/')) return src;
      if (materialPath) {
        const pathParts = materialPath.split('/');
        const materialsIndex = pathParts.indexOf('materials');
        if (materialsIndex !== -1 && pathParts.length > materialsIndex + 2) {
          const category = pathParts[materialsIndex + 1];
          const section = pathParts[materialsIndex + 2];
          const cleanSrc = src.startsWith('./') ? src.substring(2) : src;
          return `/content/materials/${category}/${section}/${cleanSrc}`;
        }
      }
      return src;
    };

    return {
      h1: (props) => {
        const { node, children, ...rest } = props;
        const headingId = resolveHeadingId(node, headingIdsByLine);
        return (
          <h1 id={headingId} {...rest}>
            {children}
          </h1>
        );
      },
      h2: (props) => {
        const { node, children, ...rest } = props;
        const headingId = resolveHeadingId(node, headingIdsByLine);
        return (
          <h2 id={headingId} {...rest}>
            {children}
          </h2>
        );
      },
      h3: (props) => {
        const { node, children, ...rest } = props;
        const headingId = resolveHeadingId(node, headingIdsByLine);
        return (
          <h3 id={headingId} {...rest}>
            {children}
          </h3>
        );
      },
      h4: (props) => {
        const { node, children, ...rest } = props;
        const headingId = resolveHeadingId(node, headingIdsByLine);
        return (
          <h4 id={headingId} {...rest}>
            {children}
          </h4>
        );
      },
      p: ({ node, ...props }) => <p {...props} />,
      ul: ({ node, ...props }) => <ul {...props} />,
      ol: ({ node, ...props }) => <ol {...props} />,
      li: ({ node, ...props }) => <li {...props} />,
      blockquote: ({ node, ...props }) => <blockquote {...props} />,
      hr: ({ node, ...props }) => <hr {...props} />,
      a: (props) => {
        const { node, href, children, ...rest } = props;
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
      // Широкие таблицы прокручиваются сами, а не утаскивают колонку текста.
      table: ({ node, ...props }) => (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- прокручиваемая область должна быть доступна с клавиатуры
        <div className="my-6 overflow-x-auto" role="group" tabIndex={0}>
          <table {...props} />
        </div>
      ),
      thead: ({ node, ...props }) => <thead {...props} />,
      tbody: ({ node, ...props }) => <tbody {...props} />,
      tr: ({ node, ...props }) => <tr {...props} />,
      th: ({ node, ...props }) => <th {...props} />,
      td: ({ node, ...props }) => <td {...props} />,
      strong: ({ node, ...props }) => <strong {...props} />,
      em: ({ node, ...props }) => <em {...props} />,
      code: (props) => {
        const { node: _node, className, children } = props;
        const match = /language-([\w-]+)/.exec(className || '');
        const rawContent = String(children ?? '');
        const isBlock = !!className || rawContent.includes('\n');
        const content = rawContent.trim();

        if (!isBlock) {
          return <InlineCode>{children}</InlineCode>;
        }

        return <CodeBlock code={content} language={match?.[1]} />;
      },
      img: (props) => {
        const { node, src, alt, ...rest } = props;
        const resolvedSrc = resolveImagePath(src || '');
        return (
          <figure className="my-6">
            <span className="block overflow-hidden rounded-lg border border-white/10 bg-theme-surface">
              <img
                src={resolvedSrc}
                alt={alt || ''}
                className="h-auto w-full object-contain"
                loading="lazy"
                {...rest}
              />
            </span>
            {alt && <figcaption className="mt-2 font-mono text-[12px] text-white/50">{alt}</figcaption>}
          </figure>
        );
      },
    };
  }, [headingIdsByLine, materialPath]);

  return (
    <div className="prose-article">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function resolveHeadingId(node: unknown, headingIdsByLine: Map<number, string>): string {
  const line = extractHeadingLine(node);
  if (line !== null) {
    const id = headingIdsByLine.get(line);
    if (id) return id;
  }

  const text = extractHeadingText(node);
  return slugifyHeading(text);
}

function extractHeadingLine(node: unknown): number | null {
  if (!node || typeof node !== 'object' || !('position' in node)) return null;
  const position = node.position;
  if (!position || typeof position !== 'object' || !('start' in position)) return null;
  const start = position.start;
  if (!start || typeof start !== 'object' || !('line' in start) || typeof start.line !== 'number') return null;
  return start.line;
}

function extractHeadingText(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (typeof node !== 'object') return '';

  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractHeadingText).join('');
  }

  return '';
}
