import { expect, test } from '../support/test';

test.describe('smoke', () => {
	test('renders the home page with its chrome', async ({ page }) => {
		await page.goto('/');

		await expect(page.getByRole('navigation').first()).toBeVisible();
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		await expect(page.getByRole('contentinfo')).toBeVisible();
	});
});
