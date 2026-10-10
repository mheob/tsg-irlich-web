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

	// WEB-367: the archive path has to carry the proxy's header on the platform itself, not just under
	// `next start`. Previews already get Vercel's own `X-Robots-Tag: noindex`, so the test looks for
	// `nofollow`, which only the proxy sends.
	test('serves the files of the echo archive with their own noindex header', async ({ page }) => {
		await page.goto('/verein/echo');
		const src =
			(await page
				.getByRole('img', { name: /^Titelseite von /u })
				.first()
				.getAttribute('src')) ?? '';
		const file =
			/(?:cdn\.sanity\.io%2Fimages%2F[^%]+%2F[^%]+%2F|\/echo-archiv\/images\/)(?<file>[^%?&]+)/u.exec(
				src,
			)?.groups?.file;
		test.skip(!file, 'No TSG-Echo issue in this dataset');

		const response = await page.request.get(`/echo-archiv/images/${file}?w=100`);

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toMatch(/^image\//u);
		expect(response.headers()['x-robots-tag']).toContain('nofollow');
	});

	test('serves robots.txt and llms.txt for crawlers and language models', async ({ page }) => {
		const robots = await page.request.get('/robots.txt');
		const llms = await page.request.get('/llms.txt');

		expect(robots.status()).toBe(200);
		expect(await robots.text()).toContain('User-Agent: GPTBot');
		expect(llms.status()).toBe(200);
		expect(await llms.text()).toMatch(/^# TSG Irlich\n/u);
	});
});
