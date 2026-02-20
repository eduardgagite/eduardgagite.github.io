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

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <LanguageUrlSync />
      <div className="h-dvh flex flex-col">
        <Header />
        <main className="flex-1 min-h-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/materials/*"
              element={(
                <Suspense fallback={<MaterialsFallback />}>
                  <Materials />
                </Suspense>
              )}
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
