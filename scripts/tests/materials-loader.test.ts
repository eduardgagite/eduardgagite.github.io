import test from 'node:test';
import assert from 'node:assert/strict';
import type { MaterialMeta } from '../../src/materials/loader';
import {
  buildMaterialsTree,
  materialKey,
  parseMaterialContentPayload,
  parseMaterialsIndexPayload,
} from '../../src/materials/loader';

function material({
  slug,
  title,
  lang = 'ru',
  category = 'golang',
  categoryTitle = 'Go',
  section = 'intro',
  sectionTitle = 'Intro',
  sectionOrder = 1,
  order = 1,
}: {
  slug: string;
  title: string;
  lang?: 'ru' | 'en';
  category?: string;
  categoryTitle?: string;
  section?: string;
  sectionTitle?: string;
  sectionOrder?: number;
  order?: number;
}): MaterialMeta {
  return {
    title,
    category,
    categoryTitle,
    section,
    sectionTitle,
    sectionOrder,
    order,
    tags: ['go'],
    id: {
      category,
      section,
      slug,
      lang,
    },
    path: `/content/materials/${category}/${section}/${slug}.${lang}.md`,
    contentPath: `/materials-content/${category}/${section}/${slug}.${lang}.json`,
  };
}

const ruIntro = material({ slug: '01-what-is-go', title: 'Что такое Go', lang: 'ru' });
const enIntro = material({ slug: '01-what-is-go', title: 'What is Go', lang: 'en' });
const secondIntro = material({ slug: '02-installation', title: 'Installation', order: 2 });
const advanced = material({
  slug: '01-reflection',
  title: 'Reflection',
  section: 'advanced',
  sectionTitle: 'Advanced',
  sectionOrder: 2,
});

test('parseMaterialsIndexPayload validates and returns material entries', () => {
  assert.deepEqual(parseMaterialsIndexPayload({ entries: [ruIntro] }), { entries: [ruIntro] });
});

test('parseMaterialsIndexPayload rejects malformed index entries', () => {
  assert.throws(() => parseMaterialsIndexPayload({}), /Invalid materials index payload/);
  assert.throws(() => parseMaterialsIndexPayload({ entries: [{ ...ruIntro, title: 42 }] }), /title/);
  assert.throws(
    () => parseMaterialsIndexPayload({ entries: [{ ...ruIntro, id: { ...ruIntro.id, lang: 'de' } }] }),
    /language/,
  );
  assert.throws(
    () => parseMaterialsIndexPayload({ entries: [{ ...ruIntro, id: { ...ruIntro.id, section: 'advanced' } }] }),
    /does not match/,
  );
  assert.throws(() => parseMaterialsIndexPayload({ entries: [{ ...ruIntro, tags: ['go', 42] }] }), /tags/);
  assert.throws(() => parseMaterialsIndexPayload({ entries: [{ ...ruIntro, order: Number.NaN }] }), /order/);
});

test('parseMaterialContentPayload validates content payload shape', () => {
  assert.equal(parseMaterialContentPayload({ content: '# Title\n' }), '# Title\n');
  assert.throws(() => parseMaterialContentPayload({ content: 42 }), /Invalid material content payload/);
  assert.throws(() => parseMaterialContentPayload(null), /Invalid material content payload/);
});

test('buildMaterialsTree prefers requested language and keeps language variants sorted', () => {
  const tree = buildMaterialsTree([enIntro, advanced, secondIntro, ruIntro], 'ru');

  assert.deepEqual(
    tree.categories.map((category) => category.id),
    ['golang'],
  );
  assert.deepEqual(
    tree.categories[0].sections.map((section) => section.id),
    ['intro', 'advanced'],
  );
  assert.deepEqual(
    tree.categories[0].sections[0].materials.map((entry) => entry.id.slug),
    ['01-what-is-go', '02-installation'],
  );
  assert.equal(tree.byId[materialKey(ruIntro.id)].title, 'Что такое Go');
  assert.deepEqual(tree.availableLanguages['golang/intro/01-what-is-go'], ['ru', 'en']);
});

test('buildMaterialsTree falls back to available language when requested language is missing', () => {
  const tree = buildMaterialsTree([enIntro], 'ru');

  assert.equal(tree.categories[0].sections[0].materials[0].id.lang, 'en');
  assert.deepEqual(tree.availableLanguages['golang/intro/01-what-is-go'], ['en']);
});
