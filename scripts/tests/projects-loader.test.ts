import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProjectMeta } from '../../src/projects/loader';
import { buildProjectsList, parseProjectsIndexPayload } from '../../src/projects/loader';

function project({
  slug,
  title,
  lang = 'ru',
  order = 1,
  status = 'production',
  code = 'private',
  kind = 'work',
  stack = ['Go'],
}: {
  slug: string;
  title: string;
  lang?: 'ru' | 'en';
  order?: number;
  status?: ProjectMeta['status'];
  code?: ProjectMeta['code'];
  kind?: ProjectMeta['kind'];
  stack?: string[];
}): ProjectMeta {
  return {
    title,
    summary: `${title} summary`,
    order,
    status,
    code,
    kind,
    stack,
    id: { slug, lang },
    contentPath: `/projects-content/${slug}.${lang}.json`,
  };
}

function rawEntry(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Messenger',
    summary: 'Backend of a messenger',
    order: 1,
    status: 'active',
    code: 'private',
    kind: 'work',
    stack: ['Go', 'PostgreSQL'],
    id: { slug: 'aembal-messenger', lang: 'ru' },
    contentPath: '/projects-content/aembal-messenger.ru.json',
    ...overrides,
  };
}

test('parseProjectsIndexPayload accepts a valid payload and keeps optional fields', () => {
  const parsed = parseProjectsIndexPayload({
    entries: [
      rawEntry({
        period: '2025 — н. в.',
        role: 'соло-разработка',
        shots: [{ src: '/images/projects/a/shot-01.svg', caption: 'Список чатов' }],
      }),
    ],
  });

  assert.equal(parsed.entries.length, 1);
  const entry = parsed.entries[0];
  assert.equal(entry.id.slug, 'aembal-messenger');
  assert.equal(entry.period, '2025 — н. в.');
  assert.equal(entry.role, 'соло-разработка');
  assert.deepEqual(entry.shots, [{ src: '/images/projects/a/shot-01.svg', caption: 'Список чатов' }]);
  assert.equal(entry.codeUrl, undefined);
  assert.equal(entry.liveUrl, undefined);
});

test('parseProjectsIndexPayload rejects malformed payloads and entries', () => {
  assert.throws(() => parseProjectsIndexPayload(null), /Invalid projects index payload/);
  assert.throws(() => parseProjectsIndexPayload({}), /Invalid projects index payload/);
  assert.throws(() => parseProjectsIndexPayload({ entries: [42] }), /Invalid project index entry/);

  assert.throws(
    () => parseProjectsIndexPayload({ entries: [rawEntry({ status: 'shipped' })] }),
    /Invalid project status/,
  );
  assert.throws(
    () => parseProjectsIndexPayload({ entries: [rawEntry({ code: 'secret' })] }),
    /Invalid project code visibility/,
  );
  assert.throws(() => parseProjectsIndexPayload({ entries: [rawEntry({ kind: 'hobby' })] }), /Invalid project kind/);
  assert.throws(() => parseProjectsIndexPayload({ entries: [rawEntry({ stack: [] })] }), /Invalid project stack/);
  assert.throws(
    () => parseProjectsIndexPayload({ entries: [rawEntry({ stack: ['Go', 7] })] }),
    /Invalid project stack/,
  );
  assert.throws(() => parseProjectsIndexPayload({ entries: [rawEntry({ order: '1' })] }), /Invalid project order/);
  assert.throws(
    () => parseProjectsIndexPayload({ entries: [rawEntry({ id: { slug: 'x', lang: 'de' } })] }),
    /Invalid project language/,
  );
  assert.throws(() => parseProjectsIndexPayload({ entries: [rawEntry({ title: 5 })] }), /Invalid project field: title/);
  assert.throws(
    () => parseProjectsIndexPayload({ entries: [rawEntry({ shots: [{ src: '/a.svg' }] })] }),
    /Invalid project field: caption/,
  );
  assert.throws(() => parseProjectsIndexPayload({ entries: [rawEntry({ shots: 'no' })] }), /Invalid project shots/);
});

test('buildProjectsList sorts by order and reports available languages', () => {
  const list = buildProjectsList(
    [
      project({ slug: 'infrastructure', title: 'Инфраструктура', order: 8 }),
      project({ slug: 'aembal-messenger', title: 'Мессенджер', order: 1 }),
      project({ slug: 'darqima', title: 'Darqima', order: 2 }),
    ],
    'ru',
  );

  assert.deepEqual(
    list.projects.map((item) => item.id.slug),
    ['aembal-messenger', 'darqima', 'infrastructure'],
  );
  assert.deepEqual(list.availableLanguages['darqima'], ['ru']);
});

test('buildProjectsList prefers the requested language and falls back when it is missing', () => {
  const entries = [
    project({ slug: 'aembal-messenger', title: 'Мессенджер', lang: 'ru', order: 1 }),
    project({ slug: 'aembal-messenger', title: 'Messenger', lang: 'en', order: 1 }),
    project({ slug: 'darqima', title: 'Darqima', lang: 'ru', order: 2 }),
  ];

  const en = buildProjectsList(entries, 'en');
  assert.equal(en.projects.find((item) => item.id.slug === 'aembal-messenger')?.title, 'Messenger');
  // Кейсы существуют только на ru — при UI en отдаём русский вариант, а не прячем проект.
  const fallback = en.projects.find((item) => item.id.slug === 'darqima');
  assert.equal(fallback?.title, 'Darqima');
  assert.equal(fallback?.id.lang, 'ru');
  assert.deepEqual(en.availableLanguages['aembal-messenger'], ['ru', 'en']);

  const ru = buildProjectsList(entries, 'ru');
  assert.equal(ru.projects.find((item) => item.id.slug === 'aembal-messenger')?.title, 'Мессенджер');
});
