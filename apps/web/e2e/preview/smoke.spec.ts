import process from 'node:process';

import { expect, test } from '@playwright/test';

/**
 * The routes that must render with real content behind them. Everything below the level of
 * "the page renders" belongs in the mocked suite (`e2e/specs/`), which cannot be broken by an edit
 * in the studio.
 */
const ROUTES = [
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

test.describe('preview smoke', () => {
	// Preview deployments are behind Vercel's SSO. Without the automation bypass token every request
	// would be answered by Vercel's login page, so the suite reports nothing instead of nonsense.
	test.skip(
		!process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
		'VERCEL_AUTOMATION_BYPASS_SECRET is not configured',
	);

	for (const route of ROUTES) {
		test(`renders ${route}`, async ({ page }) => {
			const errors: string[] = [];

			page.on('pageerror', (error) => errors.push(error.message));

			const response = await page.goto(route);

			expect(response?.status()).toBeLessThan(400);
			await expect(page.getByRole('navigation').first()).toBeVisible();
			await expect(page.getByRole('contentinfo')).toBeVisible();
			expect(errors).toEqual([]);
		});
	}

	test('lists articles on the news overview', async ({ page }) => {
		await page.goto('/news');

		const articles = page.getByRole('main').getByRole('article');

		await expect(articles.first()).toBeVisible();
		expect(await articles.count()).toBeGreaterThan(0);
	});

	test('serves the sitemap and the feed', async ({ page }) => {
		const sitemap = await page.request.get('/sitemap.xml');
		const feed = await page.request.get('/feed.xml');

		expect(sitemap.status()).toBe(200);
		expect(feed.status()).toBe(200);
	});
});
