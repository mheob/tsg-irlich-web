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

		// The item for the page you are on is the only one carrying `aria-current`.
		await expect(navigation.getByRole('link', { name: 'Angebot', exact: true })).toHaveAttribute(
			'aria-current',
			'page',
		);
		await expect(
			navigation.getByRole('link', { name: 'Aktuelles', exact: true }),
		).not.toHaveAttribute('aria-current', 'page');

		await navigation.getByRole('link', { name: 'Aktuelles', exact: true }).click();
		await expect(page).toHaveURL('/news');

		await navigation.getByRole('link', { name: 'Mitgliedschaft', exact: true }).click();
		await expect(page).toHaveURL('/mitgliedschaft');

		await navigation.getByRole('link', { name: 'Home', exact: true }).click();
		await expect(page).toHaveURL('/');
	});

	test('keeps the collapsed mobile menu out of reach, then opens it and navigates from it', async ({
		isMobile,
		page,
	}) => {
		test.skip(!isMobile, 'the mobile menu only exists below the desktop breakpoint');

		await page.goto('/');

		const toggle = page.getByRole('button', { name: 'Menü' });

		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toHaveAttribute('aria-controls', 'mobile-navigation');

		const menu = page.locator('#mobile-navigation');

		// The collapsed menu stays in the DOM so the open/close transition has something to animate,
		// and `inert` is what keeps its links out of the tab order and out of the accessibility tree.
		// Asking for the focus outright is the sharper check of the two: it also fails when only the
		// tab order was patched up. Before this was fixed, the focus landed on an invisible link.
		const collapsedLink = menu.locator('a[href="/verein"]');
		await collapsedLink.evaluate((element: HTMLElement) => {
			element.focus();
		});
		await expect(collapsedLink).not.toBeFocused();

		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Open, the same link takes the focus and can be reached by keyboard.
		const link = menu.getByRole('link', { name: 'Verein', exact: true });
		await link.focus();
		await expect(link).toBeFocused();

		// Escape closes the menu from inside it and hands the focus back to the toggle. Without that,
		// collapsing the menu makes it `inert` and the browser drops the focus to `<body>`.
		await page.keyboard.press('Escape');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeFocused();

		await toggle.click();
		await link.click();
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
