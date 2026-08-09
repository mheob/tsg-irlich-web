// oxlint-disable node/no-top-level-await -- build script for a private package, never `require`d

import { renderNewsletterTemplate } from '../lib/render-newsletter';

const outputPath = new URL('../dist/newsletter.cleverreach.html', import.meta.url);

await Bun.write(outputPath, await renderNewsletterTemplate());

console.info(`CleverReach template written to ${outputPath.pathname}`);
