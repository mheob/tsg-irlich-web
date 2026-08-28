import type { Locator, Page } from '@playwright/test';

import { expectNoAxeViolations } from '../support/axe';
import { expect, test } from '../support/test';

/**
 * The routes that render without a slug. Every one of them is scanned in both browser projects,
 * because the mobile layout reflows enough (collapsed navigation, stacked grids) to produce
 * violations the desktop viewport never shows.
 */
const STATIC_ROUTES = [
	'/',
	'/verein',
	'/angebot',
	'/news',
	'/mitgliedschaft',
	'/kontakt',
	'/kontakt/feedback',
	'/impressum',
	'/datenschutz',
	'/barrierefreiheit',
];

/**
 * Waits for the chrome every page shares; once it is up, the server-rendered content is in the DOM.
 *
 * @param page - The page that has just been navigated.
 * @returns Nothing.
 */
async function waitForPage(page: Page): Promise<void> {
	await expect(page.getByRole('navigation').first()).toBeVisible();
	await expect(page.getByRole('contentinfo')).toBeVisible();
	// A client-side navigation swaps the document title a tick after the markup, and axe reports the
	// gap as a missing `<title>`. Waiting for it keeps `document-title` from flaking.
	await expect(page).toHaveTitle(/\S/u);
}

/**
 * Locates the first "Mehr über … erfahren" card inside the main region.
 *
 * @param page - The overview page the card is listed on.
 * @returns The locator for that card's link.
 */
function firstDrillDown(page: Page): Locator {
	return page
		.getByRole('main')
		.getByRole('link', { name: /^Mehr über .* erfahren$/u })
		.first();
}

/**
 * Opens the newest article from the news overview, the same way a reader would.
 *
 * @param page - The page to navigate.
 * @returns Nothing.
 */
async function openFirstArticle(page: Page): Promise<void> {
	await page.goto('/news');
	await waitForPage(page);

	const headline = page.getByRole('main').getByRole('article').first().getByRole('heading').first();

	await headline.getByRole('link').or(headline.locator('xpath=ancestor::a')).first().click();
	await expect(page).toHaveURL(/\/news\/[^/]+\/[^/]+/u);
	await waitForPage(page);
}

test.describe('accessibility', () => {
	for (const route of STATIC_ROUTES) {
		test(`meets WCAG 2.1 AA on ${route}`, async ({ page }, testInfo) => {
			await page.goto(route);
			await waitForPage(page);

			await expectNoAxeViolations(page, testInfo, route);
		});
	}

	// The dynamic routes are reached by clicking through, not by a hard-coded slug: the recorded
	// fixtures are re-recorded from the live dataset, and a slug that disappears would turn a
	// content edit into a red suite.
	test('meets WCAG 2.1 AA on a department page', async ({ page }, testInfo) => {
		await page.goto('/angebot');
		await waitForPage(page);

		await firstDrillDown(page).click();
		await expect(page).toHaveURL(/\/angebot\/[^/]+$/u);
		await waitForPage(page);

		await expectNoAxeViolations(page, testInfo, '/angebot/[group]');
	});

	test('meets WCAG 2.1 AA on a single group page', async ({ page }, testInfo) => {
		await page.goto('/angebot');
		await waitForPage(page);

		await firstDrillDown(page).click();
		await expect(page).toHaveURL(/\/angebot\/[^/]+$/u);
		await waitForPage(page);

		await firstDrillDown(page).click();
		await expect(page).toHaveURL(/\/angebot\/[^/]+\/[^/]+$/u);
		await waitForPage(page);

		await expectNoAxeViolations(page, testInfo, '/angebot/[group]/[singleGroup]');
	});

	test('meets WCAG 2.1 AA on a news article', async ({ page }, testInfo) => {
		await openFirstArticle(page);

		await expectNoAxeViolations(page, testInfo, '/news/[category]/[slug]');
	});

	test('meets WCAG 2.1 AA on a news category', async ({ page }, testInfo) => {
		await openFirstArticle(page);

		// The category the article belongs to is the one segment of its URL that is guaranteed to
		// have an overview page behind it.
		const [category] = new URL(page.url()).pathname.split('/').slice(2);

		await page.goto(`/news/${category}`);
		await waitForPage(page);

		await expectNoAxeViolations(page, testInfo, '/news/[category]');
	});
});
