import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { loadMaterialsTree, materialKey, type MaterialMeta, type MaterialsCategory, type MaterialsSection } from '../materials/loader';
import { MarkdownArticle, assignHeadingSlug } from '../components/markdown/markdown-article';

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

  const handleSelectMaterial = (category: MaterialsCategory, section: MaterialsSection, slug: string) => {
    navigate(`/materials/${category.id}/${section.id}/${slug}`);
  };

  useEffect(() => {
    const targetCategoryId = activeCategory?.id || (isRoot ? firstCategory?.id : undefined);
    if (!targetCategoryId) return;
    setCategoryOpen((prev) => {
      if (prev[targetCategoryId]) return prev;
      return { ...prev, [targetCategoryId]: true };
    });
  }, [activeCategory?.id, firstCategory?.id, isRoot]);

  useEffect(() => {
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
      <div className="flex h-full w-full flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6 sm:gap-6 lg:gap-8 md:flex-row">
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

        <MainSurface>
            {isRoot ? (
              <MaterialsIntro />
          ) : !activeCategory || !activeSection || !activeMaterial ? (
              <EmptyState />
            ) : (
              <ArticleView
                category={activeCategory}
                section={activeSection}
                articleKey={materialKey(activeMaterial.id)}
                lang={lang}
              />
            )}
        </MainSurface>
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

const PANEL_GLOW_CLASS =
  'pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl';
const PANEL_BASE_CLASS =
  'relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025] shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur';

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

interface MainSurfaceProps {
  children: ReactNode;
}

function MainSurface({ children }: MainSurfaceProps) {
  return (
    <div className="relative flex h-full min-h-[520px] flex-1 md:min-h-[620px]">
      <div className={PANEL_GLOW_CLASS} aria-hidden="true" />
      <div className={`${PANEL_BASE_CLASS} flex-1`}>
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
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
    <aside className="relative w-full shrink-0 md:w-[320px]">
      <div className={PANEL_GLOW_CLASS} aria-hidden="true" />
      <div className={`${PANEL_BASE_CLASS} gap-4 p-4`}>
        <SidebarHeader copy={copy} />
        <SidebarFilters
          copy={copy}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filterOptions={filterOptions}
          selectedLevel={selectedLevel}
          selectedTag={selectedTag}
          onSelectLevel={onSelectLevel}
          onSelectTag={onSelectTag}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={onResetFilters}
        />
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <SidebarTree
          copy={copy}
          categories={categories}
          categoryOpen={categoryOpen}
          sectionOpen={sectionOpen}
          activeCategoryId={activeCategoryId}
          activeSectionId={activeSectionId}
          activeMaterialKey={activeMaterialKey}
          onToggleCategory={onToggleCategory}
          onToggleSection={onToggleSection}
          onSelectMaterial={onSelectMaterial}
        />
      </div>
    </aside>
  );
}

interface SidebarHeaderProps {
  copy: SidebarCopy;
}

function SidebarHeader({ copy }: SidebarHeaderProps) {
  return (
    <header className="space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">{copy.heading}</p>
      <p className="text-sm leading-5 text-white/80">{copy.intro}</p>
    </header>
  );
}

interface SidebarFiltersProps {
  copy: SidebarCopy;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterOptions: FilterOptions;
  selectedLevel: string | null;
  selectedTag: string | null;
  onSelectLevel: (value: string | null) => void;
  onSelectTag: (value: string | null) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

function SidebarFilters({
  copy,
  searchQuery,
  onSearchChange,
  filterOptions,
  selectedLevel,
  selectedTag,
  onSelectLevel,
  onSelectTag,
  hasActiveFilters,
  onResetFilters,
}: SidebarFiltersProps) {
  const showLevels = filterOptions.levels.length > 0;
  const showTags = filterOptions.tags.length > 0;

  return (
    <section className="space-y-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
          {copy.filtersTitle}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-medium text-primary transition hover:text-primary/80"
          >
            {copy.resetLabel}
          </button>
        )}
      </div>

      <label className="block text-xs text-white/70">
        {copy.searchLabel}
        <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-2 transition focus-within:border-primary/60 focus-within:bg-white/[0.04]">
          <SearchIcon className="h-4 w-4 flex-shrink-0 text-white/45" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>
      </label>

      {showLevels && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {copy.levelLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {filterOptions.levels.map((level) => (
              <FilterChip
                key={level}
                label={level}
                isActive={selectedLevel === level}
                onClick={() => onSelectLevel(selectedLevel === level ? null : level)}
              />
            ))}
          </div>
        </div>
      )}

      {showTags && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">
            {copy.tagsLabel}
          </p>
          <div className="mt-1.5 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1 scroll-elegant">
            {filterOptions.tags.map((tag) => (
              <FilterChip
                key={tag}
                label={tag}
                isActive={selectedTag === tag}
                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface SidebarTreeProps {
  copy: SidebarCopy;
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

function SidebarTree({
  copy,
  categories,
  categoryOpen,
  sectionOpen,
  activeCategoryId,
  activeSectionId,
  activeMaterialKey,
  onToggleCategory,
  onToggleSection,
  onSelectMaterial,
}: SidebarTreeProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/55">
        {copy.structureTitle}
      </p>
      <div className="mt-2 flex-1 overflow-y-auto pr-2 scroll-elegant">
        {categories.length === 0 ? (
          <p className="text-xs text-white/60">{copy.emptyLabel}</p>
        ) : (
          <ul className="space-y-1">
            {categories.map((category) => {
              const isCategoryOpen = !!categoryOpen[category.id];
              return (
                <li key={category.id} className="rounded-xl border border-white/5 bg-white/[0.01]">
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    aria-expanded={isCategoryOpen}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] leading-5 transition hover:bg-white/[0.04]"
                  >
                    <span className="truncate">{category.title}</span>
                    <ChevronIcon
                      className={`h-3.5 w-3.5 text-white/50 transition-transform ${isCategoryOpen ? 'rotate-180 text-primary/70' : ''}`}
                    />
                  </button>
                  {isCategoryOpen && (
                    <div className="border-t border-white/5 px-2.5 py-1.5">
                      <ul className="space-y-1">
                        {category.sections.map((section, sectionIndex) => {
                          const isSectionActive =
                            category.id === activeCategoryId && section.id === activeSectionId;
                          const isSectionOpen = !!sectionOpen[section.id];
                          return (
                            <li key={section.id}>
                              <button
                                type="button"
                                onClick={() => onToggleSection(section.id)}
                                aria-expanded={isSectionOpen}
                                aria-current={isSectionActive ? 'true' : undefined}
                                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-[12px] transition ${
                                  isSectionActive
                                    ? 'bg-primary/20 text-white'
                                    : 'text-white/80 hover:bg-white/5'
                                }`}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                                    {sectionIndex + 1}
                                  </span>
                                  <span className="truncate">{section.title}</span>
                                </span>
                                <ChevronIcon
                                  className={`h-3 w-3 text-white/45 transition-transform ${isSectionOpen ? 'rotate-180 text-primary/70' : ''}`}
                                />
                              </button>
                              {isSectionOpen && section.materials.length > 0 && (
                                <ul className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                                  {section.materials.map((material, materialIndex) => {
                                    const key = materialKey(material.id);
                                    const isMaterialActive = activeMaterialKey === key;
                                    return (
                                      <li key={key}>
                                        <button
                                          type="button"
                                          onClick={() => onSelectMaterial(category, section, material.id.slug)}
                                          aria-current={isMaterialActive ? 'true' : undefined}
                                          className={`w-full rounded-md px-2 py-1 text-left text-[11px] transition ${
                                            isMaterialActive
                                              ? 'bg-primary/30 text-white'
                                              : 'text-white/70 hover:bg-white/5'
                                          }`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] text-white/50">
                                              {sectionIndex + 1}.{materialIndex + 1}
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
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
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
      aria-pressed={isActive}
      className={`rounded-full border px-3 py-1 text-[11px] transition ${
        isActive
          ? 'border-primary/70 bg-primary/25 text-white shadow-[0_0_12px_rgba(31,111,235,0.35)]'
          : 'border-white/15 text-white/75 hover:border-white/45 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden focusable="false" {...props}>
      <circle cx="9" cy="9" r="5.5" strokeWidth="1.5" />
      <path d="m14.5 14.5 3 3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden focusable="false" {...props}>
      <path d="m5 8 5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-white/70">
        Материалы пока не найдены.
      </p>
    </div>
  );
}

function MaterialsIntro() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';
  // preload tree in case we want counts or quick navigation later
  useMemo(() => loadMaterialsTree(lang), [lang]);

  return (
    <div className="scroll-elegant flex h-full flex-col overflow-y-auto">
      <h1 className="text-xl font-semibold">
        {t('materials.introTitle')}
      </h1>
      <div className="mt-3 space-y-2 text-sm leading-6 text-white/90">
        <p>{t('materials.introP1')}</p>
        <p>{t('materials.introP2')}</p>
        <p>{t('materials.introP3')}</p>
      </div>
      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          {t('materials.philosophyTitle')}
        </p>
        <ul className="mt-2 space-y-1 text-[11px] leading-5 text-white/85 font-mono">
          <li>{`// ${t('materials.philosophy1')}`}</li>
          <li>{`// ${t('materials.philosophy2')}`}</li>
          <li>{`// ${t('materials.philosophy3')}`}</li>
        </ul>
      </div>
    </div>
  );
}

interface ArticleViewProps {
  category: MaterialsCategory;
  section: MaterialsSection;
  articleKey: string;
  lang: 'ru' | 'en';
}

function ArticleView({ category, section, articleKey, lang }: ArticleViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tree = useMemo(() => loadMaterialsTree(lang), [lang]);
  const article = tree.byId[articleKey];

  if (!article) {
    return <EmptyState />;
  }

  const siblings = section.materials;
  const index = siblings.findIndex((m) => materialKey(m.id) === articleKey);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;

  const goToMaterial = useCallback(
    (target?: MaterialMeta) => {
      if (!target) return;
      navigate(`/materials/${target.id.category}/${target.id.section}/${target.id.slug}`);
    },
    [navigate],
  );

  const handleBackToSection = useCallback(() => {
    navigate(`/materials/${category.id}/${section.id}`);
  }, [navigate, category.id, section.id]);

  const handlePrev = useCallback(() => {
    goToMaterial(prev);
  }, [goToMaterial, prev]);

  const handleNext = useCallback(() => {
    goToMaterial(next);
  }, [goToMaterial, next]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;

      if (event.key === 'ArrowLeft') {
        if (!prev) return;
        event.preventDefault();
        handlePrev();
      } else if (event.key === 'ArrowRight') {
        if (!next) return;
        event.preventDefault();
        handleNext();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleBackToSection();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleBackToSection, handleNext, handlePrev, next, prev]);

  return (
    <article className="relative flex h-full flex-col overflow-hidden">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/70">
        <button
          type="button"
          onClick={handleBackToSection}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 transition hover:border-white/50 hover:text-white"
        >
          ← {t('materials.backToSection')}
        </button>
        <p className="text-[10px] text-white/50">
          {t('materials.keyboardHints')}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          {category.title} / {section.title}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight">{article.title}</h1>
        {article.subtitle && (
          <p className="mt-2 text-sm text-white/75">
            {article.subtitle}
          </p>
        )}
      </div>

      <div className="mt-4 flex-1 overflow-y-auto pr-1 scroll-elegant">
        <MarkdownArticle content={article.content} />
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleBackToSection}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] transition hover:border-white/60 hover:text-white"
          >
            ⤺ {t('materials.backToSection')}
          </button>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handlePrev}
              disabled={!prev}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition ${
                prev
                  ? 'border-white/25 text-white hover:border-white/60 hover:text-white'
                  : 'cursor-not-allowed border-white/5 text-white/30'
              }`}
            >
              ← {t('materials.prevArticle')}
              {prev && <span className="hidden sm:inline text-white/60">{prev.title}</span>}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!next}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition ${
                next
                  ? 'border-white/25 text-white hover:border-white/60 hover:text-white'
                  : 'cursor-not-allowed border-white/5 text-white/30'
              }`}
            >
              {t('materials.nextArticle')} →
              {next && <span className="hidden sm:inline text-white/60">{next.title}</span>}
            </button>
        </div>
        </div>
      </div>
    </article>
  );
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TocPanelProps {
  items: TocItem[];
  title: string;
  className?: string;
}

interface TocBuilderArgs {
  content: string;
}

function TocPanel({ items, title, className }: TocPanelProps) {
  if (!items.length) return null;
  return (
    <nav className={className} aria-label={title}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
        {title}
      </p>
      <ul className="mt-2 space-y-1 text-xs text-white/75">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ marginLeft: item.level === 3 ? '0.75rem' : 0 }}
          >
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1 transition hover:bg-white/5 hover:text-white"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function buildArticleToc({ content }: TocBuilderArgs): TocItem[] {
  if (!content) return [];
  const counts: Record<string, number> = {};

  return content.split('\n').reduce<TocItem[]>((acc, line) => {
    const match = line.match(/^(#{2,3})\s+(.*)/);
    if (!match) return acc;
    const level = match[1].length;
    const cleaned = stripFormatting(match[2]);
    if (!cleaned) return acc;
    const id = assignHeadingSlug({ value: cleaned, counts });
    acc.push({ id, title: cleaned, level });
    return acc;
  }, []);
}

function stripFormatting(value: string): string {
  return value
    .replace(/\[(.+?)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/[*_]/g, '')
    .trim();
}



