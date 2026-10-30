import type { Locator } from '@playwright/test';

import { openSearchPanel, searchInPanel, waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

/**
 * The search term every spec uses. The department „Tanzen“ matches it by its title, and at least
 * one article does, so it fills both groups of the panel and every tab of the page.
 */
const TERM = 'Tanzen';

/**
 * Reads the number a tab of the search page shows next to its label.
 *
 * @param tab - The tab's link.
 * @returns The number of hits.
 */
async function countOf(tab: Locator): Promise<number> {
	const name = (await tab.textContent()) ?? '';

	return Number(/\d+/u.exec(name)?.[0]);
}

/**
 * Measures an element on the page.
 *
 * @param locator - The element.
 * @returns Its box.
 */
async function boxOf(locator: Locator): Promise<Box> {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error('The element has no box.');
	}
	return box;
}

test.describe('search panel', () => {
	test.describe('on desktop', () => {
		test.skip(({ isMobile }) => isMobile, 'arrow keys and Escape need a hardware keyboard');

		test('opens the first hit with ArrowDown and Enter', async ({ page }) => {
			await page.goto('/');
			await waitForPage(page);

			await openSearchPanel(page);
			const listbox = await searchInPanel(page, TERM);

			await expect(listbox.getByRole('group', { name: 'Seiten' })).toBeVisible();
			await expect(listbox.getByRole('group', { name: 'News' })).toBeVisible();

			// The focus stays in the input; the arrow only marks the first option.
			await page.keyboard.press('ArrowDown');
			await expect(listbox.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
			await page.keyboard.press('Enter');

			await expect(page).toHaveURL((url) => url.pathname.startsWith('/angebot/'));
			await expect(page.getByRole('dialog', { name: 'Website durchsuchen' })).toBeHidden();
		});

		test('offers popular searches, then closes with Escape and hands the focus back', async ({
			page,
		}) => {
			await page.goto('/');
			await waitForPage(page);

			const input = await openSearchPanel(page);

			// The dialog moves the focus into the input when it opens.
			await expect(input).toBeFocused();
			await expect(page.getByRole('heading', { name: 'Häufig gesucht' })).toBeVisible();

			await page.keyboard.press('Escape');

			await expect(page.getByRole('dialog', { name: 'Website durchsuchen' })).toBeHidden();
			await expect(page.getByRole('button', { name: 'Suche öffnen' })).toBeFocused();
		});
	});

	test.describe('on a phone', () => {
		test.skip(({ isMobile }) => !isMobile, 'the bar only shows the menu toggle below lg');

		test('puts the lupe right next to the menu toggle', async ({ page }) => {
			await page.goto('/');
			await waitForPage(page);

			const lupe = await boxOf(page.getByRole('button', { name: 'Suche öffnen' }));
			const toggle = await boxOf(page.getByRole('button', { name: 'Menü' }));
			const lupeRight = lupe.x + lupe.width;

			// Left of the toggle, in the same row, with no more than the bar's own gap in between.
			expect(lupeRight).toBeLessThanOrEqual(toggle.x);
			expect(toggle.x - lupeRight).toBeLessThanOrEqual(16);
			expect(
				Math.abs(lupe.y + lupe.height / 2 - (toggle.y + toggle.height / 2)),
			).toBeLessThanOrEqual(1);
		});

		test('closes the open menu when the search opens', async ({ page }) => {
			await page.goto('/');
			await waitForPage(page);

			const toggle = page.getByRole('button', { name: 'Menü' });

			// Only a hydrated toggle opens the menu. A retry presses again only while it is still
			// closed, so a press that did land is never undone.
			await expect(async () => {
				if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
					await toggle.click();
				}

				await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
			}).toPass();

			await openSearchPanel(page);

			// The open dialog hides the bar from assistive technology, the toggle included.
			await expect(page.getByRole('button', { includeHidden: true, name: 'Menü' })).toHaveAttribute(
				'aria-expanded',
				'false',
			);
		});
	});
});

test.describe('search page', () => {
	test('shows the hits of a search in tabs with their counts', async ({ page }) => {
		await page.goto(`/suche?q=${TERM}`);
		await waitForPage(page);

		const tabs = page.getByRole('navigation', { name: 'Trefferart' });
		const all = tabs.getByRole('link', { name: /^Alle \d+$/u });
		const pages = tabs.getByRole('link', { name: /^Seiten \d+$/u });
		const news = tabs.getByRole('link', { name: /^News \d+$/u });

		await expect(all).toHaveAttribute('aria-current', 'page');
		await expect(pages).toHaveAttribute('href', `/suche?q=${TERM}&typ=seiten`);
		await expect(news).toHaveAttribute('href', `/suche?q=${TERM}&typ=news`);

		const [allCount, pagesCount, newsCount] = await Promise.all(
			[all, pages, news].map(async (tab) => countOf(tab)),
		);

		expect(pagesCount).toBeGreaterThan(0);
		expect(newsCount).toBeGreaterThan(0);
		expect(allCount).toBe(pagesCount + newsCount);

		await expect(
			page.getByRole('main').getByRole('link', { exact: true, name: TERM }),
		).toHaveAttribute('href', /^\/angebot\//u);
	});

	test('offers popular searches without a search term', async ({ page }) => {
		await page.goto('/suche');
		await waitForPage(page);

		await expect(page.getByRole('heading', { name: 'Häufig gesucht' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Trefferart' })).toHaveCount(0);
	});

	test.describe('without JavaScript', () => {
		test.use({ javaScriptEnabled: false });

		test('searches with the plain form', async ({ page }) => {
			await page.goto('/suche');

			// No `waitForPage`: without JavaScript there is no App Router client to wait for.
			const input = page.getByRole('search').getByRole('searchbox', { name: 'Suchbegriff' });

			await input.fill(TERM);
			await input.press('Enter');

			await expect(page).toHaveURL(`/suche?q=${TERM}`);
			await expect(page.getByText(new RegExp(`^\\d+ Treffer für „${TERM}“$`, 'u'))).toBeVisible();
		});
	});
});

interface Box {
	height: number;
	width: number;
	x: number;
	y: number;
}
