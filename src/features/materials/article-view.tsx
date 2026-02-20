import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  loadMaterialContent,
  materialKey,
  type MaterialMeta,
  type MaterialsCategory,
  type MaterialsSection,
  type MaterialsTree,
} from '../../materials/loader';
import { MarkdownArticle } from '../../components/markdown/markdown-article';
import { withLang } from '../../i18n/url';
import { generateMaterialSEO, resetSEO, updateSEO } from '../../utils/seo';

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
  const [loadedMaterial, setLoadedMaterial] = useState<null | Awaited<ReturnType<typeof loadMaterialContent>>>(null);
  const [contentStatus, setContentStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const siblings = section.materials;
  const currentKey = materialKey(material.id);
  const index = siblings.findIndex((item) => materialKey(item.id) === currentKey);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  useEffect(() => {
    const path = `/materials/${material.id.category}/${material.id.section}/${material.id.slug}`;
    const canonicalKey = `${material.id.category}/${material.id.section}/${material.id.slug}`;
    const availableLangs = tree.availableLanguages[canonicalKey] || [material.id.lang];
    const seoData = generateMaterialSEO(material, path, availableLangs);
    updateSEO(seoData);
    return () => {
      resetSEO();
    };
  }, [material, tree]);

  useEffect(() => {
    let cancelled = false;
    setContentStatus('loading');
    setLoadedMaterial(null);

    loadMaterialContent(material)
      .then((nextMaterial) => {
        if (cancelled) return;
        setLoadedMaterial(nextMaterial);
        setContentStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setContentStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [material]);

  const goToMaterial = useCallback(
    (target?: MaterialMeta) => {
      if (!target) return;
      navigate(withLang(`/materials/${target.id.category}/${target.id.section}/${target.id.slug}`, lang));
    },
    [lang, navigate],
  );

  const handlePrev = useCallback(() => goToMaterial(prev), [goToMaterial, prev]);
  const handleNext = useCallback(() => goToMaterial(next), [goToMaterial, next]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;

      if (event.key === 'ArrowLeft' && prev) {
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'ArrowRight' && next) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleNext, handlePrev, next, prev]);

  return (
    <article className="h-full flex flex-col overflow-hidden">
      <header className="shrink-0 pb-4 border-b border-theme-border">
        <p className="text-[11px] uppercase tracking-widest text-theme-text-muted">
          {category.title} → {section.title}
        </p>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-theme-text leading-tight">{material.title}</h1>
        {material.subtitle && (
          <p className="mt-2 text-sm text-theme-text-subtle">{material.subtitle}</p>
        )}
      </header>

      <div className="flex-1 overflow-y-auto py-4 scroll-elegant">
        {contentStatus === 'loading' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-theme-text-muted">
              {t('materials.loadingMaterial')}
            </p>
          </div>
        )}
        {contentStatus === 'error' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-theme-text-muted">
              {t('materials.loadError')}
            </p>
          </div>
        )}
        {contentStatus === 'ready' && loadedMaterial && (
          <MarkdownArticle content={loadedMaterial.content} materialPath={loadedMaterial.path} />
        )}
      </div>

      <footer className="shrink-0 pt-4 border-t border-theme-border">
        <div className="flex items-center justify-between gap-3">
          <NavButton onClick={handlePrev} disabled={!prev} direction="prev">
            {prev?.title || t('materials.prevArticle')}
          </NavButton>
          <NavButton onClick={handleNext} disabled={!next} direction="next">
            {next?.title || t('materials.nextArticle')}
          </NavButton>
        </div>
      </footer>
    </article>
  );
}

interface NavButtonProps {
  onClick: () => void;
  disabled: boolean;
  direction: 'prev' | 'next';
  children: ReactNode;
}

function NavButton({ onClick, disabled, direction, children }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] transition-all max-w-[45%] ${
        disabled
          ? 'text-theme-text-disabled cursor-not-allowed'
          : 'text-theme-text-secondary bg-theme-surface-elevated border border-theme-border hover:bg-theme-card hover:border-theme-border-hover hover:text-theme-text'
      }`}
    >
      {direction === 'prev' && <span className="shrink-0">←</span>}
      <span className="truncate">{children}</span>
      {direction === 'next' && <span className="shrink-0">→</span>}
    </button>
  );
}
