import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

test.describe('feedback form', () => {
	test('reaches the screenshot upload with the keyboard', async ({ page }) => {
		await page.goto('/kontakt/feedback');
		await waitForPage(page);

		// The file input comes right before the e-mail field in the tab order, so one step back from
		// there has to land on it. Only a real browser can tell: jsdom applies no stylesheet, and an
		// input hidden with `display: none` drops out of the tab order only once the CSS is loaded.
		await page.getByRole('textbox', { name: /E-Mail/u }).focus();
		await page.keyboard.press('Shift+Tab');

		await expect(page.getByLabel(/Screenshots/u)).toBeFocused();
	});
});
