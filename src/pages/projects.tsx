import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { NetworkBackground } from '../components/background/network-canvas';
import { MarkdownArticle } from '../components/markdown/markdown-article';
import { profileContent } from '../content/profile';
import { withLang } from '../i18n/url';
import {
  loadProjectContent,
  loadProjectsList,
  type ProjectMeta,
  type ProjectsList,
  type ProjectWithContent,
} from '../projects/loader';
import { buildPageSeoUrl, resetSEO, updateSEO } from '../utils/seo';
import { NotFound } from './not-found';

type LoadState = 'loading' | 'ready' | 'error';

const STATUS_TOKEN: Record<ProjectMeta['status'], string> = {
  production: 'prod',
  active: 'dev',
  done: 'done',
};

// Технологии, по которым нанимающая сторона сканирует список: набраны ярче остального стека.
const STACK_ACCENT = new Set(['Go', 'PostgreSQL', 'Swift', 'Proxmox']);

export function Projects() {
  const { i18n, t } = useTranslation();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';
  const params = useParams<{ slug?: string }>();
  const slug = params.slug;

  const [list, setList] = useState<ProjectsList | null>(null);
  const [listState, setListState] = useState<LoadState>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setListState('loading');
    loadProjectsList(lang)
      .then((value) => {
        if (cancelled) return;
        setList(value);
        setListState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setListState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [lang, reloadKey]);

  if (listState !== 'ready' || !list) {
    return (
      <ProjectsShell
        path="~/projects"
        statusLeft={<span className="text-white/55">{listState === 'error' ? 'error' : 'loading'}</span>}
      >
        <StateNote state={listState === 'error' ? 'error' : 'loading'} onRetry={() => setReloadKey((key) => key + 1)} />
      </ProjectsShell>
    );
  }

  if (slug) {
    const project = list.projects.find((item) => item.id.slug === slug);
    if (!project) {
      return <NotFound />;
    }
    return <ProjectArticle project={project} projects={list.projects} lang={lang} />;
  }

  return <ProjectsIndex projects={list.projects} lang={lang} t={t} />;
}

interface ProjectsShellProps {
  path: string;
  children: React.ReactNode;
  statusLeft: React.ReactNode;
  statusRight?: React.ReactNode;
  closeTo?: string;
  closeLabel?: string;
  pathLinkTo?: string;
  sticky?: boolean;
  narrow?: boolean;
}

function ProjectsShell({
  path,
  children,
  statusLeft,
  statusRight,
  closeTo,
  closeLabel,
  pathLinkTo,
  sticky,
  narrow,
}: ProjectsShellProps) {
  // Ссылкой становится папка целиком («~/projects»), имя файла остаётся статикой:
  // по одному символу «~» пальцем не попасть, да и ведёт он не туда, куда обещает.
  const cut = path.lastIndexOf('/');
  const [head, tail] = pathLinkTo ? [path.slice(0, cut), path.slice(cut)] : [path, ''];

  return (
    <section
      tabIndex={-1}
      className="projects-scope relative h-full w-full overflow-y-auto overflow-x-hidden focus:outline-none"
    >
      {/* Фон закреплён во вьюпорте: иначе точки расставляются только по первому
          экрану, а ниже по прокрутке фон остаётся пустым. */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <NetworkBackground density="medium" interactive />
      </div>
      <div className={`relative mx-auto w-full px-3 py-4 sm:px-4 sm:py-6 ${narrow ? 'max-w-3xl' : 'max-w-5xl'}`}>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />

          <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div
              className={`flex items-center gap-2 rounded-t-[27px] border-b border-white/10 px-4 py-3 ${
                sticky ? 'sticky top-0 z-10 bg-theme-background' : 'bg-white/[0.02]'
              }`}
            >
              {closeTo && closeLabel ? (
                <Link
                  to={closeTo}
                  aria-label={closeLabel}
                  title={closeLabel}
                  className="-m-2 flex items-center gap-1.5 p-2"
                >
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56] transition-all hover:brightness-125" />
                  <span aria-hidden className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span aria-hidden className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </Link>
              ) : (
                <div aria-hidden className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
              )}
              <span className="ml-2 min-w-0 truncate font-mono text-xs text-white/55">
                {pathLinkTo ? (
                  <>
                    <Link to={pathLinkTo} className="-my-2 py-2 transition-colors hover:text-white/85">
                      {head}
                    </Link>
                    {tail}
                  </>
                ) : (
                  path
                )}
              </span>
            </div>

            <div className="px-6 py-6 sm:px-12 sm:py-9 lg:px-16">{children}</div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-[27px] border-t border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[11px]">
              <span className="min-w-0">{statusLeft}</span>
              {statusRight && <span className="shrink-0">{statusRight}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StateNote({ state, onRetry }: { state: 'loading' | 'error'; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[9rem] flex-col items-start justify-center gap-3">
      <p className="text-sm text-theme-text-muted">
        {state === 'error' ? t('projects.loadError') : t('common.loading')}
      </p>
      {state === 'error' && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 font-mono text-xs text-white/70 transition-colors hover:border-white/20 hover:text-white"
        >
          {t('projects.retry')}
        </button>
      )}
    </div>
  );
}

function StatusToken({ status }: { status: ProjectMeta['status'] }) {
  const token = STATUS_TOKEN[status];
  if (status === 'production') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-theme-success/90">
        <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-theme-success" />
        {token}
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-theme-warning/90">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-theme-warning" />
        {token}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-white/50">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full border border-white/50" />
      {token}
    </span>
  );
}

function KindToken({ kind }: { kind: ProjectMeta['kind'] }) {
  const { t } = useTranslation();
  const isWork = kind === 'work';
  return (
    <span
      className={`font-mono text-[10px] uppercase leading-none tracking-[0.16em] ${
        isWork ? 'text-white/80' : 'text-white/55'
      }`}
    >
      {isWork ? t('projects.kindWork') : t('projects.kindPersonal')}
    </span>
  );
}

function RowMarks({ project }: { project: ProjectMeta }) {
  return (
    <span className="flex items-center gap-3">
      <KindToken kind={project.kind} />
      <span aria-hidden className="h-3 w-px bg-white/[0.14]" />
      <StatusToken status={project.status} />
    </span>
  );
}

function RowNumber({ index }: { index: number }) {
  const value = String(index + 1).padStart(2, '0');
  return (
    <span
      aria-hidden
      className="block self-start pt-1 text-right font-mono text-[21px] font-light leading-none tracking-tight tabular-nums sm:self-center sm:pt-0 sm:text-[26px]"
    >
      <span className="text-white/[0.16] transition-colors group-hover:text-theme-accent/40">{value.slice(0, -1)}</span>
      <span className="text-white/40 transition-colors group-hover:text-theme-accent">{value.slice(-1)}</span>
    </span>
  );
}

function RussianContentNotice({ lang, className }: { lang: 'ru' | 'en'; className?: string }) {
  const { t } = useTranslation();
  if (lang !== 'en') return null;
  return <p className={`text-[13px] leading-relaxed text-white/45 ${className || ''}`}>{t('projects.ruOnlyNotice')}</p>;
}

function ProjectsIndex({
  projects,
  lang,
  t,
}: {
  projects: ProjectMeta[];
  lang: 'ru' | 'en';
  t: (key: string) => string;
}) {
  const location = useLocation();

  useEffect(() => {
    const title = t('meta.projectsTitle');
    const description = t('meta.projectsDescription');
    const url = buildPageSeoUrl({ path: '/projects', lang });
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
  }, [lang, location.pathname, t]);

  return (
    <ProjectsShell
      path="~/projects"
      statusLeft={
        <span className="text-white/45">
          {t('projects.footerNote')}{' '}
          <a
            href="https://github.com/eduardgagite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-theme-accent"
          >
            github.com/eduardgagite ↗
          </a>
        </span>
      }
    >
      <h1 className="sr-only">{t('projects.title')}</h1>
      <RussianContentNotice lang={lang} className="mb-5 max-w-[56ch]" />

      <div className="relative -mx-2">
        {projects.length > 1 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-11 w-px bg-white/[0.07] sm:left-16"
          />
        )}
        <ul className="divide-y divide-white/[0.06]">
          {projects.map((project, index) => (
            <li key={project.id.slug}>
              <Link
                to={withLang(`/projects/${project.id.slug}`, lang)}
                className="group grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 rounded-lg px-2 py-4 transition-colors hover:bg-white/[0.035] sm:grid-cols-[3rem_1fr_auto] sm:gap-x-8"
              >
                <RowNumber index={index} />

                <div className="min-w-0 self-center">
                  <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-lg font-semibold tracking-tight text-white/90 transition-colors group-hover:text-white sm:text-xl">
                    <span>{project.title}</span>
                    <span
                      aria-hidden
                      className="font-mono text-xs font-normal tracking-normal text-white/35 transition-colors group-hover:text-theme-accent/70"
                    >
                      {project.id.slug}.md
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 -translate-x-1 font-mono text-base font-normal text-theme-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </h2>

                  <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/60">{project.summary}</p>

                  <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                    {project.stack.map((item) => (
                      <span key={item} className={STACK_ACCENT.has(item) ? 'text-white/65' : 'text-white/45'}>
                        {item}
                      </span>
                    ))}
                  </p>

                  <span className="mt-3 flex items-center gap-3.5 sm:hidden">
                    {project.shots?.[0] && (
                      <span className="block w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-theme-surface">
                        <img
                          src={project.shots[0].src}
                          alt=""
                          width={1600}
                          height={900}
                          loading="lazy"
                          className="block h-auto w-full"
                        />
                      </span>
                    )}
                    <RowMarks project={project} />
                  </span>
                </div>

                <span className="hidden flex-col items-center gap-2 self-center sm:flex">
                  {project.shots?.[0] && (
                    <span className="block w-40 overflow-hidden rounded-lg border border-white/10 bg-theme-surface opacity-80 transition-all group-hover:border-white/20 group-hover:opacity-100">
                      <img
                        src={project.shots[0].src}
                        alt=""
                        width={1600}
                        height={900}
                        loading="lazy"
                        className="block h-auto w-full"
                      />
                    </span>
                  )}
                  <RowMarks project={project} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </ProjectsShell>
  );
}

function ProjectArticle({
  project,
  projects,
  lang,
}: {
  project: ProjectMeta;
  projects: ProjectMeta[];
  lang: 'ru' | 'en';
}) {
  const { t } = useTranslation();
  const [content, setContent] = useState<ProjectWithContent | null>(null);
  const [contentState, setContentState] = useState<LoadState>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setContentState('loading');
    setContent(null);
    loadProjectContent(project)
      .then((value) => {
        if (cancelled) return;
        setContent(value);
        setContentState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setContentState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [project, reloadKey]);

  useEffect(() => {
    const contentLang = project.id.lang;
    const title = `${project.title} — ${t('projects.title')} — Eduard Gagite`;
    const url = buildPageSeoUrl({ path: `/projects/${project.id.slug}`, lang: contentLang });
    updateSEO({
      title,
      description: project.summary,
      ogTitle: title,
      ogDescription: project.summary,
      ogUrl: url,
      ogType: 'article',
      ogLocale: contentLang === 'ru' ? 'ru_RU' : 'en_US',
      canonical: url,
    });
    return () => {
      resetSEO();
    };
  }, [project, t]);

  useEffect(() => {
    document.querySelector('.projects-scope')?.scrollTo({ top: 0 });
    // Кликнутая ссылка списка размонтировалась, фокус откатился на body — возвращаем его
    // в заголовок кейса, иначе следующий Tab уводит в шапку, а стрелки не прокручивают.
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) {
      document.getElementById('project-title')?.focus({ preventScroll: true });
    }
  }, [project.id.slug]);

  const currentIndex = useMemo(
    () => projects.findIndex((item) => item.id.slug === project.id.slug),
    [project.id.slug, projects],
  );
  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : null;
  const nextProject = currentIndex >= 0 && currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null;

  const statusClass =
    project.status === 'production'
      ? 'text-theme-success/90'
      : project.status === 'active'
        ? 'text-theme-warning/90'
        : 'text-white/50';

  const shots = project.shots ?? [];
  const telegramHref = `https://t.me/${profileContent.contact.telegramHandle}`;

  return (
    <ProjectsShell
      path={`~/projects/${project.id.slug}.md`}
      pathLinkTo={withLang('/projects', lang)}
      closeTo={withLang('/projects', lang)}
      closeLabel={t('projects.closeFile')}
      sticky
      narrow
      statusLeft={<span className="text-white/55">markdown</span>}
      statusRight={<span className="text-white/55">{project.id.lang}</span>}
    >
      <header>
        <h1
          id="project-title"
          tabIndex={-1}
          className="max-w-[24ch] text-2xl font-semibold leading-tight tracking-tight text-theme-text focus:outline-none sm:text-[2.1rem]"
        >
          {project.title}
        </h1>
        <p className="mt-3 max-w-[58ch] text-[17px] leading-[1.7] text-white/65">{project.summary}</p>
        <RussianContentNotice lang={lang} className="mt-3 max-w-[58ch]" />

        <div className="mt-7 border-y border-white/[0.09] py-4">
          <dl className="grid gap-x-12 gap-y-1.5 font-mono text-[13px] leading-6 sm:grid-cols-2">
            {project.role && <FrontMatterRow name="role" value={project.role} />}
            <FrontMatterRow name="status" value={<span className={statusClass}>{STATUS_TOKEN[project.status]}</span>} />
            <FrontMatterRow
              name="type"
              value={project.kind === 'work' ? t('projects.kindWorkFull') : t('projects.kindPersonalFull')}
            />
            <FrontMatterRow
              name="source"
              value={
                project.code === 'public' && project.codeUrl ? (
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/85 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
                  >
                    {project.codeUrl.replace(/^https?:\/\//, '')} ↗
                  </a>
                ) : (
                  <span className="text-white/55">{t('projects.codePrivate')}</span>
                )
              }
            />
            {project.liveUrl && (
              <FrontMatterRow
                name="live"
                value={
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/85 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white"
                  >
                    {project.liveUrl.replace(/^https?:\/\//, '')} ↗
                  </a>
                }
              />
            )}
            <div className="sm:col-span-2">
              <FrontMatterRow
                name="stack"
                value={
                  <span className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {project.stack.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </span>
                }
              />
            </div>
          </dl>
        </div>
      </header>

      {shots.length > 0 && (
        <div className="mt-9">
          <p className="font-mono text-xs text-white/45">screenshots/</p>
          <div
            className={
              shots.length === 1
                ? 'mt-3 max-w-3xl'
                : 'projects-shots mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0'
            }
          >
            {shots.map((shot) => (
              <span
                key={shot.src}
                className={`block overflow-hidden rounded-xl border border-white/10 bg-theme-surface ${
                  shots.length === 1 ? '' : 'w-[85%] shrink-0 snap-center sm:w-auto sm:shrink'
                }`}
              >
                <img
                  src={shot.src}
                  alt={shot.caption}
                  width={1600}
                  height={900}
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-9">
        {contentState === 'loading' && <p className="text-sm text-theme-text-muted">{t('common.loading')}</p>}
        {contentState === 'error' && <StateNote state="error" onRetry={() => setReloadKey((key) => key + 1)} />}
        {contentState === 'ready' && content && <MarkdownArticle content={content.content} />}

        {(prevProject || nextProject) && (
          <nav
            className="mt-10 flex justify-between gap-4 border-t border-white/10 pt-6"
            aria-label={t('projects.title')}
          >
            {prevProject ? <AdjacentLink project={prevProject} lang={lang} direction="prev" /> : <span aria-hidden />}
            {nextProject && <AdjacentLink project={nextProject} lang={lang} direction="next" />}
          </nav>
        )}

        <p className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs text-white/45">
          <span>{t('projects.contactNote')}</span>
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-theme-accent/85 underline decoration-white/25 underline-offset-4 transition-colors hover:text-theme-accent hover:decoration-theme-accent"
          >
            @{profileContent.contact.telegramHandle} ↗
          </a>
        </p>
      </div>
    </ProjectsShell>
  );
}

function FrontMatterRow({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-x-2">
      <dt className="text-white/45">{name}:</dt>
      <dd className="m-0 min-w-0 text-white/85 [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function AdjacentLink({
  project,
  lang,
  direction,
}: {
  project: ProjectMeta;
  lang: 'ru' | 'en';
  direction: 'prev' | 'next';
}) {
  const { t } = useTranslation();
  return (
    <Link
      to={withLang(`/projects/${project.id.slug}`, lang)}
      aria-label={`${direction === 'prev' ? t('projects.prevProject') : t('projects.nextProject')}: ${project.title}`}
      className={`group flex max-w-[48%] flex-col gap-1 ${direction === 'next' ? 'ml-auto items-end text-right' : 'items-start'}`}
    >
      <span aria-hidden className="font-mono text-[11px] text-white/40">
        {direction === 'prev' ? 'prev' : 'next'}
      </span>
      <span className="text-base text-white/70 transition-colors group-hover:text-white">
        {direction === 'prev' ? `← ${project.title}` : `${project.title} →`}
      </span>
    </Link>
  );
}
