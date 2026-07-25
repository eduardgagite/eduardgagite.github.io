import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { materialKey, type MaterialsCategory, type MaterialsSection } from '../../materials/loader';
import { withLang } from '../../i18n/url';
import { buildMaterialRoutePath } from './article-navigation';
import { buildSectionStateKey } from './route';
import { materialFolio } from './numbering';

export interface MaterialsTreeProps {
  categories: MaterialsCategory[];
  lang: 'ru' | 'en';
  activeCategoryId?: string;
  activeSectionId?: string;
  activeMaterialKey?: string | null;
  isCategoryOpen: (categoryId: string) => boolean;
  isSectionOpen: (categoryId: string, sectionId: string) => boolean;
  onToggleCategory: (categoryId: string) => void;
  onToggleSection: (categoryId: string, sectionId: string) => void;
  onNavigate: () => void;
  isRead: (key: string) => boolean;
  activeRowRef: React.RefObject<HTMLAnchorElement>;
}

export function MaterialsTree({
  categories,
  lang,
  activeCategoryId,
  activeSectionId,
  activeMaterialKey,
  isCategoryOpen,
  isSectionOpen,
  onToggleCategory,
  onToggleSection,
  onNavigate,
  isRead,
  activeRowRef,
}: MaterialsTreeProps) {
  const { t } = useTranslation();

  return (
    <ul className="space-y-1">
      {categories.map((category) => {
        const open = isCategoryOpen(category.id);
        const panelId = `materials-tree-${category.id}`;
        const isActiveCategory = activeCategoryId === category.id;

        return (
          <li key={category.id}>
            <div className="group relative flex items-baseline gap-1.5 rounded-[3px] py-[5px] pl-2 pr-2 transition-colors hover:bg-white/[0.035]">
              {isActiveCategory && <span aria-hidden className="absolute inset-y-[3px] left-0 w-px bg-white/25" />}
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={`${open ? t('materials.collapse') : t('materials.expand')}: ${category.title}`}
                onClick={() => onToggleCategory(category.id)}
                className="-m-1 shrink-0 p-1 font-mono text-[10px] leading-none text-white/35 transition-colors hover:text-white/70"
              >
                <span aria-hidden>{open ? '▾' : '▸'}</span>
              </button>
              <Link
                to={withLang(`/materials/${category.id}`, lang)}
                onClick={onNavigate}
                className="min-w-0 truncate text-[13px] font-medium text-white/85 transition-colors hover:text-white"
              >
                {category.title}
              </Link>
              <span aria-hidden className="font-mono text-[11px] text-white/30">
                {category.id}/
              </span>
            </div>

            {open && (
              <ul id={panelId} className="mt-0.5 space-y-px pl-3">
                {category.sections.map((section) => (
                  <SectionRow
                    key={section.id}
                    category={category}
                    section={section}
                    lang={lang}
                    open={isSectionOpen(category.id, section.id)}
                    isActiveSection={isActiveCategory && activeSectionId === section.id}
                    activeMaterialKey={activeMaterialKey}
                    onToggle={() => onToggleSection(category.id, section.id)}
                    onNavigate={onNavigate}
                    isRead={isRead}
                    activeRowRef={activeRowRef}
                  />
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

interface SectionRowProps {
  category: MaterialsCategory;
  section: MaterialsSection;
  lang: 'ru' | 'en';
  open: boolean;
  isActiveSection: boolean;
  activeMaterialKey?: string | null;
  onToggle: () => void;
  onNavigate: () => void;
  isRead: (key: string) => boolean;
  activeRowRef: React.RefObject<HTMLAnchorElement>;
}

function SectionRow({
  category,
  section,
  lang,
  open,
  isActiveSection,
  activeMaterialKey,
  onToggle,
  onNavigate,
  isRead,
  activeRowRef,
}: SectionRowProps) {
  const { t } = useTranslation();
  const panelId = `materials-tree-${buildSectionStateKey(category.id, section.id)}`;

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${open ? t('materials.collapse') : t('materials.expand')}: ${section.title}`}
        onClick={onToggle}
        className="group relative flex w-full items-start gap-2 rounded-[3px] py-1 pl-2 pr-2 text-left transition-colors hover:bg-white/[0.035]"
      >
        {isActiveSection && <span aria-hidden className="absolute inset-y-[3px] left-0 w-px bg-white/25" />}
        <span aria-hidden className="w-2.5 shrink-0 pt-[3px] font-mono text-[9px] leading-none text-white/30">
          {open ? '▾' : '▸'}
        </span>
        <span
          aria-hidden
          className="w-4 shrink-0 pt-px text-right font-mono text-[10px] leading-[1.4] tabular-nums text-white/40"
        >
          {section.order}
        </span>
        <span className="text-[12.5px] leading-[1.4] text-white/70 transition-colors group-hover:text-white/90">
          {section.title}
        </span>
      </button>

      {open && (
        <ul id={panelId} className="mb-1 mt-px space-y-px pl-[1.15rem]">
          {section.materials.map((material) => {
            const key = materialKey(material.id);
            const isActive = activeMaterialKey === key;
            const read = isRead(key);

            return (
              <li key={key}>
                <Link
                  to={withLang(buildMaterialRoutePath(material), lang)}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  ref={isActive ? activeRowRef : undefined}
                  className="group relative flex items-start gap-2 rounded-[3px] py-1 pl-2 pr-2 transition-colors hover:bg-white/[0.035]"
                >
                  {isActive && <span aria-hidden className="absolute inset-y-[3px] left-0 w-[2px] bg-theme-primary" />}
                  <span
                    aria-hidden
                    className={`w-7 shrink-0 pt-px text-right font-mono text-[10px] leading-[1.45] tabular-nums ${
                      isActive ? 'text-theme-accent' : 'text-white/35'
                    }`}
                  >
                    {materialFolio(section, material)}
                  </span>
                  <span
                    className={`min-w-0 text-[12.5px] leading-[1.45] ${
                      isActive ? 'font-medium text-white' : read ? 'text-white/55' : 'text-white/75'
                    }`}
                  >
                    {material.title}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
