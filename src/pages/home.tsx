import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { profileContent } from '../content/profile';
import { ButtonLink } from '../components/ui/button-link';
import { GithubIcon, MailIcon, TelegramIcon } from '../components/icons';
import { NetworkBackground } from '../components/background/network-canvas';
import { resetSEO } from '../utils/seo';

export function Home() {
  const { t, i18n } = useTranslation();
  const isRu = (i18n.resolvedLanguage || 'ru') === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const name = isRu ? profileContent.fullNameRu : profileContent.fullNameEn;
  const telegramHref = `https://t.me/${profileContent.contact.telegramHandle}`;
  const emailHref = `mailto:${profileContent.contact.email}`;
  const githubHref = 'https://github.com/eduardgagite';

  useEffect(() => {
    resetSEO();
  }, []);

  return (
    <section className="relative h-full w-full overflow-hidden">
      <NetworkBackground density="medium" color="#e9eef4" interactive />

      <div className="relative mx-auto h-full w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 grid gap-4 sm:gap-6 lg:gap-8 items-stretch md:[grid-template-rows:auto_1fr] lg:grid-cols-[360px,1fr] lg:[grid-template-rows:initial]">
        {/* Left column: avatar + name + role + contacts */}
        <aside className="flex flex-col items-center md:items-start self-center md:self-start lg:self-center">
          <div className="relative w-full max-w-[min(360px,90vw)]">
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
        <div className="relative rounded-xl border border-white/10 bg-white/[0.03] shadow-lg flex flex-col min-h-0 h-full">
          <div className="flex items-center gap-1.5 p-3 border-b border-white/10">
            <span className="size-2.5 rounded-full bg-red-400/70" />
            <span className="size-2.5 rounded-full bg-yellow-300/70" />
            <span className="size-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-xs opacity-70">about.ts</span>
          </div>
          <div className="relative p-4 overflow-hidden flex-1 flex flex-col">
            <pre className="font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap">
{`/**
 * ${isRu ? 'Обо мне' : 'About me'}
 */`}
            </pre>
            <pre className="mt-2 font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap text-white/90 flex-1">
              {renderHighlightedBio({ text: t('hero.bio') as string, lang })}
            </pre>
            <div className="mt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60" />
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <pre className="font-mono text-[12px] leading-5 whitespace-pre-wrap text-white/85">
{`// materials
// ${t('materials.note')} [${t('materials.topicsShort')}]`}
                </pre>
                <ButtonLink href="/materials" variant="subtle" className="shrink-0 px-2.5 py-1.5 text-xs self-start sm:self-auto">
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

const COMMON_TECH_TOKENS = ['Go', 'Kafka', 'RabbitMQ', 'Docker', 'CI/CD', 'gRPC', 'WebSocket'] as const;
const TECH_TOKENS: Record<'ru' | 'en', readonly string[]> = {
  ru: COMMON_TECH_TOKENS,
  en: COMMON_TECH_TOKENS,
};

interface RenderHighlightedBioArgs {
  text: string;
  lang: 'ru' | 'en';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedBio({ text, lang }: RenderHighlightedBioArgs) {
  if (!text) return null;
  const tokens = TECH_TOKENS[lang];
  const pattern = new RegExp(`(${tokens.map(escapeRegex).join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (tokens.includes(part)) {
      return (
        <span key={`tech-${index}`} className="text-emerald-300">
          {part}
        </span>
      );
    }
    return part;
  });
}

