# SEO and Internationalization Improvements

## Summary

All requested SEO and internationalization improvements have been successfully implemented:

## 1. ✅ Dynamic `lang` attribute in `<html>`

**Location:** `src/i18n/index.ts`

- The `lang` attribute was already being dynamically updated when the language changes
- Enhanced to also update `og:locale` meta tag when language switches between `ru` and `en`
- Updates happen automatically via i18next's `languageChanged` event

```typescript
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  updateOgLocale(lng); // ru → ru_RU, en → en_US
});
```

## 2. ✅ JSON-LD Structured Data for Articles

**Location:** `src/utils/seo.ts`

- Added `Article` schema with full metadata:
  - `headline`: Article title
  - `description`: Article description
  - `author`: Eduard Gagite (Person schema)
  - `publisher`: Eduard Gagite (Person schema)
  - `datePublished`: Publication date
  - `dateModified`: Last modified date
  - `articleSection`: Section/category name
  - `inLanguage`: Current language (ru/en)
  - `image`: OG image
  - `mainEntityOfPage`: Article URL

- Structured data is dynamically injected into `<head>` when viewing an article
- Automatically removed when navigating away from article pages

## 3. ✅ Dynamic `og:locale` Updates

**Location:** `src/i18n/index.ts` and `src/utils/seo.ts`

- `og:locale` now updates automatically when user switches language:
  - Russian: `ru_RU`
  - English: `en_US`
- Article pages set the correct locale based on the material's language
- Main pages use the current UI language

## 4. ✅ Hreflang Links for Multilingual Materials

**Location:** `src/utils/seo.ts` and `src/materials/loader.ts`

- Detects which languages are available for each material
- Generates `<link rel="alternate" hreflang="...">` tags for:
  - Each available language version (`ru`, `en`)
  - `x-default` for materials with multiple languages
- Links point to the same material in different languages
- Automatically cleaned up when navigating away

Example output:
```html
<link rel="alternate" hreflang="ru" href="https://eduardgagite.github.io/materials/redis/intro/01-what-is-redis?lang=ru">
<link rel="alternate" hreflang="en" href="https://eduardgagite.github.io/materials/redis/intro/01-what-is-redis?lang=en">
<link rel="alternate" hreflang="x-default" href="https://eduardgagite.github.io/materials/redis/intro/01-what-is-redis">
```

## 5. ✅ Article Open Graph Metadata

**Location:** `src/utils/seo.ts`

Added article-specific Open Graph tags:
- `og:type`: Set to `"article"` for material pages, `"website"` for others
- `article:author`: "Eduard Gagite"
- `article:published_time`: Publication date (ISO format)
- `article:section`: Section/category name

These tags are automatically added when viewing an article and removed when navigating away.

## Technical Implementation Details

### Enhanced SEO Interface

```typescript
interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;              // NEW: article/website
  ogLocale?: string;            // NEW: ru_RU/en_US
  canonical?: string;
  articleAuthor?: string;       // NEW
  articlePublishedTime?: string; // NEW
  articleSection?: string;      // NEW
  hreflangLinks?: Array<{       // NEW
    lang: string;
    url: string;
  }>;
  structuredData?: object;      // NEW: JSON-LD
}
```

### Materials Tree Enhancement

Added `availableLanguages` map to track which language versions exist for each material:

```typescript
interface MaterialsTree {
  categories: MaterialsCategory[];
  byId: Record<string, MaterialWithContent>;
  availableLanguages: Record<string, Array<'ru' | 'en'>>; // NEW
}
```

### SEO Cleanup

The `resetSEO()` function now properly cleans up all article-specific metadata:
- Removes `article:*` meta tags
- Removes hreflang links
- Removes JSON-LD structured data for articles
- Resets `og:type` to `"website"`

## Testing

Build completed successfully with no errors:
```bash
npm run build
✓ built in 1.01s
```

All TypeScript types are correct and the application compiles without issues.

## Benefits

1. **Better SEO**: Search engines can properly understand article structure and relationships
2. **Multilingual Support**: Proper hreflang tags help search engines serve the right language version
3. **Rich Snippets**: JSON-LD structured data enables rich search results
4. **Social Sharing**: Enhanced Open Graph tags improve how articles appear when shared
5. **Dynamic Updates**: All metadata updates automatically when language or page changes
