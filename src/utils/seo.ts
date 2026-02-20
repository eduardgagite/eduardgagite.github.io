import { absoluteWithLang, normalizeLang } from '../i18n/url';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogLocale?: string;
  canonical?: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleSection?: string;
  hreflangLinks?: Array<{ lang: string; url: string }>;
  structuredData?: object;
}

const DEFAULT_TITLE = 'Eduard Gagite — Backend Developer';
const DEFAULT_DESCRIPTION = 'Backend-разработчик. Пишу на Go, работаю с Kafka, RabbitMQ, Docker, gRPC. Делюсь знаниями: курсы по Redis, Docker и другим технологиям.';
const DEFAULT_OG_IMAGE = 'https://eduardgagite.github.io/images/og-image.png';
const BASE_URL = 'https://eduardgagite.github.io';

function buildUrlWithLang({ path, lang }: { path: string; lang: 'ru' | 'en' }): string {
  return absoluteWithLang(path, lang);
}

export function buildPageSeoUrl({ path, lang }: { path: string; lang: 'ru' | 'en' }): string {
  return buildUrlWithLang({ path, lang });
}

function getOrCreateMetaTag(property: string, attribute: 'name' | 'property' = 'name'): HTMLMetaElement {
  const selector = attribute === 'name' ? `meta[name="${property}"]` : `meta[property="${property}"]`;
  let meta = document.querySelector<HTMLMetaElement>(selector);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, property);
    document.head.appendChild(meta);
  }
  
  return meta;
}

function getOrCreateLinkTag(rel: string): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  return link;
}

export function updateSEO(data: SEOData) {
  // Update title
  if (data.title) {
    document.title = data.title;
  }

  // Update meta tags
  if (data.description !== undefined) {
    getOrCreateMetaTag('description', 'name').content = data.description;
  }

  if (data.keywords !== undefined) {
    getOrCreateMetaTag('keywords', 'name').content = data.keywords;
  }

  // Update Open Graph tags
  if (data.ogTitle !== undefined) {
    getOrCreateMetaTag('og:title', 'property').content = data.ogTitle;
  }

  if (data.ogDescription !== undefined) {
    getOrCreateMetaTag('og:description', 'property').content = data.ogDescription;
  }

  if (data.ogImage !== undefined) {
    getOrCreateMetaTag('og:image', 'property').content = data.ogImage;
  }

  if (data.ogUrl !== undefined) {
    getOrCreateMetaTag('og:url', 'property').content = data.ogUrl;
  }

  if (data.ogType !== undefined) {
    getOrCreateMetaTag('og:type', 'property').content = data.ogType;
  }

  // Update og:locale
  if (data.ogLocale !== undefined) {
    getOrCreateMetaTag('og:locale', 'property').content = data.ogLocale;
  }

  // Update article metadata
  if (data.articleAuthor !== undefined) {
    getOrCreateMetaTag('article:author', 'property').content = data.articleAuthor;
  }

  if (data.articlePublishedTime !== undefined) {
    getOrCreateMetaTag('article:published_time', 'property').content = data.articlePublishedTime;
  }

  if (data.articleSection !== undefined) {
    getOrCreateMetaTag('article:section', 'property').content = data.articleSection;
  }

  // Update canonical link
  if (data.canonical !== undefined) {
    const canonical = getOrCreateLinkTag('canonical');
    canonical.href = data.canonical;
  }

  // Update hreflang links
  if (data.hreflangLinks !== undefined) {
    // Remove existing hreflang links
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
    
    // Add new hreflang links
    data.hreflangLinks.forEach(({ lang, url }) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Update structured data (JSON-LD)
  if (data.structuredData !== undefined) {
    // Remove existing article structured data
    const existingScript = document.querySelector('script[type="application/ld+json"][data-type="article"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    if (data.structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-type', 'article');
      script.textContent = JSON.stringify(data.structuredData);
      document.head.appendChild(script);
    }
  }
}

export function resetSEO() {
  // Remove article-specific metadata
  const articleAuthorMeta = document.querySelector('meta[property="article:author"]');
  const articleTimeMeta = document.querySelector('meta[property="article:published_time"]');
  const articleSectionMeta = document.querySelector('meta[property="article:section"]');
  if (articleAuthorMeta) articleAuthorMeta.remove();
  if (articleTimeMeta) articleTimeMeta.remove();
  if (articleSectionMeta) articleSectionMeta.remove();

  // Remove hreflang links
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());

  // Remove article structured data
  const articleScript = document.querySelector('script[type="application/ld+json"][data-type="article"]');
  if (articleScript) articleScript.remove();

  updateSEO({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogTitle: DEFAULT_TITLE,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: BASE_URL,
    ogType: 'website',
    canonical: BASE_URL,
  });
}

export function generateMaterialSEO(
  material: {
    title: string;
    subtitle?: string;
    datePublished?: string;
    dateModified?: string;
    categoryTitle: string;
    sectionTitle: string;
    id: {
      category: string;
      section: string;
      slug: string;
      lang: 'ru' | 'en';
    };
  },
  path: string,
  availableLanguages: Array<'ru' | 'en'> = ['ru']
): SEOData {
  const fullTitle = `${material.title} — ${material.categoryTitle}`;
  const description = material.subtitle || `Материал из раздела ${material.sectionTitle} курса ${material.categoryTitle}.`;
  const currentLang = normalizeLang(material.id.lang);
  const url = buildUrlWithLang({ path, lang: currentLang });
  const ogLocale = currentLang === 'ru' ? 'ru_RU' : 'en_US';

  // Generate hreflang links for available languages
  const hreflangLinks = availableLanguages.map((lang) => ({
    lang: lang === 'ru' ? 'ru' : 'en',
    url: buildUrlWithLang({
      path: `/materials/${material.id.category}/${material.id.section}/${material.id.slug}`,
      lang,
    }),
  }));

  // Add x-default hreflang
  if (availableLanguages.length > 1) {
    hreflangLinks.push({
      lang: 'x-default',
      url: buildUrlWithLang({
        path: `/materials/${material.id.category}/${material.id.section}/${material.id.slug}`,
        lang: 'ru',
      }),
    });
  }

  // Generate JSON-LD structured data for article
  const datePublished = material.datePublished;
  const dateModified = material.dateModified ?? material.datePublished;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: material.title,
    description: description,
    author: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: 'https://eduardgagite.github.io'
    },
    publisher: {
      '@type': 'Person',
      name: 'Eduard Gagite',
      url: 'https://eduardgagite.github.io'
    },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    articleSection: material.sectionTitle,
    inLanguage: currentLang,
    image: DEFAULT_OG_IMAGE
  };

  return {
    title: fullTitle,
    description,
    keywords: `${material.categoryTitle}, ${material.sectionTitle}, ${material.title}, backend, разработка`,
    ogTitle: fullTitle,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: url,
    ogType: 'article',
    ogLocale,
    canonical: url,
    articleAuthor: 'Eduard Gagite',
    articlePublishedTime: datePublished,
    articleSection: material.sectionTitle,
    hreflangLinks,
    structuredData
  };
}
