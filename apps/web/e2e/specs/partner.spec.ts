import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** The cards of „Mehr als nur ein Logo“ in the recorded page. */
const REASONS = [
	'Regionale Sichtbarkeit',
	'Reichweite online',
	'Positives Image',
	'Langfristige Partnerschaft',
];

/** The cards of „Viele Wege, ein Ziel“ in the recorded page. */
const WAYS = ['Trikotwerbung', 'Bandenwerbung', 'Online-Partner', 'Sachspenden'];

/** The idea button and the own-logo tile ask with the subject as it is. */
const PLAIN_INQUIRY = 'mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich';

test.describe('partner page', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/verein/partner');
		await waitForPage(page);
	});

	test('shows the reasons and the ways to support the club', async ({ page }) => {
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sponsoren & Partner');

		for (const title of [...REASONS, ...WAYS]) {
			await expect(page.getByRole('heading', { exact: true, level: 3, name: title })).toBeVisible();
		}
	});

	test('opens the website of a sponsor as a sponsored link in a new window', async ({ page }) => {
		const tile = page.getByRole('link', { name: /^Abbas\b/u });

		await expect(tile).toHaveAttribute('rel', /\bsponsored\b/u);
		await expect(tile).toHaveAttribute('target', '_blank');
	});

	// The recorded dataset turned one sponsor into one without website (`apps/web/AGENTS.md`,
	// „Fixtures“), so the tile that only shows a logo and a name is part of the page.
	test('shows a sponsor without website as a tile without link', async ({ page }) => {
		const tile = page.getByRole('listitem').filter({ hasText: 'Ingo Jann' });

		await expect(tile).toBeVisible();
		await expect(tile.getByRole('link')).toHaveCount(0);
	});

	test('sends the idea and own-logo inquiries to the partner address', async ({ page }) => {
		await expect(
			page.getByRole('link', { exact: true, name: 'Jetzt Kontakt aufnehmen' }),
		).toHaveAttribute('href', PLAIN_INQUIRY);
		await expect(page.getByRole('link', { exact: true, name: 'Dein Logo hier?' })).toHaveAttribute(
			'href',
			PLAIN_INQUIRY,
		);
	});

	test('puts no inquiry button into the cards of the ways', async ({ page }) => {
		for (const title of WAYS) {
			const card = page.getByRole('article').filter({
				has: page.getByRole('heading', { exact: true, level: 3, name: title }),
			});

			await expect(card).toBeVisible();
			await expect(card.getByRole('link')).toHaveCount(0);
		}
	});

	// Four sponsors and the own-logo tile: the desktop viewport lays them out in rows of three, so
	// the own-logo tile shares the second row with the last sponsor instead of standing alone.
	test('never leaves the own-logo tile alone in its row', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the phone layout lets the tile span the whole row instead');

		const ownTile = await page
			.getByRole('link', { exact: true, name: 'Dein Logo hier?' })
			.boundingBox();
		const lastSponsor = await page.getByRole('link', { name: /^SWN\b/u }).boundingBox();

		expect(ownTile).not.toBeNull();
		expect(ownTile?.y).toBe(lastSponsor?.y);
	});
});
