import { expect, test } from '../support/test';

test.describe('news', () => {
	test('opens an article from the overview and walks back up the breadcrumb', async ({ page }) => {
		await page.goto('/news');

		await expect(page.getByRole('heading', { name: 'Das Aktuellste von der TSG' })).toBeVisible();

		const firstArticle = page.getByRole('main').getByRole('article').first();
		const headline = firstArticle.getByRole('heading').first();
		const headlineText = await headline.textContent();
		const title = headlineText?.trim() ?? '';

		await headline.getByRole('link').or(headline.locator('xpath=ancestor::a')).first().click();

		// The article's own headline is the page's h1, the overview only ever renders it as an h2.
		await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
		await expect(page).toHaveURL(/\/news\/[^/]+\/[^/]+/u);

		const breadcrumb = page.getByRole('navigation', { name: 'breadcrumb' });
		const categoryLink = breadcrumb.getByRole('link').nth(2);
		const categoryText = await categoryLink.textContent();
		const categoryName = categoryText?.trim() ?? '';

		await categoryLink.click();

		await expect(page).toHaveURL(/\/news\/[^/]+$/u);
		await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText(categoryName);

		await breadcrumb.getByRole('link', { name: 'News', exact: true }).click();
		await expect(page).toHaveURL('/news');
	});

	test('serves the RSS feed', async ({ page }) => {
		const response = await page.request.get('/feed.xml');

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('xml');
		expect(await response.text()).toContain('<rss');
	});
});
