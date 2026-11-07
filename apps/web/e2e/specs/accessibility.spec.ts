import type { Locator, Page } from '@playwright/test';

import { expectNoAxeViolations } from '../support/axe';
import {
	firstDrillDown,
	openFirstArticle,
	openFirstDepartment,
	openNewestEchoIssue,
	openSearchPanel,
	searchInPanel,
	waitForPage,
} from '../support/navigation';
import { expect, test } from '../support/test';

/**
 * The routes that render without a slug. Every one of them is scanned in both browser projects,
 * because the mobile layout reflows enough (collapsed navigation, stacked grids) to produce
 * violations the desktop viewport never shows.
 */
const STATIC_ROUTES = [
	'/',
	'/verein',
	'/verein/echo',
	'/angebot',
	'/news',
	'/mitgliedschaft',
	'/kontakt',
	'/kontakt/feedback',
	'/impressum',
	'/datenschutz',
	'/barrierefreiheit',
	'/suche',
];

/**
 * The two forms in the state the route scans never reach: submitted empty, with every error
 * message, the invalid marking and the descriptions the fields point at (WEB-418). Each is keyed by
 * its route, since it is the same page.
 */
const FORM_ERROR_STATES = [
	{
		error: 'Der Name muss mindestens 2 Zeichen lang sein.',
		route: '/kontakt',
		submit: 'Kontaktiere uns',
	},
	{
		error: 'Der Titel muss mindestens 5 Zeichen lang sein',
		route: '/kontakt/feedback',
		submit: 'Feedback senden',
	},
];

/**
 * axe's `page-has-heading-one` only asks for at least one `h1`. A page carries exactly one: the
 * hero's title, or the content's own headline where the hero steps back (a group, an article).
 *
 * @param page - The page to check, already settled.
 * @returns Nothing; a page with no or several `h1` fails the test.
 */
async function expectOneH1(page: Page): Promise<void> {
	await expect(page.locator('h1'), 'a page carries exactly one h1').toHaveCount(1);
}

/** The minimum target size of WCAG 2.2 (2.5.8), in CSS pixels. */
const MIN_TARGET_SIZE = 24;

/**
 * Checks that every element a locator matches is at least 24 × 24 px. The sweep runs WCAG 2.1, which
 * has no AA criterion for target sizes, so this is what holds them for the links the 2026 audit
 * measured too small (WEB-419).
 *
 * @param targets - The links to measure, on a settled page.
 * @returns Nothing; a smaller target fails the test.
 */
