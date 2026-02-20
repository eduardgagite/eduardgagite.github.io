import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  loadMaterialsTree,
  materialKey,
  type MaterialMeta,
  type MaterialsCategory,
  type MaterialsSection,
  type MaterialsTree,
} from '../materials/loader';
import { buildPageSeoUrl, resetSEO, updateSEO } from '../utils/seo';
import { readLastMaterialsPath, writeLastMaterialsPath } from '../utils/materials-location';
import { withLang } from '../i18n/url';
import { ArticleView } from '../features/materials/article-view';
import { deriveFilterOptions, filterCategoriesTree } from '../features/materials/filters';
import { EmptyState, MaterialsIntro } from '../features/materials/intro';
import { readSidebarState, writeSidebarState } from '../features/materials/sidebar-state';
import { CloseIcon, MaterialsSidebar, MenuIcon } from '../features/materials/sidebar';
import type { SidebarCopy, SidebarState } from '../features/materials/types';
import { NotFound } from './not-found';

type MaterialsRouteState =
  | { type: 'root' }
  | { type: 'redirect'; path: string }
  | { type: 'article'; category: MaterialsCategory; section: MaterialsSection; material: MaterialMeta }
  | { type: 'not-found' };

type MaterialsTreeState =
  | { status: 'loading'; tree: null }
  | { status: 'ready'; tree: MaterialsTree }
  | { status: 'error'; tree: null };

const EMPTY_TREE: MaterialsTree = {
  categories: [],
  byId: {},
  availableLanguages: {},
};

function resolveMaterialsRoute(segments: string[], tree: MaterialsTree): MaterialsRouteState {
  if (segments.length === 0) return { type: 'root' };
  if (segments.length > 3) return { type: 'not-found' };

  const [categoryId, sectionId, slug] = segments;
  const category = tree.categories.find((item) => item.id === categoryId);
  if (!category) return { type: 'not-found' };

  if (segments.length === 1) {
    const firstSection = category.sections[0];
    const firstMaterial = firstSection?.materials[0];
    if (!firstSection || !firstMaterial) return { type: 'not-found' };
    return {
      type: 'redirect',
      path: `/materials/${category.id}/${firstSection.id}/${firstMaterial.id.slug}`,
    };
  }

  const section = category.sections.find((item) => item.id === sectionId);
  if (!section) return { type: 'not-found' };

  if (segments.length === 2) {
    const firstMaterial = section.materials[0];
    if (!firstMaterial) return { type: 'not-found' };
    return {
      type: 'redirect',
      path: `/materials/${category.id}/${section.id}/${firstMaterial.id.slug}`,
    };
  }

  const material = section.materials.find((item) => item.id.slug === slug);
  if (!material) return { type: 'not-found' };

  return { type: 'article', category, section, material };
}

function parseStoredMaterialsPath(path: string): string[] | null {
  try {
    const url = new URL(path, 'https://eduardgagite.github.io');
    if (!url.pathname.startsWith('/materials')) return null;
    return url.pathname
      .slice('/materials'.length)
      .split('/')
      .filter(Boolean);
  } catch {
    return null;
  }
}

