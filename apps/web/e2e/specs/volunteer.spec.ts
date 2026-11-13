import { expectNoAxeViolations } from '../support/axe';
import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** The reasons of „Gemeinsam mehr erreichen“ in the recorded page. */
const REASONS = [
	'Gemeinschaft',
	'Persönliche Entwicklung',
	'Sinn stiften',
	'Sport fördern',
	'Ideen einbringen',
	'Wertschätzung',
];

/** The areas of „So kannst du dich einbringen“ in the recorded page. */
const AREAS = [
	'Sport & Mannschaften',
	'Schiedsrichter & Spielbetrieb',
	'Verein & Organisation',
	'Veranstaltungen & Helfer',
];

/** The recorded positions, newest first, as the page lists them. */
const NEWEST_POSITION = 'Unterstützung im Vorstand';
const SECOND_POSITION = 'Schiedsrichter/in';

const SUBJECT = 'Ehrenamt%20bei%20der%20TSG%20Irlich';

test.describe('volunteer page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/verein/ehrenamt');
		await waitForPage(page);
	});

	test('shows the reasons and the areas', async ({ page }) => {
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Engagiere dich');

		for (const title of [...REASONS, ...AREAS]) {
			await expect(page.getByRole('heading', { exact: true, level: 3, name: title })).toBeVisible();
		}
	});

	// The sweep scans the page at rest; a reason card turns blue only under the pointer. Phones have
	// no hover, so the state only exists on the desktop.
	test('keeps a reason card readable while hovered', async ({ isMobile, page }, testInfo) => {
		test.skip(isMobile, 'phones have no hover state');

		await page
			.getByRole('listitem')
			.filter({ has: page.getByRole('heading', { exact: true, level: 3, name: 'Gemeinschaft' }) })
			.hover();
		// Scan the colours the card ends on, not a frame of its transition.
		await page.evaluate(async () => {
			await Promise.all(document.getAnimations().map(async (animation) => animation.finished));
		});

		await expectNoAxeViolations(page, testInfo, '/verein/ehrenamt');
	});

	test('jumps from the reasons to the open positions', async ({ page }) => {
		await expect(
			page.getByRole('link', { exact: true, name: 'Offene Aufgaben ansehen' }),
		).toHaveAttribute('href', '#aktuell-gesucht');
	});

	test('opens the newest position with a mail that names it', async ({ page }) => {
		await expect(
			page.getByRole('button', { name: new RegExp(NEWEST_POSITION, 'u') }),
		).toHaveAttribute('aria-expanded', 'true');
		await expect(page.getByRole('link', { exact: true, name: 'Jetzt melden' })).toHaveAttribute(
			'href',
			`mailto:info@tsg-irlich.de?subject=${SUBJECT}%3A%20Unterst%C3%BCtzung%20im%20Vorstand`,
		);
	});

	test('opens another position and closes the first', async ({ page }) => {
		const newest = page.getByRole('button', { name: new RegExp(NEWEST_POSITION, 'u') });
		const second = page.getByRole('button', { name: new RegExp(SECOND_POSITION, 'u') });

		// Retried until the accordion is hydrated and answers the click.
		await expect(async () => {
			await second.click();
			await expect(second).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
		}).toPass();
		await expect(newest).toHaveAttribute('aria-expanded', 'false');
		// The closing panel stays visible until its transition has ended.
		const button = page.getByRole('link', { exact: true, name: 'Jetzt melden' });
		await expect(button).toHaveCount(1);
		await expect(button).toHaveAttribute(
			'href',
			`mailto:info@tsg-irlich.de?subject=${SUBJECT}%3A%20Schiedsrichter%2Fin`,
		);
	});

	test('sends an idea of ones own with the subject as it is', async ({ page }) => {
		await expect(page.getByRole('link', { name: /Nichts Passendes dabei\?/u })).toHaveAttribute(
			'href',
			`mailto:info@tsg-irlich.de?subject=${SUBJECT}`,
		);
	});
});
