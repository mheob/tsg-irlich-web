import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** An address no route answers. */
const UNKNOWN_PATH = '/diese-seite-gibt-es-nicht';

test.describe('not-found page', () => {
	test('answers 404 with its own title, a search and the most visited pages', async ({ page }) => {
		const response = await page.goto(UNKNOWN_PATH);
		await waitForPage(page);

		expect(response?.status()).toBe(404);
		await expect(page).toHaveTitle('Seite nicht gefunden | TSG Irlich');

		const main = page.getByRole('main');

		await expect(
			main.getByRole('heading', { level: 1, name: 'Seite nicht gefunden' }),
		).toBeVisible();
		await expect(
			main.getByRole('search').getByRole('searchbox', { name: 'Suchbegriff' }),
		).toBeVisible();

		const pages = main.getByRole('navigation', { name: 'Beliebte Seiten' });

		await expect(pages.getByRole('link', { name: 'Unser Angebot' })).toHaveAttribute(
			'href',
			'/angebot',
		);
		await expect(pages.getByRole('link', { name: 'News' })).toHaveAttribute('href', '/news');
		await expect(pages.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt');
	});

	test.describe('without JavaScript', () => {
		test.use({ javaScriptEnabled: false });

		test('sends the term to the search page', async ({ page }) => {
			await page.goto(UNKNOWN_PATH);

			// No `waitForPage`: without JavaScript there is no App Router client to wait for.
			const input = page
				.getByRole('main')
				.getByRole('search')
				.getByRole('searchbox', { name: 'Suchbegriff' });

			await input.fill('Tanzen');
			await input.press('Enter');

			await expect(page).toHaveURL('/suche?q=Tanzen');
			await expect(page.getByText(/^\d+ Treffer für „Tanzen“$/u)).toBeVisible();
		});
	});
});
