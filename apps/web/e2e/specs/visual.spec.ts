import process from 'node:process';

import { openFirstArticle, openFirstDepartment, waitForPage } from '../support/navigation';
import { test } from '../support/test';
import { expectPageToMatchBaseline, installScreenshotEnvironment } from '../support/visual';

/**
 * The routes worth a baseline: one per layout the site actually has. `/impressum`, `/datenschutz`
 * and `/barrierefreiheit` are left out on purpose — they are the same prose layout three times over
 * and would only add baselines to re-approve on every typography change.
 */
const STATIC_ROUTES: { name: string; route: string }[] = [
	{ name: 'home', route: '/' },
	{ name: 'club', route: '/verein' },
	{ name: 'offers', route: '/angebot' },
	{ name: 'news', route: '/news' },
	{ name: 'membership', route: '/mitgliedschaft' },
	{ name: 'contact', route: '/kontakt' },
];

test.describe('visual regression', { tag: '@visual' }, () => {
	// Baselines are pixel-comparable only against the platform that produced them. They are generated
	// in the pinned Playwright container — the same image CI runs in — so a run anywhere else would
	// compare against foreign pixels. `pnpm run test:e2e:visual:update` is the way in from macOS.
	test.skip(
		process.platform !== 'linux',
		'Baselines are Linux-only — run `pnpm run test:e2e:visual:update` to work with them.',
	);

	test.beforeEach(async ({ page }) => {
		await installScreenshotEnvironment(page);
	});

	for (const { name, route } of STATIC_ROUTES) {
		test(`renders ${route} unchanged`, async ({ page }) => {
			await page.goto(route);
			await waitForPage(page);

			await expectPageToMatchBaseline(page, name);
		});
	}

	// The dynamic routes are reached by clicking through, not by a hard-coded slug: the recorded
	// fixtures are re-recorded from the live dataset, and a slug that disappears would turn a content
	// edit into a red suite.
	test('renders a department page unchanged', async ({ page }) => {
		await openFirstDepartment(page);

		await expectPageToMatchBaseline(page, 'department');
	});

	test('renders a news article unchanged', async ({ page }) => {
		await openFirstArticle(page);

		await expectPageToMatchBaseline(page, 'news-article');
	});
});