export function Materials() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ '*': string }>();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';
  const [treeState, setTreeState] = useState<MaterialsTreeState>({ status: 'loading', tree: null });

  useEffect(() => {
    let cancelled = false;
    setTreeState({ status: 'loading', tree: null });

    loadMaterialsTree(lang)
      .then((nextTree) => {
        if (cancelled) return;
        setTreeState({ status: 'ready', tree: nextTree });
      })
      .catch(() => {
        if (cancelled) return;
        setTreeState({ status: 'error', tree: null });
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  const tree = treeState.tree ?? EMPTY_TREE;
  const isTreeReady = treeState.status === 'ready';
  const isTreeLoading = treeState.status === 'loading';
  const isTreeError = treeState.status === 'error';
  const sidebarState = useMemo<SidebarState>(() => readSidebarState(), []);

  const [categoryOpen, setCategoryOpen] = useState<Record<string, boolean>>(sidebarState.categories);
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(sidebarState.sections);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filterOptions = useMemo(
    () => deriveFilterOptions({ categories: tree.categories }),
    [tree],
  );

  const filteredCategories = useMemo(
    () =>
      filterCategoriesTree({
        categories: tree.categories,
        criteria: { query: searchQuery, tag: selectedTag, level: selectedLevel },
      }),
    [tree, searchQuery, selectedTag, selectedLevel],
  );

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

  useEffect(() => {
    if (selectedTag && !filterOptions.tags.includes(selectedTag)) setSelectedTag(null);
  }, [filterOptions.tags, selectedTag]);

  useEffect(() => {
    if (selectedLevel && !filterOptions.levels.includes(selectedLevel)) setSelectedLevel(null);
  }, [filterOptions.levels, selectedLevel]);

  const hasActiveFilters = searchQuery.trim().length > 0 || !!selectedTag || !!selectedLevel;
  const sidebarCategories = filteredCategories;

  const segments = useMemo(() => (params['*'] || '').split('/').filter(Boolean), [params['*']]);
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

  useEffect(() => {
    if (!isArticle) return;
    const targetCategoryId = activeCategory?.id;
    if (!targetCategoryId) return;
    setCategoryOpen((prev) => {
      if (prev[targetCategoryId]) return prev;
      return { ...prev, [targetCategoryId]: true };
    });
  }, [activeCategory?.id, isArticle]);

  useEffect(() => {
    if (!isArticle) return;
    const targetSectionId = activeSection?.id;
    if (!targetSectionId) return;
    setSectionOpen((prev) => {
      if (prev[targetSectionId]) return prev;
      return { ...prev, [targetSectionId]: true };
    });
  }, [activeSection?.id, isArticle]);

  useEffect(() => {
    writeSidebarState({ categories: categoryOpen, sections: sectionOpen });
  }, [categoryOpen, sectionOpen]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTag(null);
    setSelectedLevel(null);
  };

  const toggleCategory = (categoryId: string) => {
    setCategoryOpen((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const toggleSection = (sectionId: string) => {
    setSectionOpen((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-card border border-theme-border text-sm text-theme-text-secondary hover:bg-theme-surface-elevated transition-colors"
        >
          <MenuIcon className="w-5 h-5" />
          <span>{sidebarCopy.heading}</span>
        </button>

        <aside className="hidden lg:block relative w-[300px] xl:w-[340px] shrink-0">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
          <MaterialsSidebar
            copy={sidebarCopy}
            filterOptions={filterOptions}
            searchQuery={searchQuery}
            selectedLevel={selectedLevel}
            selectedTag={selectedTag}
            onSearchChange={setSearchQuery}
            onSelectLevel={setSelectedLevel}
            onSelectTag={setSelectedTag}
            onResetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            categories={sidebarCategories}
            categoryOpen={categoryOpen}
            sectionOpen={sectionOpen}
            activeCategoryId={displayActiveCategoryId}
            activeSectionId={displayActiveSectionId}
            activeMaterialKey={displayActiveMaterialKey}
            onToggleCategory={toggleCategory}
            onToggleSection={toggleSection}
            onSelectMaterial={handleSelectMaterial}
          />
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-theme-background/60 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="lg:hidden fixed inset-y-0 left-0 w-[85%] max-w-[360px] z-50 p-4">
              <div className="relative h-full">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="absolute -right-12 top-2 w-10 h-10 flex items-center justify-center rounded-full bg-theme-border text-theme-text-secondary"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
                <MaterialsSidebar
                  copy={sidebarCopy}
                  filterOptions={filterOptions}
                  searchQuery={searchQuery}
                  selectedLevel={selectedLevel}
                  selectedTag={selectedTag}
                  onSearchChange={setSearchQuery}
                  onSelectLevel={setSelectedLevel}
                  onSelectTag={setSelectedTag}
                  onResetFilters={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                  categories={sidebarCategories}
                  categoryOpen={categoryOpen}
                  sectionOpen={sectionOpen}
                  activeCategoryId={displayActiveCategoryId}
                  activeSectionId={displayActiveSectionId}
                  activeMaterialKey={displayActiveMaterialKey}
                  onToggleCategory={toggleCategory}
                  onToggleSection={toggleSection}
                  onSelectMaterial={handleSelectMaterial}
                />
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
