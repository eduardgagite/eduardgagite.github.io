import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="w-full relative">
      <div className="relative border-t border-white/10 bg-white/[0.02]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 py-4 relative">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
            <span className="text-xs text-white/70 font-medium tracking-wide">
              {t('footer.copyright', { year })}
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>
      </div>
    </footer>
  );
}

