import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  loadMaterialsTree,
  materialKey,
  type MaterialMeta,
  type MaterialsCategory,
  type MaterialsSection,
  type MaterialWithContent,
} from '../materials/loader';
import { MarkdownArticle } from '../components/markdown/markdown-article';
import { updateSEO, resetSEO, generateMaterialSEO } from '../utils/seo';

export function Materials() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ '*': string }>();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';

  const tree = useMemo(() => loadMaterialsTree(lang), [lang]);
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

  const segments = (params['*'] || '').split('/').filter(Boolean);
  const [activeCategoryId, activeSectionId, activeSlug] = segments;
  const isRoot = segments.length === 0;

  const firstCategory = tree.categories[0];
  const effectiveCategoryId = activeCategoryId || firstCategory?.id;
  const activeCategory = tree.categories.find((c) => c.id === effectiveCategoryId) || firstCategory;
  const firstSection = activeCategory?.sections[0];
  const effectiveSectionId = activeSectionId || firstSection?.id;
  const activeSection = activeCategory?.sections.find((s) => s.id === effectiveSectionId) || firstSection;

  const fallbackMaterialSlug = activeSection?.materials[0]?.id.slug;
  const activeMaterialSlug = activeSlug || (isRoot ? undefined : fallbackMaterialSlug);

  const activeMaterial = activeCategory && activeSection && activeMaterialSlug
    ? findMaterial(tree, activeCategory.id, activeSection.id, activeMaterialSlug)
    : undefined;

  const activeMaterialKey = activeMaterial ? materialKey(activeMaterial.id) : null;
  const displayActiveCategoryId = isRoot ? undefined : activeCategory?.id;
  const displayActiveSectionId = isRoot ? undefined : activeSection?.id;
  const displayActiveMaterialKey = isRoot ? null : activeMaterialKey;

  useEffect(() => {
    if (isRoot) return;
    if (activeSlug) return;
    if (!activeCategory || !activeSection || !fallbackMaterialSlug) return;
    navigate(`/materials/${activeCategory.id}/${activeSection.id}/${fallbackMaterialSlug}`, { replace: true });
  }, [isRoot, activeSlug, activeCategory, activeSection, fallbackMaterialSlug, navigate]);

  useEffect(() => {
    if (isRoot) {
      updateSEO({
        title: 'Материалы — Eduard Gagite',
        description: 'Курсы и материалы по Redis, Docker и другим технологиям для backend-разработчиков.',
        ogTitle: 'Материалы — Eduard Gagite',
        ogDescription: 'Курсы и материалы по Redis, Docker и другим технологиям для backend-разработчиков.',
        ogUrl: 'https://eduardgagite.github.io/materials',
        canonical: 'https://eduardgagite.github.io/materials',
      });
      return () => {
        resetSEO();
      };
    }
  }, [isRoot]);

  const handleSelectMaterial = (category: MaterialsCategory, section: MaterialsSection, slug: string) => {
    navigate(`/materials/${category.id}/${section.id}/${slug}`);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (isRoot) return;
    const targetCategoryId = activeCategory?.id;
    if (!targetCategoryId) return;
    setCategoryOpen((prev) => {
      if (prev[targetCategoryId]) return prev;
      return { ...prev, [targetCategoryId]: true };
    });
  }, [activeCategory?.id, firstCategory?.id, isRoot]);

  useEffect(() => {
    if (isRoot) return;
    const targetSectionId = activeSection?.id;
    if (!targetSectionId) return;
    setSectionOpen((prev) => {
      if (prev[targetSectionId]) return prev;
      return { ...prev, [targetSectionId]: true };
    });
  }, [activeSection?.id]);

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

  return (
    <section className="h-full w-full overflow-hidden">
      <div className="flex h-full w-full flex-col gap-4 px-3 py-4 sm:px-4 sm:py-5 lg:gap-6 lg:flex-row">
        
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-card border border-theme-border text-sm text-theme-text-secondary hover:bg-theme-surface-elevated transition-colors"
        >
          <MenuIcon className="w-5 h-5" />
          <span>{sidebarCopy.heading}</span>
        </button>

        {/* Sidebar - Desktop */}
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

        {/* Sidebar - Mobile Drawer */}
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

        {/* Main content */}
        <main className="relative flex-1 min-w-0">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
          <div className="relative h-full rounded-[28px] border border-theme-border bg-theme-surface shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur overflow-hidden">
            <div className="h-full overflow-hidden p-4 sm:p-5 lg:p-6">
          {isRoot ? (
            <MaterialsIntro />
          ) : !activeCategory || !activeSection || !activeMaterial ? (
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

interface SidebarState {
  categories: Record<string, boolean>;
  sections: Record<string, boolean>;
}

interface SidebarCopy {
  heading: string;
  intro: string;
  searchLabel: string;
  searchPlaceholder: string;
  levelLabel: string;
  tagsLabel: string;
  resetLabel: string;
  emptyLabel: string;
  filtersTitle: string;
  structureTitle: string;
}

const SIDEBAR_STATE_KEY = 'materials.sidebarState';
const EMPTY_SIDEBAR_STATE: SidebarState = {
  categories: {},
  sections: {},
};

function readSidebarState(): SidebarState {
  if (typeof window === 'undefined') return EMPTY_SIDEBAR_STATE;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STATE_KEY);
    if (!raw) return EMPTY_SIDEBAR_STATE;
    const parsed = JSON.parse(raw) as Partial<SidebarState> | null;
    return {
      categories: parsed?.categories ?? {},
      sections: parsed?.sections ?? {},
    };
  } catch {
    return EMPTY_SIDEBAR_STATE;
  }
}

function writeSidebarState(state: SidebarState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(state));
  } catch {
    // noop
  }
}

