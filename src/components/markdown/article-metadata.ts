export interface ArticleHeading {
  depth: 2 | 3;
  id: string;
  line: number;
  text: string;
}

export function extractArticleHeadings(markdown: string): ArticleHeading[] {
  const counts: Record<string, number> = {};
  const headings: ArticleHeading[] = [];
  let activeFence: { character: string; length: number } | null = null;

  markdown.split(/\r?\n/).forEach((line, index) => {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const fence = {
        character: fenceMatch[1][0],
        length: fenceMatch[1].length,
      };
      if (!activeFence) {
        activeFence = fence;
      } else if (activeFence.character === fence.character && fence.length >= activeFence.length) {
        activeFence = null;
      }
      return;
    }

    if (activeFence) return;

    const headingMatch = line.match(/^(#{2,3})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (!headingMatch) return;

    const text = normalizeMarkdownHeadingText(headingMatch[2]);
    if (!text) return;

    headings.push({
      depth: headingMatch[1].length as 2 | 3,
      id: assignHeadingSlug({ value: text, counts }),
      line: index + 1,
      text,
    });
  });

  return headings;
}

export function estimateReadingTimeMinutes(markdown: string, wordsPerMinute = 200): number {
  const words = markdown.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
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
  return count === 0 ? base : `${base}-${count + 1}`;
}

function normalizeMarkdownHeadingText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\\([\\`*_[\]{}()#+.!-])/g, '$1')
    .trim();
}
