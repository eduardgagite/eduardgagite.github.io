import { useEffect, useState } from 'react';
import type { ArticleHeading } from '../../components/markdown/article-metadata';
import { MATERIALS_SCROLLER_ID } from './window';

/**
 * Активный заголовок считаем относительно скроллера раздела, а не вьюпорта:
 * страница прокручивается внутри окна, и с root=null подсветка была бы случайной.
 */
export function useTocActiveHeading(headings: ArticleHeading[], contentReady: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!contentReady || headings.length === 0) return;
    const root = document.getElementById(MATERIALS_SCROLLER_ID);
    if (!root) return;

    const nodes = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((node): node is HTMLElement => !!node);
    if (nodes.length === 0) return;

    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => seen.set(entry.target.id, entry.isIntersecting));
        const passed = headings.filter((heading) => seen.get(heading.id));
        setActive(passed.length > 0 ? passed[passed.length - 1].id : headings[0].id);
      },
      { root, rootMargin: '-64px 0px -68% 0px', threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [contentReady, headings]);

  return active;
}
