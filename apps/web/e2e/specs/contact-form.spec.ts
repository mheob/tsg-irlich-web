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
});
