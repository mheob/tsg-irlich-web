import { expect, test } from '../support/test';

test.describe('offers', () => {
	test('drills from the departments into a single group', async ({ page }) => {
		await page.goto('/angebot');

		await expect(
			page.getByRole('heading', { name: 'Unsere Abteilungen', exact: true }),
		).toBeVisible();

		await page.getByRole('link', { name: 'Mehr über "Fußball" erfahren' }).click();

		await expect(page).toHaveURL('/angebot/fussball');
		await expect(page.getByRole('heading', { name: 'Bereich: Fußball' })).toBeVisible();

		const firstGroup = page
			.getByRole('main')
			.getByRole('link', { name: /^Mehr über .* erfahren$/u })
			.first();
		const groupHref = await firstGroup.getAttribute('href');

		await firstGroup.click();

		await expect(page).toHaveURL(groupHref ?? '');
		// The department segment of the breadcrumb comes from the slug, so it carries no umlaut.
		await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText(
			/fu(?:ß|ss)ball/iu,
		);
	});

	test('offers a group page for every department listed on the overview', async ({ page }) => {
		await page.goto('/angebot');

		const departmentLinks = page.getByRole('main').getByRole('link', {
			name: /^Mehr über .* erfahren$/u,
		});

		const hrefs = await departmentLinks.evaluateAll((links) =>
			links.map((link) => link.getAttribute('href') ?? ''),
		);

		expect(hrefs.length).toBeGreaterThan(0);

		for (const href of hrefs) {
			const response = await page.request.get(href);

			expect(response.status(), `${href} should render`).toBe(200);
		}
	});
});
