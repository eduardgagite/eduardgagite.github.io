import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { profileContent } from '../content/profile';
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
          <div className="relative w-full max-w-[min(360px,90vw)] group">
            {/* Glow effect */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-sky-500/20 via-purple-500/10 to-sky-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
            
            {/* Card */}
            <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d1117]/70 backdrop-blur-xl p-5 overflow-hidden">
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
              
              {/* Avatar */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden ring-1 ring-white/[0.08]">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-purple-500/10" />
                <img
                  src="/images/avatar.jpg"
                  alt={name}
                  className="relative h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              
              {/* Name & Role */}
              <div className="mt-5">
                <h1 className="text-xl font-semibold leading-tight text-white">{name}</h1>
                <p className="mt-1.5 text-sm font-medium bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                  {t('hero.role')}
                </p>
              </div>
              
              {/* Divider */}
              <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              
              {/* Contact buttons */}
              <div className="space-y-2">
                <ContactLink href={telegramHref} external icon={<TelegramIcon />}>
                  <span className="text-white/70">Telegram</span>
                  <span className="text-white/50">@{profileContent.contact.telegramHandle}</span>
                </ContactLink>
                <ContactLink href={emailHref} icon={<MailIcon />}>
                  <span className="text-white/70">Email</span>
                  <span className="text-white/50">{profileContent.contact.email}</span>
                </ContactLink>
                <ContactLink href={githubHref} external icon={<GithubIcon />}>
                  <span className="text-white/70">GitHub</span>
                  <span className="text-white/50">/eduardgagite</span>
                </ContactLink>
              </div>
            </div>
          </div>
        </aside>

        {/* Right column: "About me" in code-like window */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-sky-500/10 to-purple-500/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Window */}
          <div className="relative h-full rounded-2xl border border-white/[0.08] bg-[#0d1117]/70 backdrop-blur-xl shadow-2xl shadow-black/20 flex flex-col min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.3)]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.3)]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.3)]" />
              </div>
              <span className="ml-2 text-xs text-white/40 font-mono">about.ts</span>
            </div>
            
            {/* Content */}
            <div className="relative p-5 overflow-auto flex-1 flex flex-col">
              {/* Gradient accent line */}
              <div className="absolute left-0 top-5 bottom-5 w-[2px] bg-gradient-to-b from-sky-500/40 via-purple-500/40 to-sky-500/40 rounded-full" />
              
              <pre className="pl-4 font-mono text-[clamp(13px,1.05vw,16px)] leading-6 whitespace-pre-wrap text-white/50">
{`/**
 * ${isRu ? 'Обо мне' : 'About me'}
 */`}
              </pre>
              
              <div className="mt-3 pl-4 font-mono text-[clamp(13px,1.05vw,16px)] leading-7 whitespace-pre-wrap text-white/85 flex-1">
                {renderHighlightedBio({ text: t('hero.bio') as string, lang })}
              </div>
              
              {/* Footer */}
              <div className="mt-4 pl-4">
                <div className="h-px w-full bg-gradient-to-r from-sky-500/30 via-purple-500/30 to-transparent" />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <pre className="font-mono text-[12px] leading-5 whitespace-pre-wrap text-white/50">
{`// materials
// ${t('materials.note')} [${t('materials.topicsShort')}]`}
                  </pre>
                  <a
                    href="/materials"
                    className="group/btn inline-flex items-center gap-2 shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 text-white/90 transition-all hover:from-sky-500/20 hover:to-purple-500/20 hover:border-sky-500/30 hover:shadow-[0_0_16px_rgba(56,189,248,0.15)] self-start sm:self-auto"
                  >
                    {t('materials.cta')}
                    <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
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
  const props = external ? { target: '_blank', rel: 'noreferrer' } : {};
  return (
    <a
      href={href}
      {...props}
      className="group/link flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] transition-all hover:bg-white/[0.05] hover:border-white/[0.1]"
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-white/[0.05] to-white/[0.02] text-white/50 group-hover/link:text-sky-400 transition-colors">
        {icon}
      </span>
      <div className="flex-1 min-w-0 flex flex-col text-sm">
        {children}
      </div>
      <svg className="w-4 h-4 text-white/20 group-hover/link:text-white/40 transition-all group-hover/link:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <span key={`tech-${index}`} className="text-sky-400 font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}
