import test from 'node:test';
import assert from 'node:assert/strict';
import type { MaterialMeta, MaterialsCategory, MaterialsSection, MaterialsTree } from '../../src/materials/loader';
import {
  buildMaterialCanonicalKey,
  buildMaterialRoutePath,
  getAdjacentCourseMaterials,
  getAvailableMaterialLanguages,
} from '../../src/features/materials/article-navigation';

function material(
  slug: string,
  title: string,
  lang: 'ru' | 'en' = 'ru',
  section = 'intro',
): MaterialMeta {
  return {
    title,
    category: 'golang',
    categoryTitle: 'Go',
    section,
    sectionTitle: section === 'intro' ? 'Intro' : 'Core',
    id: {
      category: 'golang',
      section,
      slug,
      lang,
    },
    path: `/content/materials/golang/${section}/${slug}.${lang}.md`,
    contentPath: `/materials-content/golang/${section}/${slug}.${lang}.json`,
  };
}

const first = material('01-what-is-go', 'What is Go');
const second = material('02-installation', 'Installation');
const third = material('03-first-program', 'First program');
const fourth = material('01-concurrency', 'Concurrency', 'ru', 'core');

const section: MaterialsSection = {
  id: 'intro',
  title: 'Intro',
  order: 1,
  materials: [first, second, third],
};

const coreSection: MaterialsSection = {
  id: 'core',
  title: 'Core',
  order: 2,
  materials: [fourth],
};

const category: MaterialsCategory = {
  id: 'golang',
  title: 'Go',
  sections: [section, coreSection],
};

test('getAdjacentCourseMaterials returns previous and next materials for current item', () => {
  assert.deepEqual(getAdjacentCourseMaterials(category, second), {
    currentIndex: 1,
    previous: first,
    next: third,
  });
});

test('getAdjacentCourseMaterials continues across sections and handles boundaries', () => {
  assert.deepEqual(getAdjacentCourseMaterials(category, first), {
    currentIndex: 0,
    previous: undefined,
    next: second,
  });
  assert.deepEqual(getAdjacentCourseMaterials(category, third), {
    currentIndex: 2,
    previous: second,
    next: fourth,
  });
  assert.deepEqual(getAdjacentCourseMaterials(category, fourth), {
    currentIndex: 3,
    previous: third,
    next: undefined,
  });
  assert.deepEqual(getAdjacentCourseMaterials(category, material('99-missing', 'Missing')), {
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
