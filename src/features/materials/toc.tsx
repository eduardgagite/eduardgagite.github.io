import { useTranslation } from 'react-i18next';
import type { ArticleHeading } from '../../components/markdown/article-metadata';
import { MATERIALS_SCROLLER_ID } from './window';

interface ArticleTocProps {
  headings: ArticleHeading[];
  variant: 'rail' | 'inline';
  active?: string | null;
  className?: string;
}

/** Ординалы h2 считаем так же, как номера заголовков в тексте (счётчик в CSS). */
function withOrdinals(headings: ArticleHeading[]) {
  let ordinal = 0;
  return headings.map((heading) => {
    if (heading.depth === 2) ordinal += 1;
    return { heading, ordinal: heading.depth === 2 ? String(ordinal).padStart(2, '0') : null };
  });
}

function scrollToHeading(id: string) {
  const scroller = document.getElementById(MATERIALS_SCROLLER_ID);
  const target = document.getElementById(id);
  if (!scroller || !target) return;
  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  scroller.scrollTop += targetRect.top - scrollerRect.top - 56;
  // replaceState, а не pushState: иначе Back начинает ходить по хешам вместо материалов.
  window.history.replaceState(null, '', `#${id}`);
}

export function ArticleToc({ headings, variant, active, className }: ArticleTocProps) {
  const { t } = useTranslation();
  const items = withOrdinals(variant === 'inline' ? headings.filter((h) => h.depth === 2) : headings);

  // Верхнюю линейку рисует <hr> под заголовком, поэтому своей рамки сверху здесь нет.
  if (variant === 'inline') {
    return (
      <nav aria-label={t('materials.tocTitle')} className={`mb-7 border-b border-white/[0.07] py-4 ${className || ''}`}>
        <p className="mb-2.5 text-[11px] text-white/45">{t('materials.tocTitle')}</p>
        <ul className="space-y-1.5">
          {items.map(({ heading, ordinal }) => (
            <li key={`${heading.line}-${heading.id}`}>
              <a
                href={`#${heading.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToHeading(heading.id);
                }}
                className="flex gap-2.5 text-[13px] leading-snug text-white/60 transition-colors hover:text-white/90"
              >
                <span aria-hidden className="w-4 shrink-0 font-mono text-[11px] tabular-nums text-white/30">
                  {ordinal}
                </span>
                <span className="min-w-0">{heading.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label={t('materials.tocTitle')}
      className={`scroll-elegant sticky top-11 max-h-[var(--materials-rail)] overflow-y-auto ${className || ''}`}
    >
      <p className="mb-3 text-[11px] text-white/45">{t('materials.tocTitle')}</p>
      <ul>
        {items.map(({ heading, ordinal }) => (
          <li key={`${heading.line}-${heading.id}`}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToHeading(heading.id);
              }}
              className={`flex gap-2 border-l py-1.5 pl-3 transition-colors ${
                heading.depth === 3 ? 'pl-6 text-[11.5px]' : 'text-[12.5px]'
              } ${
                active === heading.id
                  ? 'border-theme-primary text-white/90'
                  : 'border-white/[0.08] text-white/50 hover:text-white/80'
              }`}
            >
              {ordinal && (
                <span
                  aria-hidden
                  className="w-3 shrink-0 font-mono text-[10.5px] leading-[1.5] tabular-nums text-white/30"
                >
                  {ordinal}
                </span>
              )}
              <span className="min-w-0">{heading.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
