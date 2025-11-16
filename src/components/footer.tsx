import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-white/10">
      <div className="mx-auto max-w-5xl px-4 h-12 flex items-center justify-center text-xs opacity-80">
        <span>{t('footer.copyright', { year })}</span>
      </div>
    </footer>
  );
}

