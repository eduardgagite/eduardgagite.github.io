import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, '..', '..');
const ruLocalePath = path.join(rootDir, 'src', 'i18n', 'locales', 'ru', 'common.json');
const enLocalePath = path.join(rootDir, 'src', 'i18n', 'locales', 'en', 'common.json');

function flattenKeys(value, prefix = '', out = new Set()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return out;
  }

  for (const [key, nested] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    out.add(nextPrefix);
    flattenKeys(nested, nextPrefix, out);
  }

  return out;
}

async function readLocale(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

test('ru/en locale keysets are identical', async () => {
  const [ruLocale, enLocale] = await Promise.all([readLocale(ruLocalePath), readLocale(enLocalePath)]);
  const ruKeys = flattenKeys(ruLocale);
  const enKeys = flattenKeys(enLocale);

  const missingInEn = [...ruKeys].filter((key) => !enKeys.has(key)).sort();
  const missingInRu = [...enKeys].filter((key) => !ruKeys.has(key)).sort();

  assert.deepEqual(missingInEn, [], `Missing keys in en locale: ${missingInEn.join(', ')}`);
  assert.deepEqual(missingInRu, [], `Missing keys in ru locale: ${missingInRu.join(', ')}`);
});

test('required UI keys exist in locales', async () => {
  const ruLocale = await readLocale(ruLocalePath);
  const keys = flattenKeys(ruLocale);
  const required = [
    'common.loading',
    'codeBlock.copy',
    'codeBlock.copied',
    'materials.emptyState',
    'materials.loadingMaterial',
    'materials.loadError',
    'lang.switch',
  ];

  const missing = required.filter((key) => !keys.has(key));
  assert.deepEqual(missing, [], `Missing required locale keys: ${missing.join(', ')}`);
});
