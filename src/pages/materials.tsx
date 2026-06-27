import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  materialKey,
  type MaterialsCategory,
  type MaterialsSection,
} from '../materials/loader';
import { buildPageSeoUrl, resetSEO, updateSEO } from '../utils/seo';
import { readLastMaterialsPath, writeLastMaterialsPath } from '../utils/materials-location';
import { withLang } from '../i18n/url';
import { ArticleView } from '../features/materials/article-view';
import { EmptyState, MaterialsIntro } from '../features/materials/intro';
import {
  parseMaterialsSegments,
  parseStoredMaterialsPath,
  resolveMaterialsRoute,
} from '../features/materials/route';
import { CloseIcon, MaterialsSidebar, MenuIcon, type MaterialsSidebarProps } from '../features/materials/sidebar';
import type { SidebarCopy } from '../features/materials/types';
import { useMaterialsFilters } from '../features/materials/use-materials-filters';
import { useMaterialsSidebarState } from '../features/materials/use-materials-sidebar-state';
import { useMaterialsTree } from '../features/materials/use-materials-tree';
import { NotFound } from './not-found';

const MOBILE_SIDEBAR_ID = 'materials-mobile-sidebar';

export function Materials() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ '*': string }>();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebarButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileSidebarRef = useRef<HTMLElement | null>(null);
  const sidebarOpenerRef = useRef<HTMLElement | null>(null);
  const { tree, isTreeReady, isTreeLoading, isTreeError } = useMaterialsTree(lang);
  const {
    filterOptions,
    filteredCategories,
    hasActiveFilters,
    searchQuery,
    selectedLevel,
    selectedTag,
    setSearchQuery,
    setSelectedLevel,
    setSelectedTag,
    resetFilters,
  } = useMaterialsFilters({ categories: tree.categories });

  const sidebarCopy = useMemo<SidebarCopy>(
    () => ({
      heading: t('nav.materials'),
      intro: t('materials.sidebarIntro'),
      searchLabel: t('materials.searchLabel'),
      searchPlaceholder: t('materials.searchPlaceholder') || '',
      levelLabel: t('materials.levelFilter'),
      tagsLabel: t('materials.tagsFilter'),
      resetLabel: t('materials.filtersReset'),
      emptyLabel: t('materials.noMatches'),
      filtersTitle: t('materials.filtersTitle'),
      structureTitle: t('materials.structureTitle'),
    }),
    [t],
  );
  const closeSidebarLabel = t('materials.closeSidebar');

  const openMobileSidebar = useCallback(() => {
    sidebarOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setSidebarOpen(false);
    window.requestAnimationFrame(() => sidebarOpenerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return;
    closeSidebarButtonRef.current?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileSidebar();
        return;
      }

      if (event.key !== 'Tab') return;

      const sidebar = mobileSidebarRef.current;
      if (!sidebar) return;

      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileSidebar, sidebarOpen]);

  const segments = useMemo(() => parseMaterialsSegments(params['*']), [params['*']]);
  const routeState = useMemo(
    () => (isTreeReady ? resolveMaterialsRoute(segments, tree) : null),
    [isTreeReady, segments, tree],
  );
  const isRoot = routeState?.type === 'root';
  const isArticle = routeState?.type === 'article';
  const isNotFound = routeState?.type === 'not-found';

  useEffect(() => {
    if (!isTreeReady) return;
    if (!isRoot) return;
    const lastPath = readLastMaterialsPath({ lang });
    if (!lastPath) return;
    if (lastPath === '/materials') return;
    const lastSegments = parseStoredMaterialsPath(lastPath);
    if (!lastSegments) return;
    const resolved = resolveMaterialsRoute(lastSegments, tree);
    if (resolved.type !== 'article') return;
    const canonicalPath = `/materials/${resolved.category.id}/${resolved.section.id}/${resolved.material.id.slug}`;
    navigate(withLang(canonicalPath, lang), { replace: true });
  }, [isRoot, isTreeReady, lang, navigate, tree]);

  useEffect(() => {
    if (!isTreeReady) return;
    if (!routeState || routeState.type !== 'redirect') return;
    navigate(withLang(routeState.path, lang), { replace: true });
  }, [isTreeReady, lang, navigate, routeState]);

  const activeCategory = routeState?.type === 'article' ? routeState.category : undefined;
  const activeSection = routeState?.type === 'article' ? routeState.section : undefined;
  const activeMaterial = routeState?.type === 'article' ? routeState.material : undefined;

  useEffect(() => {
    if (!isArticle || !activeCategory || !activeSection || !activeMaterial) return;
    writeLastMaterialsPath({
      lang,
      path: `/materials/${activeCategory.id}/${activeSection.id}/${activeMaterial.id.slug}`,
    });
  }, [activeCategory, activeMaterial, activeSection, isArticle, lang]);

  const activeMaterialKey = activeMaterial ? materialKey(activeMaterial.id) : null;
  const displayActiveCategoryId = isArticle ? activeCategory?.id : undefined;
  const displayActiveSectionId = isArticle ? activeSection?.id : undefined;
  const displayActiveMaterialKey = isArticle ? activeMaterialKey : null;
  const {
    categoryOpen,
    sectionOpen,
    toggleCategory,
    toggleSection,
  } = useMaterialsSidebarState({
    activeCategoryId: displayActiveCategoryId,
    activeSectionId: displayActiveSectionId,
    isArticle,
  });

  useEffect(() => {
    if (!isTreeReady) return;
    if (!isRoot) return;
    const title = t('meta.materialsTitle') || 'Материалы — Eduard Gagite';
    const description =
      t('meta.materialsDescription') ||
      'Курсы и материалы по Redis, Docker и другим технологиям для backend-разработчиков.';
    const url = buildPageSeoUrl({ path: location.pathname, lang });
    updateSEO({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogUrl: url,
      ogType: 'website',
      ogLocale: lang === 'ru' ? 'ru_RU' : 'en_US',
      canonical: url,
    });
    return () => {
      resetSEO();
    };
  }, [isRoot, isTreeReady, lang, location.pathname, t]);

  const handleSelectMaterial = (category: MaterialsCategory, section: MaterialsSection, slug: string) => {
    navigate(withLang(`/materials/${category.id}/${section.id}/${slug}`, lang));
    setSidebarOpen(false);
  };

  const sidebarProps: Omit<MaterialsSidebarProps, 'idPrefix'> = {
    copy: sidebarCopy,
    filterOptions,
    searchQuery,
    selectedLevel,
    selectedTag,
    onSearchChange: setSearchQuery,
    onSelectLevel: setSelectedLevel,
    onSelectTag: setSelectedTag,
    onResetFilters: resetFilters,
    hasActiveFilters,
    categories: filteredCategories,
    categoryOpen,
    sectionOpen,
    activeCategoryId: displayActiveCategoryId,
    activeSectionId: displayActiveSectionId,
    activeMaterialKey: displayActiveMaterialKey,
    onToggleCategory: toggleCategory,
    onToggleSection: toggleSection,
    onSelectMaterial: handleSelectMaterial,
  };

  if (isNotFound) {
    return <NotFound />;
  }

  if (isTreeLoading) {
    return (
      <section className="h-full w-full flex items-center justify-center overflow-y-auto overflow-x-hidden">
        <p className="text-sm text-theme-text-muted">{t('common.loading')}</p>
      </section>
    );
  }

  if (isTreeError) {
    return (
      <section className="h-full w-full flex items-center justify-center overflow-y-auto overflow-x-hidden">
        <p className="text-sm text-theme-text-muted">{t('materials.loadError')}</p>
      </section>
    );
  }

  return (
    <section className="h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="flex h-full w-full flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:gap-6 lg:flex-row">
        <button
          type="button"
          aria-controls={MOBILE_SIDEBAR_ID}
          aria-expanded={sidebarOpen}
          onClick={openMobileSidebar}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-card border border-theme-border text-sm text-theme-text-secondary hover:bg-theme-surface-elevated transition-colors"
        >
          <MenuIcon className="w-5 h-5" aria-hidden="true" />
          <span>{sidebarCopy.heading}</span>
        </button>

        <aside className="hidden lg:block relative w-[300px] xl:w-[340px] shrink-0">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
          <MaterialsSidebar {...sidebarProps} idPrefix="materials-sidebar-desktop" />
        </aside>

        {sidebarOpen && (
          <>
            <button
              type="button"
              aria-label={closeSidebarLabel}
              className="lg:hidden fixed inset-0 bg-theme-background/60 backdrop-blur-sm z-40"
              onClick={closeMobileSidebar}
            />
            <aside
              ref={mobileSidebarRef}
              id={MOBILE_SIDEBAR_ID}
              role="dialog"
              aria-modal="true"
              aria-label={sidebarCopy.heading}
              className="lg:hidden fixed inset-y-0 left-0 w-[85%] max-w-[360px] z-50 p-4"
            >
              <div className="relative h-full">
                <button
                  ref={closeSidebarButtonRef}
                  type="button"
                  aria-label={closeSidebarLabel}
                  onClick={closeMobileSidebar}
                  className="absolute -right-12 top-2 w-10 h-10 flex items-center justify-center rounded-full bg-theme-border text-theme-text-secondary"
                >
                  <CloseIcon className="w-5 h-5" aria-hidden="true" />
                </button>
                <MaterialsSidebar {...sidebarProps} idPrefix="materials-sidebar-mobile" />
              </div>
            </aside>
          </>
        )}

        <main className="relative flex-1 min-w-0">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
          <div className="relative h-full rounded-[28px] border border-theme-border bg-theme-surface shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur overflow-hidden">
            <div className="h-full overflow-hidden p-4 sm:p-5 lg:p-6">
              {isRoot ? (
                <MaterialsIntro />
              ) : !isArticle || !activeCategory || !activeSection || !activeMaterial ? (
                <EmptyState />
              ) : (
                <ArticleView
                  category={activeCategory}
                  section={activeSection}
                  material={activeMaterial}
                  tree={tree}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
