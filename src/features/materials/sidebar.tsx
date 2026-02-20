import type { SVGProps } from 'react';
import { materialKey, type MaterialsCategory, type MaterialsSection } from '../../materials/loader';
import type { FilterOptions, SidebarCopy } from './types';

export interface MaterialsSidebarProps {
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

export function MaterialsSidebar({
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
      <div className="p-4 border-b border-theme-border">
        <p className="text-xs uppercase tracking-widest text-theme-text-muted font-medium">{copy.heading}</p>
        <p className="mt-2 text-sm leading-relaxed text-theme-text-subtle">{copy.intro}</p>
      </div>

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

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-theme-surface-elevated border border-theme-border focus-within:border-theme-accent/50 focus-within:bg-theme-card transition-all">
          <SearchIcon className="w-4 h-4 text-theme-text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="flex-1 bg-transparent text-sm text-theme-text placeholder:text-theme-text-faint focus:outline-none"
          />
        </div>

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

      <div className="flex-1 overflow-y-auto p-4 scroll-elegant">
        <p className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-3">{copy.structureTitle}</p>
        {categories.length === 0 ? (
          <p className="text-sm text-theme-text-muted">{copy.emptyLabel}</p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => {
              const isCategoryOpen = !!categoryOpen[category.id];
              const isCategoryActive = category.id === activeCategoryId;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all text-left relative overflow-hidden ${
                      isCategoryActive
                        ? 'text-theme-text shadow-[0_0_16px_rgba(31,111,235,0.2)]'
                        : 'bg-theme-card border-theme-border hover:bg-theme-card hover:border-theme-border-hover'
                    }`}
                    style={isCategoryActive ? {
                      background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.25) 0%, rgba(31, 111, 235, 0.15) 50%, rgba(31, 111, 235, 0.08) 100%)',
                      border: '1px solid rgba(31, 111, 235, 0.2)',
                    } : undefined}
                  >
                    {isCategoryActive && (
                      <span
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: 'radial-gradient(circle at left center, rgba(31, 111, 235, 0.4), transparent 70%)',
                        }}
                      />
                    )}
                    <span className={`text-sm truncate relative z-10 ${isCategoryActive ? 'font-semibold' : 'font-medium'}`}>
                      {category.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0 relative z-10">
                      <ChevronIcon className={`w-4 h-4 text-theme-text-muted transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </div>
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
                              className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all relative overflow-hidden ${
                                isSectionActive
                                  ? 'text-theme-text shadow-[0_0_16px_rgba(31,111,235,0.2)]'
                                  : 'hover:bg-theme-surface-elevated text-theme-text-secondary hover:text-theme-text'
                              }`}
                              style={isSectionActive ? {
                                background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.25) 0%, rgba(31, 111, 235, 0.15) 50%, rgba(31, 111, 235, 0.08) 100%)',
                                border: '1px solid rgba(31, 111, 235, 0.2)',
                              } : undefined}
                            >
                              {isSectionActive && (
                                <span
                                  className="absolute inset-0 opacity-30"
                                  style={{
                                    background: 'radial-gradient(circle at left center, rgba(31, 111, 235, 0.4), transparent 70%)',
                                  }}
                                />
                              )}
                              <span className="flex items-center gap-2 min-w-0 relative z-10">
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  isSectionActive
                                    ? 'text-theme-primary bg-theme-primary/20 font-semibold'
                                    : 'text-theme-text-muted bg-theme-card'
                                }`}>
                                  {sectionIdx + 1}
                                </span>
                                <span className={`text-[13px] truncate ${isSectionActive ? 'font-semibold' : ''}`}>
                                  {section.title}
                                </span>
                              </span>
                              <ChevronIcon className={`w-3.5 h-3.5 text-theme-text-muted shrink-0 transition-transform ${isSectionOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSectionOpen && section.materials.length > 0 && (
                              <ul className="mt-1.5 ml-2 space-y-0.5">
                                {section.materials.map((material, materialIdx) => {
                                  const key = materialKey(material.id);
                                  const isActive = activeMaterialKey === key;

                                  return (
                                    <li key={key}>
                                      <button
                                        type="button"
                                        onClick={() => onSelectMaterial(category, section, material.id.slug)}
                                        className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-all relative overflow-hidden ${
                                          isActive
                                            ? 'text-theme-text shadow-[0_0_12px_rgba(31,111,235,0.15)]'
                                            : 'text-theme-text-subtle hover:bg-theme-surface-elevated hover:text-theme-text'
                                        }`}
                                        style={isActive ? {
                                          background: 'linear-gradient(135deg, rgba(31, 111, 235, 0.25) 0%, rgba(31, 111, 235, 0.15) 50%, rgba(31, 111, 235, 0.08) 100%)',
                                          border: '1px solid rgba(31, 111, 235, 0.2)',
                                        } : undefined}
                                      >
                                        {isActive && (
                                          <span
                                            className="absolute inset-0 opacity-30"
                                            style={{
                                              background: 'radial-gradient(circle at left center, rgba(31, 111, 235, 0.4), transparent 70%)',
                                            }}
                                          />
                                        )}
                                        <span className="flex items-center gap-2 relative z-10">
                                          <span className={`text-[10px] font-mono ${
                                            isActive ? 'text-theme-primary font-semibold' : 'text-theme-text-faint'
                                          }`}>
                                            {sectionIdx + 1}.{materialIdx + 1}
                                          </span>
                                          <span className={`truncate relative z-10 ${isActive ? 'font-semibold' : ''}`}>
                                            {material.title}
                                          </span>
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

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
    </svg>
  );
}