interface FilterCriteria {
  query: string;
  tag: string | null;
  level: string | null;
}

interface FilterCategoriesArgs {
  categories: MaterialsCategory[];
  criteria: FilterCriteria;
}

interface FilterOptions {
  tags: string[];
  levels: string[];
}

interface FilterOptionsArgs {
  categories: MaterialsCategory[];
}

interface MaterialMatchArgs {
  material: MaterialMeta;
  criteria: FilterCriteria;
}

function filterCategoriesTree({ categories, criteria }: FilterCategoriesArgs): MaterialsCategory[] {
  const normalizedQuery = criteria.query.trim().toLowerCase();
  const hasFilters = !!normalizedQuery || !!criteria.tag || !!criteria.level;
  if (!hasFilters) return categories;

  const normalizedCriteria: FilterCriteria = {
    query: normalizedQuery,
    tag: criteria.tag,
    level: criteria.level,
  };

  return categories
    .map((category) => {
      const sections = category.sections
        .map((section) => {
          const materials = section.materials.filter((material) =>
            materialMatches({ material, criteria: normalizedCriteria }),
          );
          if (!materials.length) return null;
          return { ...section, materials };
        })
        .filter((section): section is MaterialsSection => !!section);
      if (!sections.length) return null;
      return { ...category, sections };
    })
    .filter((category): category is MaterialsCategory => !!category);
}

function deriveFilterOptions({ categories }: FilterOptionsArgs): FilterOptions {
  const tags = new Set<string>();
  const levels = new Set<string>();

  categories.forEach((category) => {
    category.sections.forEach((section) => {
      section.materials.forEach((material) => {
        material.tags?.forEach((tag) => {
          if (tag) tags.add(tag);
        });
        if (material.level) levels.add(material.level);
      });
    });
  });

  return {
    tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
    levels: Array.from(levels).sort((a, b) => a.localeCompare(b)),
  };
}

function materialMatches({ material, criteria }: MaterialMatchArgs): boolean {
  if (criteria.level && material.level !== criteria.level) return false;
  if (criteria.tag && !material.tags?.includes(criteria.tag)) return false;
  if (!criteria.query) return true;
  const haystack = `${material.title} ${material.subtitle || ''}`.toLowerCase();
  return haystack.includes(criteria.query);
}

