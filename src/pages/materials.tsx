import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { materialKey } from '../materials/loader';
import { extractArticleHeadings } from '../components/markdown/article-metadata';
import { buildPageSeoUrl, resetSEO, updateSEO } from '../utils/seo';
import {
  clearMaterialsBookmark,
  readMaterialsBookmarks,
  writeMaterialsBookmark,
  type MaterialsBookmarks,
} from '../utils/materials-location';
import { withLang } from '../i18n/url';
import { ArticleView } from '../features/materials/article-view';
import { CourseView } from '../features/materials/course-view';
import { Landing } from '../features/materials/landing';
import { MaterialsWindow } from '../features/materials/window';
import { MaterialsTree } from '../features/materials/tree';
import { SearchLine, SearchResults } from '../features/materials/search-line';
import { NotFoundNote, StateNote } from '../features/materials/state-note';
import { ArticleToc } from '../features/materials/toc';
import type { PathSegment } from '../features/materials/path-line';
import { buildMaterialRoutePath, getAdjacentCourseMaterials } from '../features/materials/article-navigation';
import { parseMaterialsSegments, resolveMaterialsRoute } from '../features/materials/route';
import { useArticleKeyboardNavigation } from '../features/materials/use-article-keyboard-navigation';
import { useMaterialContent } from '../features/materials/use-material-content';
import { useMaterialSeo } from '../features/materials/use-material-seo';
import { useMaterialsSearch } from '../features/materials/use-materials-search';
import { useMaterialsTree } from '../features/materials/use-materials-tree';
import { useReadingHistory } from '../features/materials/use-reading-history';
import { useTocActiveHeading } from '../features/materials/use-toc-active-heading';
import { useTreeState } from '../features/materials/use-tree-state';

