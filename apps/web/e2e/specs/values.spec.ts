import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** The values of the recorded page, in their order. */
const VALUES = [
	'Sportverein für alle',
	'Vielfalt',
	'Integration',
	'Gesellschaftliche Verantwortung',
	'Ehrenamt',
	'Dorfleben',
];

test.describe('values page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/verein/werte');
		await waitForPage(page);
	});

	test('shows who the club is and every value', async ({ page }) => {
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unsere Werte');
		await expect(
			page.getByRole('heading', { level: 2, name: 'Turn- und Sportgemeinde Irlich 1882 e.V.' }),
		).toBeVisible();

		for (const title of VALUES) {
			await expect(page.getByRole('heading', { exact: true, level: 2, name: title })).toBeVisible();
		}
	});

	test('jumps to a value from the table of contents', async ({ page }) => {
		await page
			.getByRole('navigation', { name: 'Inhalt' })
			.getByRole('link', { name: 'Dorfleben' })
			.click();

		await expect(page).toHaveURL(/#wert-dorfleben$/u);
		await expect(page.getByRole('heading', { level: 2, name: 'Dorfleben' })).toBeInViewport();
	});

	test('closes with the way to the membership and to volunteering', async ({ page }) => {
		await expect(page.getByRole('link', { name: 'Mitglied werden' })).toHaveAttribute(
			'href',
			'/mitgliedschaft',
		);
		await expect(page.getByRole('link', { name: 'Ehrenamt entdecken' })).toHaveAttribute(
			'href',
			'/verein/ehrenamt',
		);
	});
});

test.describe('the way to the values page', () => {
	for (const [name, path] of [
		['the home page', '/'],
		['the club page', '/verein'],
	] as const) {
		test(`leads there from the vision section of ${name}`, async ({ page }) => {
			await page.goto(path);
			await waitForPage(page);

			await expect(page.locator('#vision-section').getByRole('link')).toHaveAttribute(
				'href',
				'/verein/werte',
			);
		});
	}
});
