import type { Locator, Page } from '@playwright/test';

import { expect } from './test';

/**
 * Waits for the chrome every page shares *and* for the App Router client behind it, so every caller
 * sees the same page regardless of how fast the machine is.
 *
 * @param page - The page that has just been navigated.
 * @returns Nothing.
 */
export async function waitForPage(page: Page): Promise<void> {
	await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
	await expect(page.getByRole('contentinfo')).toBeVisible();
	// A client-side navigation swaps the document title a tick after the markup, and axe reports the
	// gap as a missing `<title>`. Waiting for it keeps `document-title` from flaking.
	await expect(page).toHaveTitle(/\S/u);
	// Everything above is server-rendered and therefore in place long before the client is, which
	// left the axe sweep measuring a hydrated tree on a slow runner and an unhydrated one on a fast
	// one. `window.next.router` is the first observable sign that the App Router client exists: it
	// is undefined while the document is merely committed. The callback is serialized into the page,
	// so it has to stand on its own — no module-scope helper is in scope there.
	await page.waitForFunction(() =>
		Boolean((globalThis as { next?: { router?: unknown } }).next?.router),
	);
}

/**
 * Locates the first "Mehr über … erfahren" card inside the main region.
 *
 * @param page - The overview page the card is listed on.
 * @returns The locator for that card's link.
 */
export function firstDrillDown(page: Page): Locator {
	return page
		.getByRole('main')
		.getByRole('link', { name: /^Mehr über .* erfahren$/u })
		.first();
}

/**
 * Opens the first department from the offer overview, the same way a visitor would.
 *
 * @param page - The page to navigate.
 * @returns Nothing.
 */
export async function openFirstDepartment(page: Page): Promise<void> {
	await page.goto('/angebot');
	await waitForPage(page);

	await firstDrillDown(page).click();
	await expect(page).toHaveURL(/\/angebot\/[^/]+$/u);
	await waitForPage(page);
}

/**
 * Opens the newest article from the news overview, the same way a reader would.
 *
 * @param page - The page to navigate.
 * @returns Nothing.
 */
export async function openFirstArticle(page: Page): Promise<void> {
	await page.goto('/news');
	await waitForPage(page);

	const headline = page.getByRole('main').getByRole('article').first().getByRole('heading').first();

	await headline.getByRole('link').or(headline.locator('xpath=ancestor::a')).first().click();
	await expect(page).toHaveURL(/\/news\/[^/]+\/[^/]+/u);
	await waitForPage(page);
}
