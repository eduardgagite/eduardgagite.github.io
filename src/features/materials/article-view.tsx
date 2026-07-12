import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { MaterialMeta, MaterialsCategory, MaterialsSection, MaterialsTree } from '../../materials/loader';
import { MarkdownArticle } from '../../components/markdown/markdown-article';
import {
  estimateReadingTimeMinutes,
  extractArticleHeadings,
  type ArticleHeading,
} from '../../components/markdown/article-metadata';
import { normalizeLang, withLang } from '../../i18n/url';
import { buildMaterialRoutePath, getAdjacentCourseMaterials } from './article-navigation';
import { useArticleKeyboardNavigation } from './use-article-keyboard-navigation';
import { useMaterialContent } from './use-material-content';
import { useMaterialSeo } from './use-material-seo';

interface ArticleViewProps {
  category: MaterialsCategory;
  section: MaterialsSection;
  material: MaterialMeta;
  tree: MaterialsTree;
}

export function ArticleView({ category, section, material, tree }: ArticleViewProps) {
  const { t, i18n } = useTranslation();
  const uiLang = normalizeLang(i18n.resolvedLanguage || 'ru');
  const navigate = useNavigate();
  const contentState = useMaterialContent(material);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const { previous, next } = useMemo(() => getAdjacentCourseMaterials(category, material), [category, material]);
  const articleContent = contentState.status === 'ready' ? contentState.material.content : '';
  const headings = useMemo(() => extractArticleHeadings(articleContent), [articleContent]);
  const readingTime = useMemo(() => estimateReadingTimeMinutes(articleContent), [articleContent]);
  const isLanguageFallback = uiLang !== material.id.lang;

  useMaterialSeo({ material, tree });

  const goToMaterial = useCallback(
    (target?: MaterialMeta) => {
      if (!target) return;
      navigate(withLang(buildMaterialRoutePath(target), uiLang));
    },
    [navigate, uiLang],
  );

  const handlePrev = useCallback(() => goToMaterial(previous), [goToMaterial, previous]);
  const handleNext = useCallback(() => goToMaterial(next), [goToMaterial, next]);

  useArticleKeyboardNavigation({
    hasPrevious: !!previous,
    hasNext: !!next,
    onPrevious: handlePrev,
    onNext: handleNext,
  });

  useEffect(() => {
    if (!isLinkCopied) return;
    const timeout = window.setTimeout(() => setIsLinkCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isLinkCopied]);

  const handleCopyLink = useCallback(async () => {
    const path = withLang(buildMaterialRoutePath(material), uiLang);
    const url = new URL(path, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
    } catch {
      setIsLinkCopied(false);
    }
  }, [material, uiLang]);

  const previousArticleLabel = t('materials.prevArticle');
  const nextArticleLabel = t('materials.nextArticle');
  const previousNavLabel = previous ? `${previousArticleLabel}: ${previous.title}` : previousArticleLabel;
  const nextNavLabel = next ? `${nextArticleLabel}: ${next.title}` : nextArticleLabel;

  return (
    <article aria-labelledby="material-title" className="h-full flex flex-col overflow-hidden">
      <header className="shrink-0 pb-4 border-b border-theme-border">
        <p className="text-[11px] uppercase tracking-widest text-theme-text-muted">
          <span>{category.title}</span>
          <span aria-hidden="true"> - </span>
          <span>{section.title}</span>
        </p>
        <h1 id="material-title" className="mt-2 text-xl sm:text-2xl font-bold text-theme-text leading-tight">
          {material.title}
        </h1>
        {material.subtitle && <p className="mt-2 text-sm text-theme-text-subtle">{material.subtitle}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {contentState.status === 'ready' && (
            <span className="rounded-lg border border-theme-border bg-theme-surface-elevated px-2.5 py-1 text-theme-text-muted">
              {t('materials.readingTime', { minutes: readingTime })}
            </span>
          )}
          {isLanguageFallback && (
            <span className="rounded-lg border border-theme-warning/25 bg-theme-warning/10 px-2.5 py-1 text-theme-warning">
              {t('materials.contentInRussian')}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-lg border border-theme-border bg-theme-surface-elevated px-2.5 py-1 text-theme-text-subtle transition-colors hover:border-theme-border-hover hover:text-theme-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
          >
            <span aria-live="polite">{isLinkCopied ? t('materials.copyLinkSuccess') : t('materials.copyLink')}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-4 scroll-elegant" aria-busy={contentState.status === 'loading'}>
        {contentState.status === 'loading' && (
          <ArticleStatusMessage role="status">{t('materials.loadingMaterial')}</ArticleStatusMessage>
        )}
        {contentState.status === 'error' && (
          <ArticleStatusMessage role="alert">{t('materials.loadError')}</ArticleStatusMessage>
        )}
        {contentState.status === 'ready' && (
          <>
            {headings.length > 0 && <ArticleTableOfContents headings={headings} title={t('materials.tocTitle')} />}
            <MarkdownArticle content={contentState.material.content} materialPath={contentState.material.path} />
          </>
        )}
      </div>

      <footer className="shrink-0 pt-4 border-t border-theme-border">
        <div className="flex items-center justify-between gap-3">
          <NavButton onClick={handlePrev} disabled={!previous} direction="prev" label={previousNavLabel}>
            {previous?.title || previousArticleLabel}
          </NavButton>
          <NavButton onClick={handleNext} disabled={!next} direction="next" label={nextNavLabel}>
            {next?.title || nextArticleLabel}
          </NavButton>
        </div>
        <p className="mt-2 text-center font-mono text-[10px] text-theme-text-faint">{t('materials.keyboardHints')}</p>
      </footer>
    </article>
  );
}

function ArticleTableOfContents({ headings, title }: { headings: ArticleHeading[]; title: string }) {
  return (
    <details className="mb-6 rounded-xl border border-theme-border bg-theme-surface-elevated">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-theme-text-secondary marker:content-none">
        <span>{title}</span>
        <span className="font-mono text-[11px] text-theme-text-muted">{headings.length}</span>
      </summary>
      <nav
        aria-label={title}
        className="max-h-52 overflow-y-auto border-t border-theme-border px-4 py-3 scroll-elegant"
      >
        <ol className="space-y-2">
          {headings.map((heading) => (
            <li key={`${heading.line}-${heading.id}`} className={heading.depth === 3 ? 'pl-4' : undefined}>
              <a
                href={`#${heading.id}`}
                className="text-[13px] text-theme-text-subtle transition-colors hover:text-theme-accent"
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}

interface ArticleStatusMessageProps {
  role: 'status' | 'alert';
  children: ReactNode;
}

function ArticleStatusMessage({ role, children }: ArticleStatusMessageProps) {
  return (
    <div className="flex h-full items-center justify-center" role={role}>
      <p className="text-sm text-theme-text-muted">{children}</p>
    </div>
  );
}

interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  direction: 'prev' | 'next';
  label: string;
  children: ReactNode;
}

function NavButton({ onClick, disabled, direction, label, children }: NavButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-w-0 items-center gap-2 px-3 py-2 rounded-xl text-[12px] transition-all max-w-[45%] ${
        disabled
          ? 'text-theme-text-disabled cursor-not-allowed'
          : 'text-theme-text-secondary bg-theme-surface-elevated border border-theme-border hover:bg-theme-card hover:border-theme-border-hover hover:text-theme-text'
      }`}
    >
      {direction === 'prev' && (
        <span className="shrink-0" aria-hidden="true">
          ←
        </span>
      )}
      <span className="truncate">{children}</span>
      {direction === 'next' && (
        <span className="shrink-0" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
}
