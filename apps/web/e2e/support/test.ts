import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/** The Live Content API stream `<SanityLive />` opens from the browser. */
const LIVE_EVENTS = '**/data/live/events/**';

/**
 * The beacons `@vercel/analytics` and `@vercel/speed-insights` fire on every page view, plus the
 * script both load off `va.vercel-scripts.com` when the app does not run on Vercel — which is
 * exactly the case here, where it is served by a local `next start`.
 */
const ANALYTICS = [
	'**/_vercel/insights/**',
	'**/_vercel/speed-insights/**',
	'**/va.vercel-scripts.com/**',
];

/** The Sanity CDN's images, which the flipbook loads in the browser rather than through `next/image`. */
const SANITY_IMAGES = 'https://cdn.sanity.io/images/**';

/** The smallest valid PNG: one transparent pixel. */
const BLANK_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	'base64',
);

/**
 * The base test with the browser-side noise silenced.
 *
 * MSW only covers the server, so the requests the browser makes on its own are handled here: the
 * live stream is answered with an empty one, the analytics and Speed Insights beacons are dropped,
 * and the TSG-Echo flipbook's page images get a blank pixel.
 */
/**
 * The root element carries `scroll-behavior: smooth`, and an animated scroll moves an element out
 * from under the pointer between Playwright's hit test and the click itself. Every run turns it off.
 *
 * WebKit runs an init script before the root element exists, so appending to it straight away threw
 * there and left `mobile-safari` scrolling smoothly. The style waits for the element in that case.
 */
const DISABLE_SMOOTH_SCROLL = `
	const style = document.createElement('style');
	style.textContent = 'html { scroll-behavior: auto !important; }';
	if (document.documentElement) {
		document.documentElement.append(style);
	} else {
		new MutationObserver((_records, observer) => {
			if (document.documentElement) {
				document.documentElement.append(style);
				observer.disconnect();
			}
		}).observe(document, { childList: true });
	}
`;

/**
 * Answers the Sanity CDN's images with a blank pixel. The shared fixture installs it on every page;
 * a context a spec opens itself has to call it.
 *
 * @param page - The page whose image requests are answered.
 * @returns Nothing.
 */
async function stubSanityImages(page: Page): Promise<void> {
	await page.route(SANITY_IMAGES, async (route) => {
		await route.fulfill({ body: BLANK_PNG, contentType: 'image/png' });
	});
}

const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(DISABLE_SMOOTH_SCROLL);

		await page.route(LIVE_EVENTS, async (route) => {
			await route.fulfill({ body: '', contentType: 'text/event-stream' });
		});

		await stubSanityImages(page);

		await Promise.all(
			ANALYTICS.map(async (pattern) => {
				await page.route(pattern, async (route) => {
					await route.abort();
				});
			}),
		);

		await use(page);
	},
});

export { expect } from '@playwright/test';
export { stubSanityImages, test };
