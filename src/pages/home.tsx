import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { profileContent } from '../content/profile';
import { ButtonLink } from '../components/ui/button-link';
import { GithubIcon, MailIcon, TelegramIcon } from '../components/icons';
import { NetworkBackground } from '../components/background/network-canvas';

export function Home() {
  const { t, i18n } = useTranslation();
  const isRu = (i18n.resolvedLanguage || 'ru') === 'ru';
  const name = useMemo(() => isRu ? profileContent.fullNameRu : profileContent.fullNameEn, [isRu]);
  const telegramHref = useMemo(() => `https://t.me/${profileContent.contact.telegramHandle}`, []);
  const emailHref = useMemo(() => `mailto:${profileContent.contact.email}`, []);
  const githubHref = 'https://github.com/eduardgagite';

  return (
    <section className="relative h-full w-full overflow-auto lg:overflow-hidden">
      <NetworkBackground density="medium" color="#e9eef4" interactive />

      <div className="relative mx-auto max-w-7xl h-full px-4 py-4 sm:py-6 grid gap-6 sm:gap-8 items-stretch lg:grid-cols-[360px,1fr]">
        {/* Left column: avatar + name + role + contacts */}
        <aside className="flex flex-col items-start self-center">
          <div className="relative w-full max-w-full sm:max-w-[320px] lg:max-w-[360px] mx-auto">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary/40 to-white/10 blur opacity-60" aria-hidden />
            <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="aspect-square overflow-hidden rounded-md ring-1 ring-white/10">
                <img
                  src="/avatar.jpg"
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="mt-4">
                <h1 className="text-xl font-semibold leading-tight">{name}</h1>
                <p className="text-primary font-medium mt-1">{t('hero.role')}</p>
              </div>
              <div className="mt-4">
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <ButtonLink href={telegramHref} external variant="subtle" className="w-full">
                    <TelegramIcon />
                    <span>{t('hero.telegram')}</span>
                    <span className="opacity-80">@{profileContent.contact.telegramHandle}</span>
                  </ButtonLink>
                  <ButtonLink href={emailHref} variant="subtle" className="w-full">
                    <MailIcon />
                    <span>{t('hero.email')}</span>
                    <span className="opacity-80">{profileContent.contact.email}</span>
                  </ButtonLink>
                  <ButtonLink href={githubHref} external variant="subtle" className="w-full">
                    <GithubIcon />
                    <span>{t('hero.github')}</span>
                    <span className="opacity-80">/eduardgagite</span>
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: "About me" in code-like window */}
        <div className="relative rounded-xl border border-white/10 bg-white/[0.03] shadow-lg flex flex-col min-h-0 lg:h-full">
          <div className="flex items-center gap-1.5 p-3 sm:p-3 border-b border-white/10">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-yellow-300/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-xs opacity-70">about.ts</span>
          </div>
          <div className="relative p-3 sm:p-4 overflow-hidden flex-1 flex flex-col">
            <pre className="font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap">
{`/**
 * ${isRu ? 'Обо мне' : 'About me'}
 */`}
            </pre>
            <pre className="mt-2 font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap text-white/90 flex-1">
{t('hero.bio')}
            </pre>
            <div className="mt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60" />
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                <p className="font-mono text-[12px] leading-5 opacity-90">
                  {t('materials.note')}
                  <span className="ml-2 opacity-70">[{t('materials.topicsShort')}]</span>
                </p>
                <ButtonLink href="/materials" variant="subtle" className="shrink-0 px-2.5 py-1.5 text-xs">
                  {t('materials.cta')}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