function findMaterial(tree: ReturnType<typeof loadMaterialsTree>, categoryId: string, sectionId: string, slug: string) {
  const key = materialKey({ category: categoryId, section: sectionId, slug, lang: 'ru' });
  return tree.byId[key];
}

interface MaterialsSidebarProps {
  copy: SidebarCopy;
  filterOptions: FilterOptions;
  searchQuery: string;
  selectedLevel: string | null;
  selectedTag: string | null;
  onSearchChange: (value: string) => void;
  onSelectLevel: (value: string | null) => void;
  onSelectTag: (value: string | null) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  categories: MaterialsCategory[];
  categoryOpen: Record<string, boolean>;
  sectionOpen: Record<string, boolean>;
  activeCategoryId?: string;
  activeSectionId?: string;
  activeMaterialKey?: string | null;
  onToggleCategory: (categoryId: string) => void;
  onToggleSection: (sectionId: string) => void;
  onSelectMaterial: (category: MaterialsCategory, section: MaterialsSection, slug: string) => void;
}

function MaterialsSidebar({
  copy,
  filterOptions,
  searchQuery,
  selectedLevel,
  selectedTag,
  onSearchChange,
  onSelectLevel,
  onSelectTag,
  onResetFilters,
  hasActiveFilters,
  categories,
  categoryOpen,
  sectionOpen,
  activeCategoryId,
  activeSectionId,
  activeMaterialKey,
  onToggleCategory,
  onToggleSection,
  onSelectMaterial,
}: MaterialsSidebarProps) {
  return (
    <div className="relative h-full rounded-[28px] border border-theme-border bg-theme-surface shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-theme-border">
        <p className="text-xs uppercase tracking-widest text-theme-text-muted font-medium">{copy.heading}</p>
        <p className="mt-2 text-sm leading-relaxed text-theme-text-subtle">{copy.intro}</p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-theme-border space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-theme-text-muted">{copy.filtersTitle}</p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
              className="text-[11px] font-medium text-theme-accent hover:text-theme-accent-secondary transition-colors"
          >
            {copy.resetLabel}
          </button>
        )}
      </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-surface-elevated border border-theme-border focus-within:border-theme-accent/50 focus-within:bg-theme-card transition-all">
          <SearchIcon className="w-4 h-4 text-theme-text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-theme-text placeholder:text-theme-text-faint focus:outline-none"
          />
        </div>

        {/* Level filters */}
        {filterOptions.levels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.levels.map((level) => (
              <FilterChip
                key={level}
                label={level}
                isActive={selectedLevel === level}
                onClick={() => onSelectLevel(selectedLevel === level ? null : level)}
              />
            ))}
        </div>
      )}

        {/* Tag filters */}
        {filterOptions.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scroll-elegant">
            {filterOptions.tags.map((tag) => (
              <FilterChip
                key={tag}
                label={tag}
                isActive={selectedTag === tag}
                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
              />
            ))}
        </div>
      )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-4 scroll-elegant">
        <p className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-3">{copy.structureTitle}</p>
        {categories.length === 0 ? (
          <p className="text-sm text-theme-text-muted">{copy.emptyLabel}</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => {
              const isCategoryOpen = !!categoryOpen[category.id];
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl bg-theme-card border border-theme-border hover:bg-theme-card hover:border-theme-border-hover transition-all text-left"
                  >
                    <span className="text-sm font-medium text-theme-text truncate">{category.title}</span>
                    <ChevronIcon className={`w-4 h-4 text-theme-text-muted transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isCategoryOpen && (
                    <ul className="mt-2 ml-3 space-y-1.5 border-l border-theme-border pl-3">
                      {category.sections.map((section, sectionIdx) => {
                        const isSectionActive = category.id === activeCategoryId && section.id === activeSectionId;
                          const isSectionOpen = !!sectionOpen[section.id];
                        
                          return (
                            <li key={section.id}>
                              <button
                                type="button"
                                onClick={() => onToggleSection(section.id)}
                              className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                                  isSectionActive
                                  ? 'bg-theme-accent/20 border border-theme-accent/30 text-theme-text'
                                  : 'hover:bg-theme-surface-elevated text-theme-text-secondary hover:text-theme-text'
                                }`}
                              >
                              <span className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-mono text-theme-text-muted bg-theme-card px-1.5 py-0.5 rounded">
                                  {sectionIdx + 1}
                                  </span>
                                <span className="text-[13px] truncate">{section.title}</span>
                                </span>
                              <ChevronIcon className={`w-3.5 h-3.5 text-theme-text-muted shrink-0 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
                              </button>
                            
                              {isSectionOpen && section.materials.length > 0 && (
                              <ul className="mt-1.5 ml-2 space-y-0.5">
                                {section.materials.map((material, matIdx) => {
                                    const key = materialKey(material.id);
                                  const isActive = activeMaterialKey === key;
                                  
                                    return (
                                      <li key={key}>
                                        <button
                                          type="button"
                                          onClick={() => onSelectMaterial(category, section, material.id.slug)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-all ${
                                          isActive
                                            ? 'bg-theme-accent/25 text-theme-text'
                                            : 'text-theme-text-subtle hover:bg-theme-surface-elevated hover:text-theme-text'
                                          }`}
                                        >
                                          <span className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono text-theme-text-faint">
                                            {sectionIdx + 1}.{matIdx + 1}
                                            </span>
                                            <span className="truncate">{material.title}</span>
                                          </span>
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
        isActive
          ? 'bg-theme-accent/25 text-theme-accent border border-theme-accent/40'
          : 'bg-theme-surface-elevated text-theme-text-subtle border border-theme-border hover:bg-theme-card hover:text-theme-text'
      }`}
    >
      {label}
    </button>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" {...props}>
      <circle cx="9" cy="9" r="5.5" strokeWidth="1.5" />
      <path d="m14.5 14.5 3 3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" {...props}>
      <path d="m5 8 5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-theme-text-muted">Материалы пока не найдены.</p>
    </div>
  );
}

function MaterialsIntro() {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto scroll-elegant">
      <h1 className="text-2xl font-bold text-theme-text">{t('materials.introTitle')}</h1>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-theme-text-secondary">
        <p>{t('materials.introP1')}</p>
        <p>{t('materials.introP2')}</p>
        <p>{t('materials.introP3')}</p>
      </div>
      
      <div className="mt-6 p-4 rounded-xl bg-theme-surface-elevated border border-theme-border">
        <p className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-3">{t('materials.philosophyTitle')}</p>
        <ul className="space-y-2 font-mono text-[13px] text-theme-text-subtle">
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy3')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

interface ArticleViewProps {
  category: MaterialsCategory;
  section: MaterialsSection;
  material: MaterialWithContent;
  tree: ReturnType<typeof loadMaterialsTree>;
}

function ArticleView({ category, section, material, tree }: ArticleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const siblings = section.materials;
  const currentKey = materialKey(material.id);
  const index = siblings.findIndex((m) => materialKey(m.id) === currentKey);
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

  const goToMaterial = useCallback(
    (target?: MaterialMeta) => {
      if (!target) return;
      navigate(`/materials/${target.id.category}/${target.id.section}/${target.id.slug}`);
    },
    [navigate],
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
      {/* Header */}
      <header className="shrink-0 pb-4 border-b border-theme-border">
        <p className="text-[11px] uppercase tracking-widest text-theme-text-muted">
          {category.title} → {section.title}
        </p>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-theme-text leading-tight">{material.title}</h1>
        {material.subtitle && (
          <p className="mt-2 text-sm text-theme-text-subtle">{material.subtitle}</p>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-4 scroll-elegant">
        <MarkdownArticle content={material.content} materialPath={material.path} />
      </div>

      {/* Footer navigation */}
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
