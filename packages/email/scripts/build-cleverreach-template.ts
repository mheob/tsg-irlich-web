// Runs through `tsx` rather than plain Node: the render pulls in the JSX email templates,
// which Node's type stripping does not transform.
// oxlint-disable node/no-top-level-await -- build script for a private package, never `require`d

import { mkdir, writeFile } from 'node:fs/promises';

import { renderNewsletterTemplate } from '../lib/render-newsletter';

const outputPath = new URL('../dist/newsletter.cleverreach.html', import.meta.url);

await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(outputPath, await renderNewsletterTemplate());

console.info(`CleverReach template written to ${outputPath.pathname}`);
