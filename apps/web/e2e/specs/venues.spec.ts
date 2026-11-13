import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** The two venues the recorded page shows as the home of the club, in that order. */
const HOME_VENUES = ['Pappelstadion', 'Vereinsheim Pappelstübchen'];

/** The headings the other venues stand under. */
const HALLS = 'Hallen';
const FIELDS = 'Plätze';

const TURF_MAIL =
	'mailto:info@tsg-irlich.de?subject=Frage%20zu%20den%20Sportst%C3%A4tten%20der%20TSG%20Irlich';

test.describe('venue page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/verein/sportstaetten');
		await waitForPage(page);
	});

	test('shows the home venues and the other venues', async ({ page }) => {
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sportstätten');

		for (const title of HOME_VENUES) {
			await expect(page.getByRole('heading', { exact: true, level: 3, name: title })).toBeVisible();
		}

		await expect(page.getByRole('heading', { exact: true, level: 3, name: HALLS })).toBeVisible();
		await expect(page.getByRole('heading', { exact: true, level: 3, name: FIELDS })).toBeVisible();
	});

	// The numbers themselves count up from zero, so only their names are asserted here; what the
	// page counts is pinned by the unit tests of `getVenueStats` and of the page.
	test('names the numbers between the two sections', async ({ page }) => {
		await expect(page.getByText('Gruppen trainieren hier')).toBeVisible();
	});

	test('shows the opening hours of the clubhouse and offers nothing to rent', async ({ page }) => {
		await expect(page.getByText('Öffnungszeiten')).toBeVisible();
		await expect(page.getByText(/miet/iu)).toHaveCount(0);
		await expect(page.getByText('Noch kein Foto')).toHaveCount(0);
	});

	test('links a group that trains at a venue to its page', async ({ page }) => {
		const group = page.getByRole('link', { name: '1. Mannschaft' }).first();

		await expect(group).toHaveAttribute('href', '/angebot/fussball/1-mannschaft');
	});

	test('sends the turf box to the address of the page', async ({ page }) => {
		const link = page.getByRole('link', { name: 'Sprich uns an, wenn du helfen willst' });

		await expect(link).toHaveAttribute('href', TURF_MAIL);
	});

	test('opens the Google Maps dialog from „Route planen“', async ({ page }) => {
		await page.getByRole('button', { name: 'Route planen' }).first().click();

		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Achtung: Du wechselst zu Google Maps' }),
		).toBeVisible();
	});
});
