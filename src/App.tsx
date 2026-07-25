import { Suspense, lazy } from 'react';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './pages/home';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageUrlSync } from './i18n/language-url-sync';
import { NotFound } from './pages/not-found';

const Materials = lazy(async () => {
  const module = await import('./pages/materials');
  return { default: module.Materials };
});

const Projects = lazy(async () => {
  const module = await import('./pages/projects');
  return { default: module.Projects };
});

export function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LanguageUrlSync />
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0"
      >
        {t('common.skipToContent')}
      </a>
      <div className="h-dvh flex flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/materials/*"
              element={
                <Suspense fallback={<MaterialsFallback />}>
                  <Materials />
                </Suspense>
              }
            />
            <Route
              path="/projects"
              element={
                <Suspense fallback={<MaterialsFallback />}>
                  <Projects />
                </Suspense>
              }
            />
            <Route
              path="/projects/:slug"
              element={
                <Suspense fallback={<MaterialsFallback />}>
                  <Projects />
                </Suspense>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function MaterialsFallback() {
  const { t } = useTranslation();

  return (
    <section className="h-full w-full flex items-center justify-center">
      <p className="text-sm text-theme-text-muted">{t('common.loading')}</p>
    </section>
  );
}
