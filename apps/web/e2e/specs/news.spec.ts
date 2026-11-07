import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

test.describe('news', () => {
	test('switches to a category with the combobox and back to all news', async ({ page }) => {
		// Two page loads, two hydrations, a client-side navigation and two list animations. In the
		// emulated WebKit of the local screenshot container that sometimes takes longer than the default
		// 30 s, while every step passes; the list alone can sit in its enter transition for two seconds.
		test.slow();

		await page.goto('/news');
		await waitForPage(page);

		const combobox = page.getByRole('combobox', { name: 'News-Kategorie' });
		await expect(combobox).toHaveValue('Alle News');

		// `waitForPage` proves the App Router exists, not that this island is hydrated. On a slow runner
		// WebKit gets to the server-rendered input first: the typed text lands in the DOM, and hydration
		// then puts the selection back. Only a hydrated combobox opens its list, so opening it, retried
		// until it works, doubles as the wait for hydration.
		await expect(async () => {
			await combobox.click();
			await expect(page.getByRole('listbox')).toBeVisible({ timeout: 1000 });
		}).toPass();

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

	// The first page; page 2 has a test of its own below.
	test('shows how many articles and pages the overview holds', async ({ page }) => {
		await page.goto('/news');
		await waitForPage(page);

		const pagination = page.getByRole('navigation', { name: 'Seiten' });

		await expect(page.getByText(/^Artikel 4–9 von \d+$/u)).toBeVisible();
		await expect(pagination.getByRole('link', { name: 'Seite 1' })).toHaveAttribute(
			'aria-current',
			'page',
		);
		await expect(pagination.getByRole('link', { name: 'Nächste Seite' })).toHaveAttribute(
			'href',
			'/news?seite=2',
		);
		await expect(pagination.getByRole('link', { name: 'Vorherige Seite' })).toHaveCount(0);
	});

	// WEB-415: a later page keeps its address, while `next.config.ts` serves it from an internal route
	// that can be cached. Page 2 is the only later page the fixtures hold.
	test('serves a later page of the overview under its own address', async ({ page }) => {
		await page.goto('/news?seite=2');
		await waitForPage(page);

		const pagination = page.getByRole('navigation', { name: 'Seiten' });

		await expect(page).toHaveURL('/news?seite=2');
		await expect(page.getByText(/^Artikel 10–15 von \d+$/u)).toBeVisible();
		await expect(pagination.getByRole('link', { name: 'Seite 2' })).toHaveAttribute(
			'aria-current',
			'page',
		);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			'href',
			/\/news\?seite=2$/u,
		);
		// The trail is the overview's: the internal route must not show through.
		await expect(page.getByRole('navigation', { name: 'breadcrumb' })).not.toContainText('Seite');
	});

	test('sends a request for the internal route of a later page to its address', async ({
		page,
	}) => {
		const response = await page.request.get('/news/seite/2', { maxRedirects: 0 });

		expect(response.status()).toBe(308);
		expect(response.headers().location).toBe('/news?seite=2');
	});

	// WEB-415: an article rendered under any category segment, and the cache would have kept a copy for
	// every one somebody typed. The browser follows the redirect itself: on its first, uncached render
	// `next start` sends the `Location` header twice, which only a browser shows to be harmless. Each
	// project invents a category of its own, so both meet that first render.
	test('sends an article under another category on to its first category', async ({
		page,
	}, testInfo) => {
		await page.goto('/news');
		await waitForPage(page);

		const headline = page
			.getByRole('main')
			.getByRole('article')
			.first()
			.getByRole('heading')
			.first();
		const href = await headline
			.getByRole('link')
			.or(headline.locator('xpath=ancestor::a'))
			.first()
			.getAttribute('href');
		const slug = href?.split('/').at(-1) ?? '';

		const response = await page.goto(`/news/erfunden-${testInfo.project.name}/${slug}`);

		expect(response?.request().redirectedFrom()).not.toBeNull();
		await expect(page).toHaveURL(href ?? '');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	});

	test('fits the page links of a long overview onto a narrow phone', async ({ page }) => {
		// The narrowest common phone: both arrows and all seven slots have to share 343 px.
		await page.setViewportSize({ height: 812, width: 375 });
		await page.goto('/news');
		await waitForPage(page);

		const pagination = page.getByRole('navigation', { name: 'Seiten' });
		// The first page of more than seven: pages 1 to 5, an ellipsis and the last page.
		await expect(pagination.getByRole('link', { name: /^Seite \d+$/u })).toHaveCount(6);

		const box = await pagination.getByRole('list').boundingBox();
		expect(box?.x).toBeGreaterThanOrEqual(0);
		expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
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
		// The trail ends in the headline, not in the hero's title that every article shares.
		await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(title);

		const categoryLink = breadcrumb.getByRole('link').nth(2);
		const categoryText = await categoryLink.textContent();
		const categoryName = categoryText?.trim() ?? '';

		await categoryLink.click();

		await expect(page).toHaveURL(/\/news\/[^/]+$/u);
		// The category is named by its title, which heads its page, not by its humanised slug.
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(categoryName);
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
