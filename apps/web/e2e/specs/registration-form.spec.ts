import type { Locator, Page } from '@playwright/test';

import { FORM_DEFAULT_TEXTS } from '@tsgi-web/shared/forms/default-texts';

import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/**
 * The form `apps/studio/scripts/create-e2e-form.ts` writes to `development`: Teamname, E-Mail, an
 * optional Spielklasse, the group Mitspieler (Nachname, Geburtsdatum, at least 16 on 14.05.2027)
 * and a consent, with eight places and the registration open until 2099.
 */
const FORM_PATH = '/anmeldung/e2e-anmeldung';

/**
 * Opens the e2e form and returns the part of the page that holds it.
 *
 * @param page - The page to navigate.
 * @returns The region with the form.
 */
async function openForm(page: Page): Promise<Locator> {
	await page.goto(FORM_PATH);
	await waitForPage(page);

	return page.getByRole('region', { name: 'Anmeldung' });
}

/**
 * Adds the first player and returns its entry.
 *
 * The button only answers once the form is hydrated, and react-hook-form resets every field at that
 * moment, so this is the first interaction and the text fields are filled afterwards. It is pressed
 * again until the entry shows up, but only while there is none, so a late press cannot add a second.
 *
 * @param form - The region with the form.
 * @returns The fields of the new entry.
 */
async function addPlayer(form: Locator): Promise<Locator> {
	const add = form.getByRole('button', { name: '+ Spieler hinzufügen' });
	const entry = form.getByRole('group', { name: 'Spieler 1' });

	await expect(async () => {
		if (!(await entry.isVisible())) {
			await add.click({ timeout: 1000 });
		}

		await expect(entry).toBeVisible({ timeout: 2000 });
	}).toPass();

	return entry;
}

test.describe('registration form', () => {
	test('shows the landing page', async ({ page }) => {
		await openForm(page);

		await expect(page.getByRole('heading', { level: 1, name: 'E2E-Anmeldung' })).toBeVisible();
		await expect(page.getByText('Noch 8 von 8 Plätzen frei')).toBeVisible();
	});

	test('submits a registration', async ({ page }) => {
		const form = await openForm(page);
		const player = await addPlayer(form);

		await form.getByRole('textbox', { name: 'Teamname' }).fill('Die Testkicker');
		await form.getByRole('textbox', { name: 'E-Mail' }).fill('team@tsg-irlich.test');
		await player.getByRole('textbox', { name: 'Nachname' }).fill('Mustermann');
		await player.getByLabel('Geburtsdatum').fill('2000-01-01');
		await form.getByRole('checkbox', { name: /Datenschutzerklärung/u }).check();

		await form.getByRole('button', { name: 'Anmelden' }).click();

		await expect(form.getByText(FORM_DEFAULT_TEXTS.success)).toBeVisible();
	});

	test('shows errors on an empty submit', async ({ page }) => {
		const form = await openForm(page);

		// The submit button stays disabled until the form is hydrated, so the click waits for that.
		await form.getByRole('button', { name: 'Anmelden' }).click();

		await expect(form.getByText('Bitte fülle dieses Feld aus.')).toBeVisible();
		await expect(form.getByText(FORM_DEFAULT_TEXTS.success)).toBeHidden();
	});

	test('rejects an underage player', async ({ page }) => {
		const form = await openForm(page);
		const player = await addPlayer(form);

		await player.getByLabel('Geburtsdatum').fill('2015-01-01');
		await form.getByRole('button', { name: 'Anmelden' }).click();

		await expect(player.getByText('Das Mindestalter ist 16 Jahre am 14.05.2027.')).toBeVisible();
		await expect(form.getByText(FORM_DEFAULT_TEXTS.success)).toBeHidden();
	});
});
