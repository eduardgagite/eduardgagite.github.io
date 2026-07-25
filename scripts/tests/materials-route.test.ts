import test from 'node:test';
import assert from 'node:assert/strict';
import type { MaterialMeta, MaterialsTree } from '../../src/materials/loader';
import {
  buildSectionStateKey,
  parseMaterialsSegments,
  parseStoredMaterialsPath,
  resolveMaterialsRoute,
} from '../../src/features/materials/route';

function material(category: string, section: string, slug: string, title: string): MaterialMeta {
  return {
    title,
    category,
    categoryTitle: category.toUpperCase(),
    section,
    sectionTitle: section.toUpperCase(),
    id: {
      category,
      section,
      slug,
      lang: 'ru',
    },
    path: `/content/materials/${category}/${section}/${slug}.ru.md`,
    contentPath: `/materials-content/${category}/${section}/${slug}.ru.json`,
  };
}

const firstIntro = material('golang', 'intro', '01-what-is-go', 'What is Go');
const secondIntro = material('golang', 'intro', '02-installation', 'Installation');
const dockerIntro = material('docker', 'intro', '01-docker', 'Docker');

const tree: MaterialsTree = {
  categories: [
    {
      id: 'golang',
      title: 'Go',
      sections: [
        {
          id: 'intro',
          title: 'Intro',
          order: 1,
          materials: [firstIntro, secondIntro],
        },
        {
          id: 'empty',
          title: 'Empty',
          order: 2,
          materials: [],
        },
      ],
    },
    {
      id: 'docker',
      title: 'Docker',
      sections: [
        {
          id: 'intro',
          title: 'Intro',
          order: 1,
          materials: [dockerIntro],
        },
      ],
    },
  ],
  byId: {},
  availableLanguages: {},
};

test('parseMaterialsSegments normalizes splat path values', () => {
  assert.deepEqual(parseMaterialsSegments(undefined), []);
  assert.deepEqual(parseMaterialsSegments(''), []);
  assert.deepEqual(parseMaterialsSegments('/golang//intro/'), ['golang', 'intro']);
});

test('resolveMaterialsRoute resolves root, course pages, articles, and misses', () => {
  assert.deepEqual(resolveMaterialsRoute([], tree), { type: 'root' });

  const course = resolveMaterialsRoute(['golang'], tree);
  assert.equal(course.type, 'category');
  if (course.type === 'category') {
    assert.equal(course.category.id, 'golang');
  }

  assert.deepEqual(resolveMaterialsRoute(['golang', 'intro'], tree), {
    type: 'redirect',
    path: '/materials/golang/intro/01-what-is-go',
  });

  assert.deepEqual(resolveMaterialsRoute(['golang', 'empty'], tree), { type: 'not-found' });
  assert.deepEqual(resolveMaterialsRoute(['missing'], tree), { type: 'not-found' });
  assert.deepEqual(resolveMaterialsRoute(['golang', 'intro', 'missing'], tree), { type: 'not-found' });
  assert.deepEqual(resolveMaterialsRoute(['golang', 'intro', '01-what-is-go', 'extra'], tree), { type: 'not-found' });

  const article = resolveMaterialsRoute(['golang', 'intro', '02-installation'], tree);
  assert.equal(article.type, 'article');
  if (article.type === 'article') {
    assert.equal(article.category.id, 'golang');
    assert.equal(article.section.id, 'intro');
    assert.equal(article.material.id.slug, '02-installation');
  }
});

test('parseStoredMaterialsPath accepts only materials paths and strips query/hash', () => {
  assert.deepEqual(parseStoredMaterialsPath('/materials/golang/intro/01-what-is-go?lang=ru#top'), [
    'golang',
    'intro',
    '01-what-is-go',
  ]);
  assert.deepEqual(parseStoredMaterialsPath('https://eduardgagite.github.io/materials/docker/intro/01-docker'), [
    'docker',
    'intro',
    '01-docker',
  ]);
  assert.equal(parseStoredMaterialsPath('/not-materials/golang'), null);
  assert.equal(parseStoredMaterialsPath('::::'), null);
});

test('buildSectionStateKey avoids same-section collisions across categories', () => {
  assert.equal(buildSectionStateKey('golang', 'intro'), 'golang/intro');
  assert.notEqual(buildSectionStateKey('golang', 'intro'), buildSectionStateKey('docker', 'intro'));
});
