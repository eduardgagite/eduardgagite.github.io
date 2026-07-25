import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { MaterialsCategory, MaterialsSection } from '../../materials/loader';
import { withLang } from '../../i18n/url';
import { buildMaterialRoutePath } from './article-navigation';
import { Folio } from './folio';
import { RussianNotice } from './state-note';
import type { MaterialsBookmarks } from '../../utils/materials-location';

export function firstMaterialPath(category: MaterialsCategory, section?: MaterialsSection): string {
  const targetSection = section ?? category.sections[0];
  const material = targetSection?.materials[0];
  if (!targetSection || !material) return '/materials';
  return buildMaterialRoutePath(material);
}

interface LandingProps {
  categories: MaterialsCategory[];
  lang: 'ru' | 'en';
  bookmarks: MaterialsBookmarks;
}

export function Landing({ categories, lang, bookmarks }: LandingProps) {
  const { t } = useTranslation();
  const first = categories[0];
  const hasAnyBookmark = categories.some((category) => bookmarks[category.id]);

  return (
    <div>
      <h1 className="sr-only">{t('nav.materials')}</h1>

      <RussianNotice lang={lang} className="mb-5 max-w-[56ch]" />

      {!hasAnyBookmark && first && (
        <p className="font-mono text-[12px] text-white/45">
          {t('materials.startHere')}{' '}
          <Link
            to={withLang(firstMaterialPath(first), lang)}
            className="text-white/75 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-theme-accent"
          >
            {first.title} / {first.sections[0]?.title}
          </Link>
        </p>
      )}

      <div className={`space-y-11 ${!hasAnyBookmark && first ? 'mt-8' : ''}`}>
        {categories.map((category) => {
          const bookmark = bookmarks[category.id];

          return (
            <section key={category.id} aria-labelledby={`course-${category.id}`}>
              <Link
                to={withLang(`/materials/${category.id}`, lang)}
                className="group inline-flex flex-wrap items-baseline gap-x-3"
              >
                <h2
                  id={`course-${category.id}`}
                  className="text-lg font-semibold tracking-tight text-white/90 transition-colors group-hover:text-white sm:text-xl"
                >
                  {category.title}
                </h2>
                <span
                  aria-hidden
                  className="font-mono text-xs text-white/40 transition-colors group-hover:text-theme-accent/70"
                >
                  {category.id}/
                </span>
                <span
                  aria-hidden
                  className="shrink-0 -translate-x-1 font-mono text-base text-theme-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                >
                  →
                </span>
              </Link>

              {bookmark && (
                <p className="mt-2 font-mono text-[11.5px] text-white/45">
                  {t('materials.bookmark')}{' '}
                  <Link
                    to={withLang(bookmark.path, lang)}
                    className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-theme-accent"
                  >
                    {bookmark.title}
                  </Link>
                </p>
              )}

              <div className="relative mt-4 -mx-2">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-[3.4rem] hidden w-px bg-white/[0.07] sm:block"
                />
                <ul className="divide-y divide-white/[0.06]">
                  {category.sections.map((section) => (
                    <li key={section.id}>
                      <Link
                        to={withLang(firstMaterialPath(category, section), lang)}
                        className="group grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-6 rounded-md px-2 py-3 transition-colors hover:bg-white/[0.035] lg:grid-cols-[2.5rem_minmax(0,24ch)_minmax(0,1fr)]"
                      >
                        <Folio value={section.order} size="lg" />
                        <span className="min-w-0 text-[15px] leading-snug text-white/85 transition-colors group-hover:text-white">
                          {section.title}
                        </span>
                        <span className="hidden min-w-0 truncate text-[13px] text-white/50 lg:block">
                          {section.materials
                            .slice(0, 2)
                            .map((material) => material.title)
                            .join(', ')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
