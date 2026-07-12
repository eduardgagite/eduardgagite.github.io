import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateReadingTimeMinutes,
  extractArticleHeadings,
  slugifyHeading,
} from '../../src/components/markdown/article-metadata';

test('extractArticleHeadings builds stable ids and ignores fenced code', () => {
  const markdown = [
    '# Article title',
    '',
    '## Introduction',
    '### `Code` and **data**',
    '## Introduction',
    '```md',
    '## Not a real heading',
    '```',
  ].join('\n');

  assert.deepEqual(extractArticleHeadings(markdown), [
    { depth: 2, id: 'introduction', line: 3, text: 'Introduction' },
    { depth: 3, id: 'code-and-data', line: 4, text: 'Code and data' },
    { depth: 2, id: 'introduction-2', line: 5, text: 'Introduction' },
  ]);
});

test('slugifyHeading preserves readable unicode slugs', () => {
  assert.equal(slugifyHeading('Что такое Go?'), 'что-такое-go');
});

test('estimateReadingTimeMinutes rounds up and never returns zero', () => {
  assert.equal(estimateReadingTimeMinutes(''), 1);
  assert.equal(estimateReadingTimeMinutes('word '.repeat(401)), 3);
});
