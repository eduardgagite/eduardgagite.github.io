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
    <header className="w-full sticky top-0 z-20 backdrop-blur-md">
      <div className="relative border-b border-white/10 bg-background/80">
        <div 
          className="absolute inset-0 pointer-events-none" 
          aria-hidden 
          style={{
            background: 'linear-gradient(to right, rgba(var(--theme-primary-rgb), 0.05), transparent, rgba(var(--theme-primary-rgb), 0.05))'
          }}
        />
        <div className="mx-auto max-w-5xl px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4 relative">
          <Link to="/" className="flex items-center gap-3 group" aria-label="Home">
            <div 
                className="relative size-9 rounded-full grid place-items-center text-xs font-semibold ring-1 ring-white/20 transition-all duration-300 group-hover:ring-white/40"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.30), rgba(255, 255, 255, 0.10))'
                }}
              >
              {initials}
            </div>
            <div className="leading-tight hidden sm:block">
              <span className="block text-sm font-semibold tracking-wide group-hover:text-white transition-colors">{'Eduard Gagite'}</span>
              <span className="block text-[11px]" style={{ color: 'rgba(var(--theme-primary-rgb), 0.9)' }}>{t('hero.role')}</span>
            </div>
          </Link>

          <nav className="justify-self-center" aria-label="Primary">
            <ul className="flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={isActive(to) ? 'page' : undefined}
                    className={`group relative inline-flex items-center px-4 py-2 text-[13px] font-medium tracking-wide transition-all duration-300 rounded-md ${
                      isActive(to) 
                        ? 'text-white bg-white/[0.08]' 
                        : 'text-white/70 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      style={{
                      background: 'linear-gradient(to right, rgba(var(--theme-primary-rgb), 0.80), var(--theme-primary))',
                      opacity: isActive(to) ? 1 : 0,
                      transition: 'opacity 0.3s'
                    }}
                    className={`pointer-events-none absolute left-4 right-4 -bottom-0.5 h-0.5 transition-opacity duration-300 ${
                      isActive(to) ? '' : 'group-hover:opacity-60'
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
      </div>
    </header>
  );
}




