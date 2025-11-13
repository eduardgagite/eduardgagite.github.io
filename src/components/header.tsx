import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './language-switch';
import { Link } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();
  const initials = useMemo(() => 'EG', []);
  return (
    <header className="w-full sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-primary/60 to-white/20 blur-sm opacity-60 group-hover:opacity-90 transition" />
            <div className="relative size-9 rounded-full bg-white/10 grid place-items-center text-xs font-semibold">
              {initials}
            </div>
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-semibold group-hover:text-white transition">Eduard Gagite</span>
            <span className="block text-[11px] opacity-70">{t('hero.role')}</span>
          </div>
        </Link>

        <nav className="justify-self-center">
          <ul className="flex items-center gap-2">
            <li>
              <Link
                to="/"
                className="group relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/5 transition"
              >
                <span>{t('nav.home')}</span>
                <span className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
              </Link>
            </li>
            <li>
              <Link
                to="/materials"
                className="group relative inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/5 transition"
              >
                <span>{t('nav.materials')}</span>
                <span className="pointer-events-none absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition" />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="justify-self-end">
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}