export function Materials() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ '*': string }>();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';

  const scrollerRef = useRef<HTMLElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selectedRowRef = useRef<HTMLAnchorElement | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [bookmarks, setBookmarks] = useState<MaterialsBookmarks>(() => readMaterialsBookmarks({ lang }));

  const { tree, isTreeReady, isTreeLoading, isTreeError, reload: reloadTree } = useMaterialsTree(lang);
  const search = useMaterialsSearch({ categories: tree.categories });
  const { isRead, markRead } = useReadingHistory();

  useEffect(() => setBookmarks(readMaterialsBookmarks({ lang })), [lang]);

  const segments = useMemo(() => parseMaterialsSegments(params['*']), [params]);
  const routeState = useMemo(
    () => (isTreeReady ? resolveMaterialsRoute(segments, tree) : null),
    [isTreeReady, segments, tree],
  );

  useEffect(() => {
    if (routeState?.type !== 'redirect') return;
    navigate(withLang(routeState.path, lang), { replace: true });
  }, [lang, navigate, routeState]);

  const article = routeState?.type === 'article' ? routeState : null;
  const activeMaterialKey = article ? materialKey(article.material.id) : null;

  const content = useMaterialContent(article?.material ?? null);
  const articleContent = article && content.status === 'ready' ? content.material.content : '';
  const headings = useMemo(() => extractArticleHeadings(articleContent), [articleContent]);
  const activeHeading = useTocActiveHeading(headings, !!article && content.status === 'ready');

  const adjacent = useMemo(
    () => (article ? getAdjacentCourseMaterials(article.category, article.material) : { currentIndex: -1 }),
    [article],
  );

  const { isCategoryOpen, isSectionOpen, toggleCategory, toggleSection, treeScrollRef, activeRowRef } = useTreeState({
    categories: tree.categories,
    activeCategoryId: article?.category.id,
    activeSectionId: article?.section.id,
    activeMaterialKey,
    treeOpen,
  });

  useMaterialSeo({ material: article?.material ?? null, tree });

  useEffect(() => {
    if (routeState?.type !== 'root') return;
    const title = t('meta.materialsTitle');
    const description = t('meta.materialsDescription');
    const url = buildPageSeoUrl({ path: '/materials', lang });
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
    return () => resetSEO();
  }, [lang, routeState, t]);

  // Прочитанное и закладка на курс.
  useEffect(() => {
    if (!article || content.status !== 'ready') return;
    markRead(materialKey(article.material.id));
    writeMaterialsBookmark({
      lang,
      categoryId: article.category.id,
      path: buildMaterialRoutePath(article.material),
      title: article.material.title,
    });
    setBookmarks(readMaterialsBookmarks({ lang }));
  }, [article, content.status, lang, markRead]);

  // Слаг могли переименовать — битую закладку курса убираем.
  useEffect(() => {
    if (routeState?.type !== 'not-found') return;
    const categoryId = location.pathname.split('/')[2];
    if (!categoryId) return;
    clearMaterialsBookmark({ lang, categoryId });
    setBookmarks(readMaterialsBookmarks({ lang }));
  }, [lang, location.pathname, routeState]);

  const goTo = useCallback((path: string) => navigate(withLang(path, lang)), [lang, navigate]);
  // Ниже lg указатель скрыт через display:none, а .focus() в скрытом поле — тихий no-op,
  // поэтому сначала раскрываем указатель и только потом ставим фокус.
  const focusSearch = useCallback(() => {
    setTreeOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  useArticleKeyboardNavigation({
    hasPrevious: !!adjacent.previous,
    hasNext: !!adjacent.next,
    onPrevious: () => adjacent.previous && goTo(buildMaterialRoutePath(adjacent.previous)),
    onNext: () => adjacent.next && goTo(buildMaterialRoutePath(adjacent.next)),
    onFocusSearch: focusSearch,
  });

  // Обложка и страница курса: без фокуса внутри прокручиваемой секции стрелки и PageDown
  // не работают, пока не дойдёшь до неё табом.
  useEffect(() => {
    if (article) return;
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) {
      scrollerRef.current?.focus({ preventScroll: true });
    }
  }, [article]);

  // Порядок строгий: контент готов → анкор или верх → и только затем фокус на заголовок.
  useEffect(() => {
    if (!article || content.status !== 'ready') return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const hash = window.location.hash.slice(1);
    const target = hash ? document.getElementById(hash) : null;
    if (target) {
      scroller.scrollTop += target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 56;
    } else {
      scroller.scrollTo({ top: 0 });
    }

    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) {
      document.getElementById('material-title')?.focus({ preventScroll: true });
    }
  }, [activeMaterialKey, article, content.status]);

  useEffect(() => {
    if (!isLinkCopied) return;
    const timeout = window.setTimeout(() => setIsLinkCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [isLinkCopied]);

  useEffect(() => {
    selectedRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [search.selectedIndex]);

  const copyLink = useCallback(async () => {
    if (!article) return;
    const path = withLang(buildMaterialRoutePath(article.material), lang);
    // Вместе с хешем: иначе скопированный адрес расходится с адресной строкой браузера.
    const url = new URL(path + window.location.hash, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
    } catch {
      setIsLinkCopied(false);
    }
  }, [article, lang]);

  const closeTreeOnNavigate = useCallback(() => {
    setTreeOpen(false);
    search.clear();
  }, [search]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (search.query) search.clear();
      else searchRef.current?.blur();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      search.moveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      search.moveSelection(-1);
      return;
    }
    if (event.key === 'Enter' && search.selectedHit) {
      event.preventDefault();
      goTo(buildMaterialRoutePath(search.selectedHit.material));
      closeTreeOnNavigate();
    }
  };

  const pathSegments = useMemo<PathSegment[]>(() => {
    const root: PathSegment = { label: '~/materials', to: withLang('/materials', lang) };
    if (routeState?.type === 'category') return [root, { label: routeState.category.id }];
    if (article) {
      return [
        root,
        { label: article.category.id, to: withLang(`/materials/${article.category.id}`, lang) },
        { label: article.section.id },
        { label: `${article.material.id.slug}.md` },
      ];
    }
    return [{ label: '~/materials' }];
  }, [article, lang, routeState]);

  const treePane = (
    <>
      <div className="shrink-0 px-4 pb-2.5 pt-4">
        <SearchLine
          ref={searchRef}
          query={search.query}
          onChange={search.setQuery}
          onKeyDown={handleSearchKeyDown}
          onClear={search.clear}
        />
      </div>
      <div ref={treeScrollRef} className="scroll-elegant min-h-0 flex-1 overflow-y-auto px-2 pb-5">
        {isTreeLoading && <p className="px-2 font-mono text-[12px] text-white/45">{t('common.loading')}</p>}
        {isTreeError && <p className="px-2 font-mono text-[12px] text-white/45">{t('materials.loadError')}</p>}
        {isTreeReady &&
          (search.isSearching ? (
            <SearchResults
              hits={search.hits}
              query={search.query}
              lang={lang}
              selectedIndex={search.selectedIndex}
              selectedRowRef={selectedRowRef}
              onPick={closeTreeOnNavigate}
              onShowAll={search.clear}
            />
          ) : (
            <MaterialsTree
              categories={tree.categories}
              lang={lang}
              activeCategoryId={article?.category.id}
              activeSectionId={article?.section.id}
              activeMaterialKey={activeMaterialKey}
              isCategoryOpen={isCategoryOpen}
              isSectionOpen={isSectionOpen}
              onToggleCategory={toggleCategory}
              onToggleSection={toggleSection}
              onNavigate={closeTreeOnNavigate}
              isRead={isRead}
              activeRowRef={activeRowRef}
            />
          ))}
      </div>
    </>
  );

  const colophon = (
    <span className="text-white/45">
      {t('materials.colophon')}{' '}
      <a
        href="https://github.com/eduardgagite/eduardgagite.github.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-theme-accent"
      >
        github.com/eduardgagite ↗
      </a>
    </span>
  );

  let body: ReactNode;
  if (isTreeLoading) body = <StateNote state="loading" />;
  else if (isTreeError) body = <StateNote state="error" onRetry={reloadTree} />;
  else if (routeState?.type === 'root')
    body = <Landing categories={tree.categories} lang={lang} bookmarks={bookmarks} />;
  else if (routeState?.type === 'category')
    body = <CourseView category={routeState.category} categories={tree.categories} lang={lang} />;
  else if (routeState?.type === 'redirect')
    body = <p className="text-sm text-theme-text-muted">{t('common.loading')}</p>;
  else if (article)
    body = (
      <ArticleView
        category={article.category}
        section={article.section}
        material={article.material}
        otherCategories={tree.categories.filter((item) => item.id !== article.category.id)}
        lang={lang}
        status={content.status}
        content={articleContent}
        materialPath={content.status === 'ready' ? content.material.path : undefined}
        headings={headings}
        onRetry={content.reload}
        previous={adjacent.previous}
        next={adjacent.next}
      />
    );
  else body = <NotFoundNote lang={lang} />;

  return (
    <MaterialsWindow
      ref={scrollerRef}
      pathSegments={pathSegments}
      tree={treePane}
      rail={
        article && content.status === 'ready' && headings.length >= 2 ? (
          <ArticleToc variant="rail" headings={headings} active={activeHeading} />
        ) : undefined
      }
      statusLeft={
        article ? (
          <>
            <span className="text-white/55">{article.material.id.lang}</span>
            {content.status !== 'ready' && <span className="text-white/55">{content.status}</span>}
          </>
        ) : (
          colophon
        )
      }
      statusRight={
        article ? (
          <>
            <button
              type="button"
              onClick={copyLink}
              className="-mx-1.5 -my-2 px-1.5 py-2 font-mono text-[11px] text-white/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
            >
              <span aria-live="polite">{isLinkCopied ? t('materials.copyLinkSuccess') : t('materials.copyLink')}</span>
            </button>
            <button
              type="button"
              onClick={() => scrollerRef.current?.scrollTo({ top: 0 })}
              className="-mx-1.5 -my-2 px-1.5 py-2 font-mono text-[11px] text-white/55 transition-colors hover:text-white/80"
            >
              ↑ {t('materials.backToTop')}
            </button>
          </>
        ) : (
          <span className="text-white/55">{lang}</span>
        )
      }
      treeOpen={treeOpen}
      onToggleTree={() => setTreeOpen(!treeOpen)}
      announce={article?.material.title}
    >
      {body}
    </MaterialsWindow>
  );
}
