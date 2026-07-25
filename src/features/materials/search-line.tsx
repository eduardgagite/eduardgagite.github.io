import { forwardRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { materialKey } from '../../materials/loader';
import { withLang } from '../../i18n/url';
import { buildMaterialRoutePath } from './article-navigation';
import type { MaterialHit } from './search';

interface SearchLineProps {
  query: string;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

/** Не капсула с лупой, а линейка с моно-слэшем — он же подсказка горячей клавиши. */
export const SearchLine = forwardRef<HTMLInputElement, SearchLineProps>(function SearchLine(
  { query, onChange, onKeyDown, onClear },
  ref,
) {
  const { t } = useTranslation();

  return (
    <label className="flex items-baseline gap-2 border-b border-white/10 pb-1.5 transition-colors focus-within:border-white/30">
      <span aria-hidden className="font-mono text-[13px] leading-none text-white/35">
        /
      </span>
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label={t('materials.searchLabel')}
        placeholder={t('materials.searchPlaceholder')}
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-white/85 placeholder:text-white/35 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 font-mono text-[11px] text-white/45 transition-colors hover:text-white/80"
        >
          {t('materials.searchClear')}
        </button>
      )}
    </label>
  );
});

interface SearchResultsProps {
  hits: MaterialHit[];
  query: string;
  lang: 'ru' | 'en';
  selectedIndex: number;
  selectedRowRef: React.RefObject<HTMLAnchorElement>;
  onPick: () => void;
  onShowAll: () => void;
}

export function SearchResults({
  hits,
  query,
  lang,
  selectedIndex,
  selectedRowRef,
  onPick,
  onShowAll,
}: SearchResultsProps) {
  const { t } = useTranslation();

  if (hits.length === 0) {
    return (
      <div className="px-2 py-3">
        <p className="font-mono text-[12px] text-white/50">{t('materials.emptyState')}</p>
        <button
          type="button"
          onClick={onShowAll}
          className="mt-2 font-mono text-[11px] text-white/45 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
        >
          {t('materials.searchShowAll')}
        </button>
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {hits.map((hit, index) => (
        <li key={materialKey(hit.material.id)}>
          <Link
            to={withLang(buildMaterialRoutePath(hit.material), lang)}
            onClick={onPick}
            ref={index === selectedIndex ? selectedRowRef : undefined}
            aria-current={index === selectedIndex ? 'true' : undefined}
            className={`block rounded-[3px] px-2 py-1.5 transition-colors hover:bg-white/[0.035] ${
              index === selectedIndex ? 'bg-white/[0.05]' : ''
            }`}
          >
            <span className="block text-[12.5px] leading-snug text-white/80">
              <Highlighted text={hit.material.title} query={query} />
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-white/50">
              {hit.categoryTitle} / {hit.sectionTitle}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase();
  if (!needle) return <>{text}</>;
  const at = text.toLowerCase().indexOf(needle);
  if (at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-theme-accent">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}
