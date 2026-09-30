import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

test.describe('news', () => {
	test('switches to a category with the combobox and back to all news', async ({ page }) => {
		await page.goto('/news');
		await waitForPage(page);

		const combobox = page.getByRole('combobox', { name: 'News-Kategorie' });
		await expect(combobox).toHaveValue('Alle News');

		await combobox.fill('fu');
		await page.getByRole('option', { name: /^Fußball, \d+ Artikel$/u }).click();

		await expect(page).toHaveURL('/news/fussball');
		await waitForPage(page);
		await expect(combobox).toHaveValue('Fußball');

		await combobox.click();
		await page.getByRole('option', { name: /^Alle News, \d+ Artikel$/u }).click();

		await expect(page).toHaveURL('/news');
	});

	test('fits the overview into the viewport where the latest news split into two columns', async ({
		isMobile,
		page,
	}) => {
		test.skip(isMobile, 'the two-column layout starts at the desktop breakpoint');

		// Tailwind's `lg` breakpoint: the narrowest width at which the article cards beside the lead
		// article share their space with an image, which leaves the category badges the least room.
		await page.setViewportSize({ height: 900, width: 1024 });
		await page.goto('/news');
		await waitForPage(page);

		const { clientWidth, scrollWidth } = await page.evaluate(() => ({
			clientWidth: document.documentElement.clientWidth,
			scrollWidth: document.documentElement.scrollWidth,
		}));
		expect(scrollWidth).toBe(clientWidth);
	});

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
