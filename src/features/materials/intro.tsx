import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { withLang } from '../../i18n/url';
import type { MaterialsCategory } from '../../materials/loader';

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-theme-text-muted">{t('materials.emptyState')}</p>
    </div>
  );
}

interface MaterialsIntroProps {
  categories: MaterialsCategory[];
  lang: 'ru' | 'en';
}

export function MaterialsIntro({ categories, lang }: MaterialsIntroProps) {
  const { t } = useTranslation();
  const sectionsCount = categories.reduce((total, category) => total + category.sections.length, 0);
  const materialsCount = categories.reduce(
    (total, category) => total + category.sections.reduce(
      (categoryTotal, section) => categoryTotal + section.materials.length,
      0,
    ),
    0,
  );
  const stats = [
    { value: categories.length, label: t('materials.statsCategories') },
    { value: sectionsCount, label: t('materials.statsSections') },
    { value: materialsCount, label: t('materials.statsMaterials') },
  ];

  return (
    <div className="h-full overflow-y-auto scroll-elegant">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-theme-accent">
        {t('materials.introEyebrow')}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-theme-text sm:text-3xl">{t('materials.introTitle')}</h1>
      <div className="mt-4 max-w-3xl space-y-3 text-[15px] leading-7 text-theme-text-secondary">
        <p>{t('materials.introP1')}</p>
        <p>{t('materials.introP2')}</p>
        <p>{t('materials.introP3')}</p>
      </div>

      {lang === 'en' && (
        <p className="mt-5 rounded-xl border border-theme-accent/20 bg-theme-accent/10 px-4 py-3 text-sm text-theme-text-secondary">
          {t('materials.russianContentNotice')}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-theme-border bg-theme-surface-elevated px-3 py-3 sm:px-4"
          >
            <dt className="text-[10px] uppercase tracking-wider text-theme-text-muted sm:text-xs">{stat.label}</dt>
            <dd className="mt-1 font-mono text-xl font-semibold text-theme-text sm:text-2xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8" aria-labelledby="materials-courses-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-theme-text-muted">
              {t('materials.coursesEyebrow')}
            </p>
            <h2 id="materials-courses-title" className="mt-1 text-xl font-semibold text-theme-text">
              {t('materials.coursesTitle')}
            </h2>
          </div>
          <span className="hidden text-xs text-theme-text-muted sm:block">{t('materials.chooseCourse')}</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {categories.map((category, index) => {
            const firstSection = category.sections[0];
            const firstMaterial = firstSection?.materials[0];
            const categoryMaterialsCount = category.sections.reduce(
              (total, section) => total + section.materials.length,
              0,
            );
            const coursePath = firstSection && firstMaterial
              ? withLang(
                `/materials/${category.id}/${firstSection.id}/${firstMaterial.id.slug}`,
                lang,
              )
              : withLang('/materials', lang);

            return (
              <Link
                key={category.id}
                to={coursePath}
                className="group relative overflow-hidden rounded-2xl border border-theme-border bg-theme-surface-elevated p-4 transition-all hover:-translate-y-0.5 hover:border-theme-border-hover hover:bg-theme-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-theme-primary/20 blur-3xl transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-xl border border-theme-border bg-theme-card font-mono text-xs font-semibold text-theme-accent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-theme-text-muted transition-transform group-hover:translate-x-1" aria-hidden="true">
                      →
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-theme-text">{category.title}</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-theme-text-muted">{t('materials.statsSections')}</dt>
                      <dd className="mt-0.5 font-mono text-theme-text-secondary">{category.sections.length}</dd>
                    </div>
                    <div>
                      <dt className="text-theme-text-muted">{t('materials.statsMaterials')}</dt>
                      <dd className="mt-0.5 font-mono text-theme-text-secondary">{categoryMaterialsCount}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs font-medium text-theme-accent">{t('materials.startCourse')}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-8 p-4 rounded-xl bg-theme-surface-elevated border border-theme-border">
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
