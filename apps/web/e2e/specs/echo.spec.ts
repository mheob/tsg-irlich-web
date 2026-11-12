import type { Locator } from '@playwright/test';

import { openNewestEchoIssue, waitForPage } from '../support/navigation';
import { expect, stubSanityImages, test } from '../support/test';

/** What a box may move between the cover and the book: sub-pixel rounding, nothing more. */
const TOLERANCE = 2;

/** Both orientations of the book, and the width where it switches from one to the other. */
const VIEWPORTS = [
	{ height: 800, name: 'a laptop', width: 1280 },
	{ height: 375, name: 'a phone held sideways', width: 667 },
	{ height: 844, name: 'a phone', width: 390 },
] as const;

/** The navigation bar once the page is scrolled; it stays fixed over the top of the book. */
const FIXED_BAR_HEIGHT = 64;

/** The engine's longest page turn, in milliseconds. */
const TURN_DURATION = 1000;

interface Box {
	height: number;
	width: number;
	x: number;
	y: number;
}

/**
 * The box of an element in the page, independent of the scroll position.
 *
 * @param locator - The element.
 * @returns Its box.
 */
async function boxOf(locator: Locator): Promise<Box> {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error('The element has no box.');
	}
	return box;
}

test.describe('a tsg-echo issue', () => {
	test.skip(({ isMobile }) => isMobile, 'The chromium run sets every viewport itself.');

	for (const viewport of VIEWPORTS) {
		// The server renders the cover in the box the book will take; the book must land exactly
		// there, and the download button below it must not move.
		test(`puts the book where the cover was on ${viewport.name}`, async ({ browser, page }) => {
			await page.setViewportSize(viewport);
			await openNewestEchoIssue(page);
			const url = page.url();
			await page.goto(url);
			await waitForPage(page);
			await page.getByRole('button', { name: 'Nächste Seite' }).waitFor();
			const leaf = await boxOf(page.getByAltText(/^Seite 1 von \d+$/u));
			const download = await boxOf(page.getByRole('link', { name: /PDF herunterladen/u }));

			// What a visitor sees before the book has loaded is what a browser without JavaScript sees.
			const context = await browser.newContext({ javaScriptEnabled: false, viewport });
			const before = await context.newPage();
			await stubSanityImages(before);
			await before.goto(url);
			const cover = await boxOf(before.getByAltText(/^Titelseite von /u));
			const downloadBefore = await boxOf(before.getByRole('link', { name: /PDF herunterladen/u }));
			await context.close();

			expect(leaf.width).toBeGreaterThan(viewport.width / 3);
			expect(Math.abs(leaf.x - cover.x)).toBeLessThanOrEqual(TOLERANCE);
			expect(Math.abs(leaf.y - cover.y)).toBeLessThanOrEqual(TOLERANCE);
			expect(Math.abs(leaf.width - cover.width)).toBeLessThanOrEqual(TOLERANCE);
			expect(Math.abs(leaf.height - cover.height)).toBeLessThanOrEqual(TOLERANCE);
			expect(Math.abs(download.y - downloadBefore.y)).toBeLessThanOrEqual(TOLERANCE);
		});
	}

	// WEB-436: on a wide but low screen the book grew taller than the screen, and the controls below
	// it fell out of view as soon as the book was read from its top.
	test('fits the book and its controls on a low laptop screen', async ({ page }) => {
		const viewport = { height: 720, width: 1366 };
		await page.setViewportSize(viewport);
		await openNewestEchoIssue(page);
		const next = page.getByRole('button', { name: 'Nächste Seite' });
		await next.waitFor();

		const book = await boxOf(page.getByLabel(/zum Durchblättern$/u));
		const controls = await boxOf(next);

		expect(controls.y + controls.height - book.y).toBeLessThanOrEqual(
			viewport.height - FIXED_BAR_HEIGHT,
		);
	});

	// A click or a drag meant for the lens must not turn the page under it.
	test('turns no page by a click on it while the lens is on', async ({ page }) => {
		await page.setViewportSize(VIEWPORTS[0]);
		await openNewestEchoIssue(page);
		const lens = page.getByRole('button', { name: 'Lupe' });
		const indicator = page.getByText(/^Seiten? \d+(?:–\d+)? von \d+$/u);
		await expect(indicator).toHaveText(/^Seite 1 von/u);
		// The mouse only reaches what is on screen. With the controls in view the whole book is, and
		// clicking the toggle scrolls nothing, which would move the page away from the corner.
		await lens.scrollIntoViewIfNeeded();
		const leaf = await boxOf(page.getByAltText(/^Seite 1 von \d+$/u));
		const corner = { x: leaf.x + leaf.width - 10, y: leaf.y + leaf.height - 10 };

		await lens.click();
		await expect(lens).toHaveAttribute('aria-pressed', 'true');
		await page.mouse.click(corner.x, corner.y);
		// A turn the click had started would have reached the next spread by now.
		await page.waitForTimeout(TURN_DURATION);

		await expect(indicator).toHaveText(/^Seite 1 von/u);

		await lens.click();
		await page.mouse.click(corner.x, corner.y);

		await expect(indicator).not.toHaveText(/^Seite 1 von/u);
	});
});

test.describe('the tsg-echo archive files', () => {
	test.skip(({ isMobile }) => isMobile, 'A request without a page is the same in every project.');

	for (const [kind, path] of [
		['an image', '/echo-archiv/images/0a1b2c-1414x2000.jpg?w=800'],
		['a pdf', '/echo-archiv/files/0a1b2c.pdf?dl=tsg-echo.pdf'],
	] as const) {
		test(`serves ${kind} with noindex`, async ({ request }) => {
			const response = await request.get(path);

			expect(response.status()).toBe(200);
			expect(response.headers()['x-robots-tag']).toBe('noindex, nofollow');
		});
	}
});
