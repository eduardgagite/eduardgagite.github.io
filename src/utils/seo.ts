interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

const DEFAULT_TITLE = 'Eduard Gagite — Backend Developer';
const DEFAULT_DESCRIPTION = 'Backend-разработчик. Пишу на Go, работаю с Kafka, RabbitMQ, Docker, gRPC. Делюсь знаниями: курсы по Redis, Docker и другим технологиям.';
const DEFAULT_OG_IMAGE = 'https://eduardgagite.github.io/images/og-image.png';
const BASE_URL = 'https://eduardgagite.github.io';

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

  // Update canonical link
  if (data.canonical !== undefined) {
    const canonical = getOrCreateLinkTag('canonical');
    canonical.href = data.canonical;
  }
}

export function resetSEO() {
  updateSEO({
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ogTitle: DEFAULT_TITLE,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: BASE_URL,
    canonical: BASE_URL,
  });
}

export function generateMaterialSEO(material: {
  title: string;
  subtitle?: string;
  categoryTitle: string;
  sectionTitle: string;
}, path: string): SEOData {
  const fullTitle = `${material.title} — ${material.categoryTitle}`;
  const description = material.subtitle || `Материал из раздела ${material.sectionTitle} курса ${material.categoryTitle}.`;
  const url = `${BASE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    keywords: `${material.categoryTitle}, ${material.sectionTitle}, ${material.title}, backend, разработка`,
    ogTitle: fullTitle,
    ogDescription: description,
    ogImage: DEFAULT_OG_IMAGE,
    ogUrl: url,
    canonical: url,
  };
}

