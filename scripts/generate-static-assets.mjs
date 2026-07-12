import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const ROOT_DIR = path.resolve(new URL('..', import.meta.url).pathname);
const SOURCE_FILE = path.join(ROOT_DIR, 'public', 'images', 'og-image.svg');
const OUTPUT_FILE = path.join(ROOT_DIR, 'public', 'images', 'og-image.png');

async function main() {
  const source = await readFile(SOURCE_FILE);
  const renderer = new Resvg(source, {
    background: 'rgba(11, 12, 16, 1)',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });
  const rendered = renderer.render();

  if (rendered.width !== 1200 || rendered.height !== 630) {
    throw new Error(`Unexpected OG image size: ${rendered.width}x${rendered.height}`);
  }

  await writeFile(OUTPUT_FILE, rendered.asPng());
  console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_FILE)} (${rendered.width}x${rendered.height})`);
}

main().catch((error) => {
  console.error('Failed to generate static assets:', error);
  process.exit(1);
});
