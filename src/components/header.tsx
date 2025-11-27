import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './language-switch';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const initials = 'EG';
  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/materials', label: t('nav.materials') },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header className="w-full sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Link to="/" className="flex items-center gap-3 group" aria-label="Home">
          <div className="relative size-9 rounded-full bg-white/10 grid place-items-center text-xs font-semibold">
            {initials}
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="block text-sm font-semibold tracking-wide group-hover:text-white transition-colors">{'Eduard Gagite'}</span>
            <span className="block text-[11px] opacity-70">{t('hero.role')}</span>
          </div>
        </Link>

        <nav className="justify-self-center" aria-label="Primary">
          <ul className="flex items-center gap-1.5">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={isActive(to) ? 'page' : undefined}
                  className={`group relative inline-flex items-center px-3 py-1.5 text-[13px] font-medium tracking-wide transition-colors ${
                    isActive(to) ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px bg-white/80 transition-opacity duration-150 ${
                      isActive(to) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="justify-self-end flex items-center gap-2">
          <LanguageSwitch />
        </div>
      </div>
    </header>
  );
}

