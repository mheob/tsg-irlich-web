import { test as base } from '@playwright/test';

/** The Live Content API stream `<SanityLive />` opens from the browser. */
const LIVE_EVENTS = '**/data/live/events/**';

/** The beacons `@vercel/analytics` fires on every page view. */
const ANALYTICS = ['**/_vercel/insights/**', '**/va.vercel-scripts.com/**'];

/**
 * The base test with the browser-side noise silenced.
 *
 * MSW only covers the server, so the two requests the browser makes on its own are handled here:
 * the live stream is answered with an empty one, the analytics beacons are dropped.
 */
/**
 * The root element carries `scroll-behavior: smooth`, and an animated scroll moves an element out
 * from under the pointer between Playwright's hit test and the click itself. Every run turns it off.
 */
const DISABLE_SMOOTH_SCROLL = `
	const style = document.createElement('style');
	style.textContent = 'html { scroll-behavior: auto !important; }';
	document.documentElement.append(style);
`;

const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(DISABLE_SMOOTH_SCROLL);

		await page.route(LIVE_EVENTS, async (route) => {
			await route.fulfill({ body: '', contentType: 'text/event-stream' });
		});

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
export { test };
