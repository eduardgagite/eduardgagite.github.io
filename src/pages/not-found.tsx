import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { NetworkBackground } from '../components/background/network-canvas';
import { resetSEO, updateSEO, buildPageSeoUrl } from '../utils/seo';
import { withLang } from '../i18n/url';

export function NotFound() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = (i18n.resolvedLanguage || 'ru') === 'ru' ? 'ru' : 'en';
  const isRu = lang === 'ru';
  const displayPath = (() => {
    try {
      return decodeURIComponent(location.pathname);
    } catch {
      return location.pathname;
    }
  })();

  useEffect(() => {
    const title =
      t('notFound.title') || (lang === 'ru' ? 'Страница не найдена — Eduard Gagite' : 'Page not found — Eduard Gagite');
    const description =
      t('notFound.description') ||
      (lang === 'ru'
        ? 'Похоже, ссылка неверная или страница была перемещена.'
        : 'The link looks wrong or the page has been moved.');
    const url = buildPageSeoUrl({ path: location.pathname, lang });
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

  const exits = [
    { path: '~/', to: withLang('/', lang), label: t('nav.home') },
    { path: '~/projects', to: withLang('/projects', lang), label: t('nav.projects') },
    { path: '~/materials', to: withLang('/materials', lang), label: t('nav.materials') },
  ];

  return (
    <section className="projects-scope relative h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <NetworkBackground density="low" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-2xl items-center px-3 py-4 sm:px-4 sm:py-6">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />

          <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex items-center gap-2 rounded-t-[27px] border-b border-white/10 bg-white/[0.02] px-4 py-3">
              <div aria-hidden className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              </div>
              {/* В титуле — тот адрес, который запросили: сразу видно, что именно не открылось. */}
              <span className="ml-2 min-w-0 truncate font-mono text-xs text-white/55">~{displayPath}</span>
            </div>

            <div className="px-6 py-8 sm:px-12 sm:py-10">
              <h1 className="max-w-[20ch] text-2xl font-semibold leading-tight tracking-tight text-theme-text sm:text-[2rem]">
                {t('notFound.heading') || (isRu ? 'Страница не найдена' : 'Page not found')}
              </h1>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-[1.7] text-white/60">
                {t('notFound.hint') ||
                  (isRu ? 'Проверьте адрес или вернитесь на главную.' : 'Check the URL or go back home.')}
              </p>

              <ul className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {exits.map((exit) => (
                  <li key={exit.path}>
                    <Link to={exit.to} className="group flex items-baseline gap-4 py-3.5">
                      <span
                        aria-hidden
                        className="w-[6.5rem] shrink-0 font-mono text-xs text-white/35 transition-colors group-hover:text-theme-accent/70"
                      >
                        {exit.path}
                      </span>
                      <span className="min-w-0 text-[15px] text-white/70 transition-colors group-hover:text-white">
                        {exit.label}
                      </span>
                      <span
                        aria-hidden
                        className="ml-auto shrink-0 -translate-x-1 font-mono text-sm text-theme-accent opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-[27px] border-t border-white/10 bg-white/[0.02] px-4 py-2.5 font-mono text-[11px] text-white/40">
              <span>404</span>
              <span className="shrink-0">not found</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
