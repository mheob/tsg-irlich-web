import { expect, test } from '../support/test';

test.describe('contact form', () => {
	test('sends a message and confirms it', async ({ page }) => {
		await page.goto('/kontakt');

		const form = page.locator('form').filter({
			has: page.getByRole('button', { name: 'Kontaktiere uns' }),
		});

		// The receiver select only opens once the form is hydrated, and react-hook-form resets the
		// fields to their defaults at that moment — so this is the first interaction, not a later one.
		await form.getByRole('combobox', { name: 'Empfänger' }).click();
		await page.getByRole('option').first().click();

		await form.getByRole('textbox', { name: 'Name' }).fill('Erika Mustermann');
		await form.getByRole('textbox', { name: 'E-Mail' }).fill('erika@mustermann.test');
		await form
			.getByRole('textbox', { name: 'Nachricht' })
			.fill('Hallo, ich interessiere mich für eine Mitgliedschaft.');
		await form.getByRole('checkbox').check();

		await form.getByRole('button', { name: 'Kontaktiere uns' }).click();

		await expect(page.getByText('Vielen Dank!')).toBeVisible();
		await expect(page.getByText('Deine Anfrage wurde erfolgreich übermittelt.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Erneute Anfrage stellen' })).toBeVisible();
	});

	test('refuses to send an incomplete message', async ({ page }) => {
		await page.goto('/kontakt');

		const form = page.locator('form').filter({
			has: page.getByRole('button', { name: 'Kontaktiere uns' }),
		});

		await form.getByRole('button', { name: 'Kontaktiere uns' }).click();

		// Nothing was submitted, so the confirmation must not appear — the field errors are rendered
		// by react-hook-form on the client.
		await expect(page.getByText('Deine Anfrage wurde erfolgreich übermittelt.')).toBeHidden();
		await expect(form.getByRole('textbox', { name: 'Name' })).toBeVisible();
	});

	test('keeps the receiver addresses out of the page', async ({ page }) => {
		const response = await page.goto('/kontakt');
		const html = await response?.text();

		// WEB-410: the receiver select used to carry the addresses as its values, so they stood in the
		// prerendered HTML and in the RSC payload inlined into it. These two belong to no contact
		// person, so the recorded contact page can only have listed them as receivers.
		expect(html).not.toContain('mitglieder@tsg-irlich.de');
		expect(html).not.toContain('pr@tsg-irlich.de');
		await expect(page.getByRole('combobox', { name: 'Empfänger' })).toBeVisible();
	});
});
