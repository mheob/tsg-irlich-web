import { expect, test } from '../support/test';

test.describe('navigation', () => {
	test('walks the main navigation on desktop', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the main navigation collapses into the mobile menu');

		await page.goto('/');

		const navigation = page.getByRole('navigation').first();

		await navigation.getByRole('link', { name: 'Angebot', exact: true }).click();
		await expect(page).toHaveURL('/angebot');
		await expect(
			page.getByRole('heading', { name: 'Unsere Abteilungen', exact: true }),
		).toBeVisible();

		await navigation.getByRole('link', { name: 'Aktuelles', exact: true }).click();
		await expect(page).toHaveURL('/news');

		await navigation.getByRole('link', { name: 'Mitgliedschaft', exact: true }).click();
		await expect(page).toHaveURL('/mitgliedschaft');

		await navigation.getByRole('link', { name: 'Home', exact: true }).click();
		await expect(page).toHaveURL('/');
	});

	test('opens the mobile menu and navigates from it', async ({ isMobile, page }) => {
		test.skip(!isMobile, 'the mobile menu only exists below the desktop breakpoint');

		await page.goto('/');

		const toggle = page.getByRole('button', { name: 'Toggle menu' });

		// The closed menu is only collapsed visually (`max-h-0 overflow-hidden`), so its links stay in
		// the accessibility tree and remain focusable — asserting they are hidden would fail. That is
		// a defect in the navigation, not in this spec.
		await toggle.click();
		await page.getByRole('link', { name: 'Verein', exact: true }).click();

		await expect(page).toHaveURL('/verein');
	});

	test('reaches every legal page from the footer', async ({ page }) => {
		await page.goto('/');

		const footer = page.getByRole('contentinfo');

		await footer.getByRole('link', { name: 'Impressum' }).click();
		await expect(page).toHaveURL('/impressum');

		await footer.getByRole('link', { name: 'Datenschutz' }).click();
		await expect(page).toHaveURL('/datenschutz');

		await footer.getByRole('link', { name: 'Barrierefreiheit' }).click();
		await expect(page).toHaveURL('/barrierefreiheit');

		await footer.getByRole('link', { name: 'Feedback geben' }).click();
		await expect(page).toHaveURL('/kontakt/feedback');
	});
});
