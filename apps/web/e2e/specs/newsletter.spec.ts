import { expect, test } from '../support/test';

/**
 * The mocked CleverReach API decides its answer from the address alone — see
 * `NEWSLETTER_SCENARIOS` in `e2e/mocks/preload.ts`.
 */
const ALREADY_SUBSCRIBED = 'bereits-angemeldet@tsg-irlich.test';

test.describe('newsletter', () => {
	test('subscribes an address and asks for the double opt-in', async ({ page }) => {
		await page.goto('/kontakt');

		const form = page.locator('form').filter({
			has: page.getByRole('button', { name: 'Abonnieren' }),
		});

		await form.getByRole('textbox').fill('neue-leserin@tsg-irlich.test');
		await form.getByRole('button', { name: 'Abonnieren' }).click();

		await expect(
			page.getByText('Bitte bestätige Deine Anmeldung über den Link in der E-Mail'),
		).toBeVisible();
	});

	test('reports an address that is already subscribed', async ({ page }) => {
		await page.goto('/kontakt');

		const form = page.locator('form').filter({
			has: page.getByRole('button', { name: 'Abonnieren' }),
		});

		await form.getByRole('textbox').fill(ALREADY_SUBSCRIBED);
		await form.getByRole('button', { name: 'Abonnieren' }).click();

		await expect(
			page.getByText('Diese E-Mail-Adresse ist bereits für den Newsletter registriert.'),
		).toBeVisible();
	});
});
