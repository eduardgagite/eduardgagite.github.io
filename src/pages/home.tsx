import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { profileContent } from '../content/profile';
import { GithubIcon, MailIcon, TelegramIcon } from '../components/icons';
import { NetworkBackground } from '../components/background/network-canvas';
import { resetSEO, updateSEO, buildPageSeoUrl } from '../utils/seo';
import { withLang } from '../i18n/url';

export function Home() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRu = (i18n.resolvedLanguage || 'ru') === 'ru';
  const lang = isRu ? 'ru' : 'en';
  const name = isRu ? profileContent.fullNameRu : profileContent.fullNameEn;
  const telegramHref = `https://t.me/${profileContent.contact.telegramHandle}`;
  const emailHref = `mailto:${profileContent.contact.email}`;
  const githubHref = 'https://github.com/eduardgagite';

  useEffect(() => {
    const title = t('meta.homeTitle') || 'Eduard Gagite — Backend Developer';
    const description = t('meta.homeDescription') || '';
    const url = buildPageSeoUrl({ path: location.pathname, lang });
    updateSEO({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogUrl: url,
      ogType: 'website',
      ogLocale: lang === 'ru' ? 'ru_RU' : 'en_US',
      canonical: url,
    });
    return () => {
      resetSEO();
    };
  }, [lang, location.pathname, t]);

  return (
    <section className="relative h-full w-full overflow-y-auto overflow-x-hidden">
      <NetworkBackground density="medium" interactive />

      <div className="relative mx-auto h-full w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 grid gap-4 sm:gap-6 lg:gap-8 items-stretch md:[grid-template-rows:auto_1fr] lg:grid-cols-[360px,1fr] lg:[grid-template-rows:initial]">
        
        {/* Left column: avatar + name + role + contacts */}
        <aside className="flex flex-col items-center md:items-start self-center md:self-start lg:self-center">
          <div className="relative w-full max-w-[min(360px,90vw)]">
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
            
            {/* Card */}
            <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 overflow-hidden shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)]">
              
              {/* Avatar */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden ring-1 ring-white/10">
                <img
                  src="/images/avatar.jpg"
                  alt={name}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              
              {/* Name & Role */}
              <div className="mt-5">
                <h1 className="text-xl font-semibold leading-tight text-theme-text">{name}</h1>
                <p className="mt-1.5 text-sm font-medium text-theme-accent">
                  {t('hero.role')}
                </p>
              </div>
              
              {/* Divider */}
              <div className="my-5 h-px bg-white/10" />
              
              {/* Contact buttons */}
              <div className="space-y-2">
                <ContactLink href={telegramHref} external icon={<TelegramIcon />}>
                  <span className="text-theme-text-secondary">{t('hero.telegram')}</span>
                  <span className="text-theme-text-muted">@{profileContent.contact.telegramHandle}</span>
                </ContactLink>
                <ContactLink href={emailHref} icon={<MailIcon />}>
                  <span className="text-theme-text-secondary">{t('hero.email')}</span>
                  <span className="text-theme-text-muted">{profileContent.contact.email}</span>
                </ContactLink>
                <ContactLink href={githubHref} external icon={<GithubIcon />}>
                  <span className="text-theme-text-secondary">{t('hero.github')}</span>
                  <span className="text-theme-text-muted">/eduardgagite</span>
                </ContactLink>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: "About me" in code-like window */}
        <div className="relative">
          {/* Glow effect */}
          <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,_rgba(31,111,235,0.35),_transparent_65%)] opacity-70 blur-3xl" />
          
          {/* Window */}
          <div className="relative h-full rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_28px_70px_-40px_rgba(0,0,0,0.85)] flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="ml-2 text-xs text-white/50 font-mono">about.ts</span>
          </div>
            
            {/* Content */}
            <div className="relative p-5 overflow-auto flex-1 flex flex-col">
              <pre className="font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap text-white/50">
{`/**
 * ${isRu ? 'Обо мне' : 'About me'}
 */`}
            </pre>
              
              <div className="mt-3 font-mono text-[clamp(13px,1.05vw,16px)] leading-7 whitespace-pre-wrap text-white/85 flex-1">
              {renderHighlightedBio({ text: t('hero.bio') as string, lang })}
              </div>
              
              {/* Footer */}
              <div className="mt-4">
                <div className="h-px w-full bg-white/10" />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <pre className="font-mono text-[12px] leading-5 whitespace-pre-wrap text-white/50">
{`// materials
// ${t('materials.note')} [${t('materials.topicsShort')}]`}
                </pre>
                  <Link
                    to={withLang('/materials', lang)}
                    className="inline-flex items-center gap-2 shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-white/[0.05] border border-white/10 text-white/90 transition-all hover:bg-white/[0.1] hover:border-white/20 self-start sm:self-auto"
                  >
                  {t('materials.cta')}
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ContactLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  external?: boolean;
}

function ContactLink({ href, icon, children, external }: ContactLinkProps) {
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <a
      href={href}
      {...props}
      className="group/link flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] transition-all hover:bg-white/[0.08] hover:border-white/15"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-theme-surface-elevated text-theme-text-muted group-hover/link:text-theme-accent transition-colors">
        {icon}
      </span>
      <div className="flex-1 min-w-0 flex flex-col text-sm">
        {children}
      </div>
      <svg className="w-4 h-4 text-white/30 group-hover/link:text-white/50 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

const COMMON_TECH_TOKENS = ['Go', 'Kafka', 'RabbitMQ', 'Docker', 'CI/CD', 'gRPC', 'WebSocket', 'Redis', 'PostgreSQL'] as const;
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
        <span key={`tech-${index}`} className="text-theme-accent font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}
