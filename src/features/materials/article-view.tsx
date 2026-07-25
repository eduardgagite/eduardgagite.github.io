import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { MaterialMeta, MaterialsCategory, MaterialsSection } from '../../materials/loader';
import { MarkdownArticle } from '../../components/markdown/markdown-article';
import type { ArticleHeading } from '../../components/markdown/article-metadata';
import { withLang } from '../../i18n/url';
import { buildMaterialRoutePath } from './article-navigation';
import { ArticleToc } from './toc';
import { RussianNotice, StateNote } from './state-note';
import { firstMaterialPath } from './landing';

interface ArticleViewProps {
  category: MaterialsCategory;
  section: MaterialsSection;
  material: MaterialMeta;
  otherCategories: MaterialsCategory[];
  lang: 'ru' | 'en';
  status: 'loading' | 'ready' | 'error';
  content: string;
  materialPath?: string;
  headings: ArticleHeading[];
  onRetry: () => void;
  previous?: MaterialMeta;
  next?: MaterialMeta;
}

export function ArticleView({
  category,
  section,
  material,
  otherCategories,
  lang,
  status,
  content,
  materialPath,
  headings,
  onRetry,
  previous,
  next,
}: ArticleViewProps) {
  const { t } = useTranslation();

  return (
    <article aria-labelledby="material-title" className="min-w-0">
      {/* Путь в титул-баре набран слагами, а здесь те же уровни словами. */}
      <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] text-white/50">
        <Link to={withLang(`/materials/${category.id}`, lang)} className="transition-colors hover:text-white/85">
          {category.title}
        </Link>
        <span aria-hidden className="text-white/25">
          /
        </span>
        <Link
          to={withLang(firstMaterialPath(category, section), lang)}
          className="transition-colors hover:text-white/85"
        >
          {section.title}
        </Link>
      </p>

      <h1
        id="material-title"
        tabIndex={-1}
        className="mt-2 max-w-[26ch] text-2xl font-semibold leading-tight tracking-tight text-theme-text focus:outline-none sm:text-[1.9rem]"
      >
        {material.title}
      </h1>

      {material.subtitle && <p className="mt-2 max-w-[56ch] text-sm text-white/55">{material.subtitle}</p>}
      <RussianNotice lang={lang} className="mt-3 max-w-[56ch]" />
      <hr className="mt-6 border-white/[0.09]" />

      {status === 'ready' && headings.length >= 6 && (
        <ArticleToc variant="inline" headings={headings} className="xl:hidden" />
      )}

      <div className="mt-7 w-full max-w-[40rem]" aria-busy={status === 'loading'}>
        {status === 'loading' && <StateNote state="loading" />}
        {status === 'error' && <StateNote state="error" onRetry={onRetry} />}
        {status === 'ready' && <MarkdownArticle content={content} materialPath={materialPath} />}
      </div>

      <nav aria-label={t('nav.materials')} className="mt-12 w-full max-w-[40rem] border-t border-white/[0.09] pt-6">
        {next && next.section !== section.id && (
          <p className="mb-4 font-mono text-[11.5px] text-white/45">
            {t('materials.sectionAhead', { title: next.sectionTitle })}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-6">
          {previous ? (
            <AdjacentMaterialLink material={previous} direction="prev" currentSectionId={section.id} lang={lang} />
          ) : (
            <span aria-hidden />
          )}
          {next && <AdjacentMaterialLink material={next} direction="next" currentSectionId={section.id} lang={lang} />}
        </div>
        {!next && otherCategories.length > 0 && (
          <p className="mt-6 max-w-[56ch] text-[14px] leading-relaxed text-white/55">
            {t('materials.courseEnd')}{' '}
            {otherCategories.map((item, index) => (
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
      </nav>
    </article>
  );
}

interface AdjacentMaterialLinkProps {
  material: MaterialMeta;
  direction: 'prev' | 'next';
  currentSectionId: string;
  lang: 'ru' | 'en';
}

function AdjacentMaterialLink({ material, direction, currentSectionId, lang }: AdjacentMaterialLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      to={withLang(buildMaterialRoutePath(material), lang)}
      aria-label={`${t(direction === 'prev' ? 'materials.prevArticle' : 'materials.nextArticle')}: ${material.title}`}
      className={`group flex max-w-[48%] flex-col gap-1 ${
        direction === 'next' ? 'ml-auto items-end text-right' : 'items-start'
      }`}
    >
      <span aria-hidden className="font-mono text-[11px] text-white/45">
        {direction === 'prev' ? '[ prev' : 'next ]'}
      </span>
      <span className="text-[15px] leading-snug text-white/70 transition-colors group-hover:text-white">
        {direction === 'prev' ? `← ${material.title}` : `${material.title} →`}
      </span>
      {material.section !== currentSectionId && (
        <span className="font-mono text-[11px] text-white/45">{material.sectionTitle}</span>
      )}
    </Link>
  );
}