async function expectTargetSize(targets: Locator): Promise<void> {
	await expect(targets.first()).toBeVisible();

	for (const target of await targets.all()) {
		const box = await target.boundingBox();
		const name = await target.textContent();

		expect(box?.height, `height of „${name}“`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
		expect(box?.width, `width of „${name}“`).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
	}
}

test.describe('accessibility', () => {
	for (const route of STATIC_ROUTES) {
		test(`meets WCAG 2.1 AA on ${route}`, async ({ page }, testInfo) => {
			await page.goto(route);
			await waitForPage(page);

			await expectOneH1(page);
			await expectNoAxeViolations(page, testInfo, route);
		});
	}

	// A link that leads nowhere lands on the not-found page, the one route without a hero.
	test('meets WCAG 2.1 AA on the not-found page', async ({ page }, testInfo) => {
		const response = await page.goto('/diese-seite-gibt-es-nicht');
		await waitForPage(page);

		expect(response?.status()).toBe(404);
		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, 'not found');
	});

	// Without a term the search page shows „Häufig gesucht“; with one it shows the summary, the tabs
	// and both groups of hits instead, which is markup the scan above never sees.
	test('meets WCAG 2.1 AA on the hits of a search', async ({ page }, testInfo) => {
		await page.goto('/suche?q=Tanzen');
		await waitForPage(page);

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/suche');
	});

	// The panel lives in the navigation of every page, and only opens on a press of the lupe. It is
	// scanned with hits in both groups, the state with the most to get wrong: the combobox, the
	// listbox with its two groups, the options and the links to the search page.
	test('meets WCAG 2.1 AA with the search panel open', async ({ page }, testInfo) => {
		await page.goto('/');
		await waitForPage(page);

		await openSearchPanel(page);
		const listbox = await searchInPanel(page, 'Tanzen');

		const pageHits = listbox.getByRole('group', { name: 'Seiten' }).getByRole('option');
		const newsHits = listbox.getByRole('group', { name: 'News' }).getByRole('option');

		await expect(pageHits.first()).toBeVisible();
		await expect(newsHits.first()).toBeVisible();

		// The panel slides and fades in. Mid-transition its text is partly transparent, and axe would
		// measure the contrast of a frame nobody looks at for long.
		await page.getByRole('dialog', { name: 'Website durchsuchen' }).evaluate(async (dialog) => {
			await Promise.all(dialog.getAnimations().map(async (animation) => animation.finished));
		});

		await expectNoAxeViolations(page, testInfo, 'search panel');
	});

	// The submit button stays disabled until the form is hydrated, so the click waits for that, and
	// the errors come from react-hook-form on the client.
	for (const { error, route, submit } of FORM_ERROR_STATES) {
		test(`meets WCAG 2.1 AA on the form of ${route} submitted empty`, async ({
			page,
		}, testInfo) => {
			await page.goto(route);
			await waitForPage(page);

			await page.getByRole('button', { name: submit }).click();
			await expect(page.getByText(error)).toBeVisible();

			await expectNoAxeViolations(page, testInfo, route);
		});
	}

	// The dynamic routes are reached by clicking through, not by a hard-coded slug: the recorded
	// fixtures are re-recorded from the live dataset, and a slug that disappears would turn a
	// content edit into a red suite.
	test('meets WCAG 2.1 AA on a department page', async ({ page }, testInfo) => {
		await openFirstDepartment(page);

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/angebot/[group]');
	});

	test('meets WCAG 2.1 AA on a single group page', async ({ page }, testInfo) => {
		await openFirstDepartment(page);

		await firstDrillDown(page).click();
		await expect(page).toHaveURL(/\/angebot\/[^/]+\/[^/]+$/u);
		await waitForPage(page);

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/angebot/[group]/[singleGroup]');
	});

	test('meets WCAG 2.1 AA on a news article', async ({ page }, testInfo) => {
		await openFirstArticle(page);

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/news/[category]/[slug]');
	});

	test('meets WCAG 2.1 AA on a news category', async ({ page }, testInfo) => {
		await openFirstArticle(page);

		// The category the article belongs to is the one segment of its URL that is guaranteed to
		// have an overview page behind it.
		const [category] = new URL(page.url()).pathname.split('/').slice(2);

		await page.goto(`/news/${category}`);
		await waitForPage(page);

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/news/[category]');
	});

	test('meets WCAG 2.1 AA on a tsg-echo issue', async ({ page }, testInfo) => {
		await openNewestEchoIssue(page);
		// The book replaces the server-rendered cover once its chunk has loaded.
		await page.getByRole('button', { name: 'Nächste Seite' }).waitFor();

		await expectOneH1(page);
		await expectNoAxeViolations(page, testInfo, '/verein/echo/[slug]');
	});

	test('gives category tags and footer links a target of at least 24 × 24 px', async ({
		isMobile,
		page,
	}) => {
		test.skip(!isMobile, 'the audit measured them on a phone, where they are smallest');

		await page.goto('/');
		await waitForPage(page);

		const footer = page.getByRole('contentinfo');

		await expectTargetSize(
			footer.getByRole('link', {
				name: /^(?:Feedback geben|Impressum|Datenschutz|Barrierefreiheit)$/u,
			}),
		);
		// The categories of the wide cards on the home page are plain text links.
		await expectTargetSize(
			page.getByRole('main').getByRole('article').locator('a[href^="/news/"]'),
		);

		await page.goto('/news');
		await waitForPage(page);

		await expectTargetSize(
			page.getByRole('main').getByRole('article').first().locator('a[href^="/news/"]'),
		);
	});

	// The anchor next to a heading of the article body used to show on hover only (WCAG 2.4.7).
	test('shows the anchor of a heading on keyboard focus', async ({ browserName, page }) => {
		test.skip(
			browserName === 'webkit',
			'WebKit, like Safari by default, leaves links out of the Tab order',
		);

		await openFirstArticle(page);

		const anchor = page
			.getByRole('main')
			.getByRole('link', { name: 'Zum Abschnitt springen' })
			.first();

		await expect(anchor).toHaveCSS('opacity', '0');

		// Reached by keyboard, so `:focus-visible` applies: a step forward from the anchor and back.
		await anchor.focus();
		await page.keyboard.press('Tab');
		await page.keyboard.press('Shift+Tab');

		await expect(anchor).toBeFocused();
		await expect(anchor).toHaveCSS('opacity', '1');
	});
});
