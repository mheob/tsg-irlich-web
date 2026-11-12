import { waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/** The cards of „Mehr als nur ein Logo“ in the recorded page. */
const REASONS = [
	'Regionale Sichtbarkeit',
	'Reichweite online',
	'Positives Image',
	'Langfristige Partnerschaft',
];

/** The cards of „Viele Wege, ein Ziel“ in the recorded page, the first one with its button first. */
const WAYS = ['Trikotwerbung', 'Bandenwerbung', 'Online-Partner', 'Sachspenden'];

/** A card button adds the title of its card to the subject of the inquiry. */
const FIRST_WAY_INQUIRY =
	'mailto:partner@tsg-irlich.de?subject=Sponsoring%20bei%20der%20TSG%20Irlich%3A%20Trikotwerbung';

/** Every other button asks with the subject as it is. */
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

	test('sends every inquiry to the partner address', async ({ page }) => {
		await expect(page.getByRole('link', { exact: true, name: 'Anfragen' }).first()).toHaveAttribute(
			'href',
			FIRST_WAY_INQUIRY,
		);
		await expect(page.getByRole('link', { exact: true, name: 'Dein Logo hier?' })).toHaveAttribute(
			'href',
			PLAIN_INQUIRY,
		);
	});
});
