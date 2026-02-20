import { useTranslation } from 'react-i18next';

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-theme-text-muted">{t('materials.emptyState')}</p>
    </div>
  );
}

export function MaterialsIntro() {
  const { t } = useTranslation();

  return (
    <div className="h-full overflow-y-auto scroll-elegant">
      <h1 className="text-2xl font-bold text-theme-text">{t('materials.introTitle')}</h1>
      <div className="mt-4 space-y-3 text-[15px] leading-7 text-theme-text-secondary">
        <p>{t('materials.introP1')}</p>
        <p>{t('materials.introP2')}</p>
        <p>{t('materials.introP3')}</p>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-theme-surface-elevated border border-theme-border">
        <p className="text-[10px] uppercase tracking-widest text-theme-text-muted mb-3">{t('materials.philosophyTitle')}</p>
        <ul className="space-y-2 font-mono text-[13px] text-theme-text-subtle">
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-theme-accent">//</span>
            <span>{t('materials.philosophy3')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
