import type { Locator, Page } from '@playwright/test';

import { expect } from './test';

/**
 * How long a comparison may take. The default assertion timeout is 10s, and the mobile home page is
 * nearly 17,000px tall — WebKit stitches a full-page shot of that from scrolled slices, and taking
 * the two consecutive ones Playwright needs does not fit in the default budget on a slow machine.
 */
const SCREENSHOT_TIMEOUT_MS = 30_000;

/**
 * Everything that keeps moving after the page has settled.
 *
 * `animations: 'disabled'` already freezes CSS animations, transitions and Web Animations at capture
 * time, but it does not touch a delay that is still counting down, and it leaves the text caret
 * blinking in the contact form's inputs. Both are pinned here instead.
 */
const FREEZE_UI = `
	*, *::before, *::after {
		animation-delay: -1ms !important;
		animation-duration: 1ms !important;
		animation-iteration-count: 1 !important;
		caret-color: transparent !important;
		transition-delay: 0s !important;
		transition-duration: 0s !important;
	}
`;

/**
 * Keeps every intersection observer silent.
 *
 * The counters in the stats section count up on a spring once an observer reports them visible, and
 * how far that spring has come when the shot is taken depends on when the browser scheduled its
 * animation frames. Waiting it out does not help: under load a page can go a long time between
 * frames while timers keep firing, so the number looks settled at 97% of its target — which is
 * exactly how CI captured `58+` against a baseline holding `60+`.
 *
 * An observer that never reports leaves the counters at the value the server rendered, and that
 * value is the same in every run. `useInView` in `number-ticker.tsx` is the only intersection
 * observer the application uses today; a reveal-on-scroll pattern added later would be captured in
 * its hidden state and needs this stub revisited.
 */
const SILENCE_OBSERVED_ELEMENTS = `
	class SilentIntersectionObserver {
		constructor() {
			this.root = null;
			this.rootMargin = '0px';
			this.thresholds = [0];
		}

		disconnect() {}
		observe() {}
		takeRecords() { return []; }
		unobserve() {}
	}

	window.IntersectionObserver = SilentIntersectionObserver;
`;

/**
 * Turns every deferred image into an eager one.
 *
 * Flipping the attribute starts the request there and then. A full-page screenshot in Chromium
 * captures beyond the viewport without scrolling, so an image still waiting behind `loading="lazy"`
 * would be captured as a blank box. It also does not go through an intersection observer, which the
 * screenshot environment has silenced.
 *
 * @param page - The page whose images to load.
 * @returns Nothing.
 */
async function loadImagesEagerly(page: Page): Promise<void> {
	await page.evaluate(() => {
		for (const image of document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
			image.loading = 'eager';
		}
	});
}

/**
 * Waits until the fonts and every image the page actually renders have finished loading.
 *
 * `complete` is the only condition checked, not `naturalWidth`: an image that fails to decode is
 * `complete` as well, and waiting for a width that never arrives would turn a broken asset into a
 * timeout instead of a visible diff.
 *
 * An image without a layout box is skipped. The responsive markup hides whole images per breakpoint,
 * and WebKit never starts the request for a `display: none` image — waiting for one of those to
 * complete is waiting forever, and it is not in the screenshot either way.
 *
 * @param page - The page whose assets to wait for.
 * @returns Nothing.
 */
async function waitForPaintedAssets(page: Page): Promise<void> {
	await page.evaluate(async () => {
		await document.fonts.ready;
	});

	await page.waitForFunction(() =>
		[...document.querySelectorAll('img')].every(
			(img) => img.complete || img.getClientRects().length === 0,
		),
	);
}

/**
 * The regions whose pixels come from the wall clock rather than from the fixtures.
 *
 * Only the footer's copyright line qualifies: every date on a page is content and arrives from the
 * recorded Sanity responses, but `©<year>` is rendered from `new Date()` and would turn every New
 * Year's Eve into a red suite.
 *
 * @param page - The page being captured.
 * @returns The locators to mask out of the screenshot.
 */
function clockDependentRegions(page: Page): Locator[] {
	return [page.getByRole('contentinfo').getByText(/^©\s*\d{4}/u)];
}

/**
 * Installs the page-level stubs a screenshot needs, before any application code runs.
 *
 * Call it from a `beforeEach` — `addInitScript` only affects navigations that come after it, and it
 * is deliberately not part of the shared `test` fixture: the other suites should see the page the
 * way a visitor does, animations included.
 *
 * @param page - The page to prepare.
 * @returns Nothing.
 */
export async function installScreenshotEnvironment(page: Page): Promise<void> {
	await page.addInitScript(SILENCE_OBSERVED_ELEMENTS);
}

/**
 * Captures the full page and compares it against its committed baseline.
 *
 * @param page - The page to capture, already navigated and waited for.
 * @param name - The baseline's file name without extension, e.g. `home`.
 * @returns Nothing.
 */
export async function expectPageToMatchBaseline(page: Page, name: string): Promise<void> {
	await page.addStyleTag({ content: FREEZE_UI });
	await loadImagesEagerly(page);
	await waitForPaintedAssets(page);

	await expect(page).toHaveScreenshot(`${name}.png`, {
		fullPage: true,
		mask: clockDependentRegions(page),
		timeout: SCREENSHOT_TIMEOUT_MS,
	});
}
