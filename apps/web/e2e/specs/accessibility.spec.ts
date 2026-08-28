import { expectNoAxeViolations } from '../support/axe';
import {
	firstDrillDown,
	openFirstArticle,
	openFirstDepartment,
	waitForPage,
} from '../support/navigation';
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
		await openFirstDepartment(page);

		await expectNoAxeViolations(page, testInfo, '/angebot/[group]');
	});

	test('meets WCAG 2.1 AA on a single group page', async ({ page }, testInfo) => {
		await openFirstDepartment(page);

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
