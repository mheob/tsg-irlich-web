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
 * Opens the search panel with the lupe of the current viewport and waits until its input is there.
 *
 * The lupe only answers once the bar is hydrated, and the panel arrives in a chunk of its own that
 * is loaded on the first press and opens a frame after it has mounted. Pressing again until the
 * input shows up doubles as the wait for all three. A press that did land makes the lupe `inert`
 * while the panel is on its way, so a retry only presses while no panel is open and gives up on a
 * lupe that takes no click instead of waiting for it.
 *
 * @param page - A page that has passed `waitForPage`.
 * @returns The input of the panel.
 */
export async function openSearchPanel(page: Page): Promise<Locator> {
	const lupe = page.getByRole('button', { name: 'Suche öffnen' });
	const input = page
		.getByRole('dialog', { name: 'Website durchsuchen' })
		.getByRole('combobox', { name: 'Suchbegriff' });

	await expect(async () => {
		if (!(await input.isVisible())) {
			await lupe.click({ timeout: 1000 });
		}

		await expect(input).toBeVisible({ timeout: 2000 });
	}).toPass();

	return input;
}

/**
 * Types a search term into the open panel and waits for its hits.
 *
 * @param page - A page with the search panel open.
 * @param term - The search term.
 * @returns The listbox with the hits.
 */
export async function searchInPanel(page: Page, term: string): Promise<Locator> {
	const input = page.getByRole('combobox', { name: 'Suchbegriff' });
	const listbox = page.getByRole('listbox', { name: 'Treffer' });

	// `fill` replaces the whole value at once, so the panel searches once, after its debounce.
	await input.fill(term);
	await expect(listbox.getByRole('option').first()).toBeVisible();

	return listbox;
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

/**
 * Opens the newest TSG-Echo issue from the archive. Reached by clicking, like every dynamic route,
 * so a re-recorded dataset with other issues still works.
 *
 * @param page - The page to navigate.
 * @returns Nothing.
 */
export async function openNewestEchoIssue(page: Page): Promise<void> {
	await page.goto('/verein/echo');
	await waitForPage(page);
	await page.getByRole('link', { name: 'Durchblättern' }).click();
	await expect(page).toHaveURL(/\/verein\/echo\/[^/]+$/u);
	await waitForPage(page);
}
