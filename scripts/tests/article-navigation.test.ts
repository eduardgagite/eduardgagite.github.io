import test from 'node:test';
import assert from 'node:assert/strict';
import type { MaterialMeta, MaterialsSection, MaterialsTree } from '../../src/materials/loader';
import {
  buildMaterialCanonicalKey,
  buildMaterialRoutePath,
  getAdjacentMaterials,
  getAvailableMaterialLanguages,
} from '../../src/features/materials/article-navigation';

function material(slug: string, title: string, lang: 'ru' | 'en' = 'ru'): MaterialMeta {
  return {
    title,
    category: 'golang',
    categoryTitle: 'Go',
    section: 'intro',
    sectionTitle: 'Intro',
    id: {
      category: 'golang',
      section: 'intro',
      slug,
      lang,
    },
    path: `/content/materials/golang/intro/${slug}.${lang}.md`,
    contentPath: `/materials-content/golang/intro/${slug}.${lang}.json`,
  };
}

const first = material('01-what-is-go', 'What is Go');
const second = material('02-installation', 'Installation');
const third = material('03-first-program', 'First program');

const section: MaterialsSection = {
  id: 'intro',
  title: 'Intro',
  order: 1,
  materials: [first, second, third],
};

test('getAdjacentMaterials returns previous and next materials for current item', () => {
  assert.deepEqual(getAdjacentMaterials(section, second), {
    currentIndex: 1,
    previous: first,
    next: third,
  });
});

test('getAdjacentMaterials handles boundaries and missing material', () => {
  assert.deepEqual(getAdjacentMaterials(section, first), {
    currentIndex: 0,
    previous: undefined,
    next: second,
  });
  assert.deepEqual(getAdjacentMaterials(section, third), {
    currentIndex: 2,
    previous: second,
    next: undefined,
  });
  assert.deepEqual(getAdjacentMaterials(section, material('99-missing', 'Missing')), {
    currentIndex: -1,
  });
});

test('material route helpers use canonical material identity without language prefix', () => {
  const english = material('01-what-is-go', 'What is Go', 'en');

  assert.equal(buildMaterialRoutePath(english), '/materials/golang/intro/01-what-is-go');
  assert.equal(buildMaterialCanonicalKey(english), 'golang/intro/01-what-is-go');
});

test('getAvailableMaterialLanguages reads canonical language variants and falls back to material language', () => {
  const tree: MaterialsTree = {
    categories: [],
    byId: {},
    availableLanguages: {
      'golang/intro/01-what-is-go': ['ru', 'en'],
    },
  };

  assert.deepEqual(getAvailableMaterialLanguages({ material: first, tree }), ['ru', 'en']);
  assert.deepEqual(getAvailableMaterialLanguages({ material: second, tree }), ['ru']);
});
