import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './language-switch';
import { Link } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();
  const initials = useMemo(() => 'EG', []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="w-full sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group" aria-label="Home">
          <div className="relative size-9 rounded-full bg-white/10 grid place-items-center text-xs font-semibold">
            {initials}
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide group-hover:text-white transition-colors">{'Eduard Gagite'}</span>
            <span className="block text-[11px] opacity-70">{t('hero.role')}</span>
          </div>
        </Link>

        <nav className="justify-self-center hidden sm:block" aria-label="Primary">
          <ul className="flex items-center gap-1.5">
            <li>
              <Link
                to="/"
                className="group relative inline-flex items-center px-3 py-1.5 text-[13px] font-medium tracking-wide"
              >
                <span>{t('nav.home')}</span>
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-white/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </Link>
            </li>
            <li>
              <Link
                to="/materials"
                className="group relative inline-flex items-center px-3 py-1.5 text-[13px] font-medium tracking-wide"
              >
                <span>{t('nav.materials')}</span>
                <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-white/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="justify-self-end flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <button
            type="button"
            className="sm:hidden inline-flex items-center justify-center size-9 rounded-md hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors"
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="hidden sm:block">
            {/* reserve space if needed */}
          </div>
        </div>
      </div>

      {/* Mobile overlay menu */}
      <div
        id="mobile-menu"
        className={`sm:hidden ${isMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`fixed inset-0 z-10 bg-background/80 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-white/10 bg-background/95 backdrop-blur-md px-4 pb-6 pt-4 transition-transform duration-200 ${
            isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide">{t('nav.menu') ?? 'Menu'}</span>
              <button
                type="button"
                className="inline-flex items-center justify-center size-9 rounded-md hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-colors"
                aria-label="Close menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="mb-3">
              <LanguageSwitch />
            </div>
            <nav aria-label="Mobile">
              <ul className="flex flex-col">
                <li>
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-1 py-3 text-base font-medium tracking-wide hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
                  >
                    {t('nav.home')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/materials"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-1 py-3 text-base font-medium tracking-wide hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-md"
                  >
                    {t('nav.materials')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}


