import { useCallback, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { MaterialMeta, MaterialsCategory, MaterialsSection, MaterialsTree } from '../../materials/loader';
import { MarkdownArticle } from '../../components/markdown/markdown-article';
import { withLang } from '../../i18n/url';
import { buildMaterialRoutePath, getAdjacentMaterials } from './article-navigation';
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
  const { t } = useTranslation();
  const lang = material.id.lang;
  const navigate = useNavigate();
  const contentState = useMaterialContent(material);
  const { previous, next } = useMemo(
    () => getAdjacentMaterials(section, material),
    [material, section],
  );

  useMaterialSeo({ material, tree });

  const goToMaterial = useCallback(
    (target?: MaterialMeta) => {
      if (!target) return;
      navigate(withLang(buildMaterialRoutePath(target), lang));
    },
    [lang, navigate],
  );

  const handlePrev = useCallback(() => goToMaterial(previous), [goToMaterial, previous]);
  const handleNext = useCallback(() => goToMaterial(next), [goToMaterial, next]);

  useArticleKeyboardNavigation({
    hasPrevious: !!previous,
    hasNext: !!next,
    onPrevious: handlePrev,
    onNext: handleNext,
  });

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
        {material.subtitle && (
          <p className="mt-2 text-sm text-theme-text-subtle">{material.subtitle}</p>
        )}
      </header>

      <div
        className="flex-1 overflow-y-auto py-4 scroll-elegant"
        aria-busy={contentState.status === 'loading'}
      >
        {contentState.status === 'loading' && (
          <ArticleStatusMessage role="status">{t('materials.loadingMaterial')}</ArticleStatusMessage>
        )}
        {contentState.status === 'error' && (
          <ArticleStatusMessage role="alert">{t('materials.loadError')}</ArticleStatusMessage>
        )}
        {contentState.status === 'ready' && (
          <MarkdownArticle content={contentState.material.content} materialPath={contentState.material.path} />
        )}
      </div>

      <footer className="shrink-0 pt-4 border-t border-theme-border">
        <div className="flex items-center justify-between gap-3">
          <NavButton
            onClick={handlePrev}
            disabled={!previous}
            direction="prev"
            label={previousNavLabel}
          >
            {previous?.title || previousArticleLabel}
          </NavButton>
          <NavButton
            onClick={handleNext}
            disabled={!next}
            direction="next"
            label={nextNavLabel}
          >
            {next?.title || nextArticleLabel}
          </NavButton>
        </div>
      </footer>
    </article>
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
