import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { withLang } from '../../i18n/url';

export function StateNote({ state, onRetry }: { state: 'loading' | 'error'; onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-3" role={state === 'error' ? 'alert' : 'status'}>
      <p className="text-sm text-theme-text-muted">
        {state === 'error' ? t('materials.loadError') : t('materials.loadingMaterial')}
      </p>
      {state === 'error' && onRetry && (
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

export function NotFoundNote({ lang }: { lang: 'ru' | 'en' }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="max-w-[52ch] text-sm text-theme-text-muted">{t('materials.notFoundNote')}</p>
      <Link
        to={withLang('/materials', lang)}
        className="font-mono text-xs text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
      >
        ~/materials
      </Link>
    </div>
  );
}

export function RussianNotice({ lang, className }: { lang: 'ru' | 'en'; className?: string }) {
  const { t } = useTranslation();
  if (lang !== 'en') return null;
  return <p className={`text-[13px] leading-relaxed text-white/45 ${className || ''}`}>{t('materials.ruOnly')}</p>;
}
