import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { materialKey, type MaterialsCategory } from '../../materials/loader';
import { withLang } from '../../i18n/url';
import { buildPageSeoUrl, resetSEO, updateSEO } from '../../utils/seo';
import { buildMaterialRoutePath } from './article-navigation';
import { materialFolio } from './numbering';
import { RussianNotice } from './state-note';

interface CourseViewProps {
  category: MaterialsCategory;
  categories: MaterialsCategory[];
  lang: 'ru' | 'en';
}

export function CourseView({ category, categories, lang }: CourseViewProps) {
  const { t } = useTranslation();
  const note = t(`materials.courseNote.${category.id}`, { defaultValue: '' });
  const others = categories.filter((item) => item.id !== category.id);

  useEffect(() => {
    const title = `${category.title} — ${t('nav.materials')} — Eduard Gagite`;
    const description = note || t('materials.lead');
    const url = buildPageSeoUrl({ path: `/materials/${category.id}`, lang });
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
  }, [category.id, category.title, lang, note, t]);

  return (
    <div>
      <h1 className="max-w-[24ch] text-2xl font-semibold leading-tight tracking-tight text-theme-text sm:text-[1.9rem]">
        {category.title}
      </h1>
      {note && <p className="mt-3 max-w-[58ch] text-[16px] leading-[1.7] text-white/65">{note}</p>}
      <RussianNotice lang={lang} className="mt-3 max-w-[56ch]" />

      <p className="mt-9 font-mono text-xs text-white/45">{t('materials.sectionsLabel')}</p>

      <ol className="mt-4 space-y-7">
        {category.sections.map((section) => (
          <li key={section.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4">
            <span aria-hidden className="pt-[3px] text-right font-mono text-[13px] tabular-nums text-white/30">
              {section.order}
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-white/85">{section.title}</h2>
              <ul className="mt-1.5 space-y-1">
                {section.materials.map((material) => (
                  <li key={materialKey(material.id)}>
                    <Link
                      to={withLang(buildMaterialRoutePath(material), lang)}
                      className="group flex gap-3 rounded-[3px] text-[13.5px] leading-snug text-white/60 transition-colors hover:text-white"
                    >
                      <span
                        aria-hidden
                        className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-white/35 transition-colors group-hover:text-theme-accent/70"
                      >
                        {materialFolio(section, material)}
                      </span>
                      <span className="min-w-0">{material.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      {others.length > 0 && (
        <p className="mt-12 max-w-[56ch] text-[14px] text-white/50">
          {t('materials.nearby')}{' '}
          {others.map((item, index) => (
            <span key={item.id}>
              {index > 0 && ', '}
              <Link
                to={withLang(`/materials/${item.id}`, lang)}
                className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
              >
                {item.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
