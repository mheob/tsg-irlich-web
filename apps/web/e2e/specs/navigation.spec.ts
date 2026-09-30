import { openFirstArticle, waitForPage } from '../support/navigation';
import { expect, test } from '../support/test';

test.describe('navigation', () => {
	test('walks the main navigation on desktop', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the main navigation collapses into the mobile menu');

		await page.goto('/');

		const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });

		await navigation.getByRole('link', { name: 'Angebot', exact: true }).click();
		await expect(page).toHaveURL('/angebot');
		await expect(
			page.getByRole('heading', { name: 'Unsere Abteilungen', exact: true }),
		).toBeVisible();

		// The item for the page you are on is the only one carrying `aria-current`.
		await expect(navigation.getByRole('link', { name: 'Angebot', exact: true })).toHaveAttribute(
			'aria-current',
			'page',
		);
		await expect(
			navigation.getByRole('link', { name: 'Aktuelles', exact: true }),
		).not.toHaveAttribute('aria-current', 'page');

		await navigation.getByRole('link', { name: 'Aktuelles', exact: true }).click();
		await expect(page).toHaveURL('/news');

		await navigation.getByRole('link', { name: 'Mitgliedschaft', exact: true }).click();
		await expect(page).toHaveURL('/mitgliedschaft');

		await navigation.getByRole('link', { name: 'Home', exact: true }).click();
		await expect(page).toHaveURL('/');
	});

	test('keeps the collapsed mobile menu out of reach, then opens it and navigates from it', async ({
		isMobile,
		page,
	}) => {
		test.skip(!isMobile, 'the mobile menu only exists below the desktop breakpoint');

		await page.goto('/');

		const toggle = page.getByRole('button', { name: 'Menü' });

		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toHaveAttribute('aria-controls', 'mobile-navigation');

		const menu = page.locator('#mobile-navigation');

		// The collapsed menu stays in the DOM so the open/close transition has something to animate,
		// and `inert` is what keeps its links out of the tab order and out of the accessibility tree.
		// Asking for the focus outright is the sharper check of the two: it also fails when only the
		// tab order was patched up. Before this was fixed, the focus landed on an invisible link.
		const collapsedLink = menu.locator('a[href="/angebot"]');
		await collapsedLink.evaluate((element: HTMLElement) => {
			element.focus();
		});
		await expect(collapsedLink).not.toBeFocused();

		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Open, the same link takes the focus and can be reached by keyboard.
		const link = menu.getByRole('link', { name: 'Angebot', exact: true });
		await link.focus();
		await expect(link).toBeFocused();

		// Escape closes the menu from inside it and hands the focus back to the toggle. Without that,
		// collapsing the menu makes it `inert` and the browser drops the focus to `<body>`.
		await page.keyboard.press('Escape');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await expect(toggle).toBeFocused();

		await toggle.click();
		await link.click();
		await expect(page).toHaveURL('/angebot');
	});

	test('opens the club group on desktop and leads to its overview', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the desktop bar only exists from the lg breakpoint');

		await page.goto('/');
		await waitForPage(page);

		const trigger = page
			.getByRole('navigation', { name: 'Hauptnavigation' })
			.getByRole('button', { name: 'Verein', exact: true });

		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		// The panel is portalled to the end of `<body>`, outside the navigation landmark.
		const overview = page.getByRole('link', { name: 'Übersicht', exact: true });

		await expect(overview).toBeVisible();
		await expect(page.getByRole('link', { name: /^Stadt Neuwied/u })).toHaveAttribute(
			'target',
			'_blank',
		);

		await overview.click();
		await expect(page).toHaveURL('/verein');
		await expect(overview).toBeHidden();
	});

	test('operates the club group by keyboard on desktop', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the desktop bar only exists from the lg breakpoint');

		await page.goto('/');
		await waitForPage(page);

		const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
		const trigger = navigation.getByRole('button', { name: 'Verein', exact: true });

		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: 'Übersicht', exact: true })).toBeFocused();

		// Escape closes the panel from inside it and hands the focus back to the trigger.
		await page.keyboard.press('Escape');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
		await expect(trigger).toBeFocused();

		// Tabbing past the last link leaves the panel, closes it and moves on through the bar.
		await page.keyboard.press('Enter');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');
		await expect(page.getByRole('link', { name: /^Stadt Neuwied/u })).toBeFocused();
		await page.keyboard.press('Tab');
		await expect(navigation.getByRole('link', { name: 'Angebot', exact: true })).toBeFocused();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('keeps the open panel under its trigger while the page scrolls', async ({
		isMobile,
		page,
	}) => {
		test.skip(isMobile, 'the desktop bar only exists from the lg breakpoint');

		await page.goto('/');
		await waitForPage(page);

		const trigger = page
			.getByRole('navigation', { name: 'Hauptnavigation' })
			.getByRole('button', { name: 'Verein', exact: true });

		await trigger.focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('link', { name: 'Übersicht', exact: true })).toBeVisible();

		// The header is fixed. A panel positioned against the document scrolls away with the page and
		// only glides back once Floating UI and the position transition catch up, so the panel is
		// measured right after the scroll, before either of them had a chance to hide the jump. The
		// mobile menu's copy of "Übersicht" is hidden and has no box, hence the client rects filter.
		const panelTop = await page.evaluate(() => {
			window.scrollTo({ behavior: 'instant', top: 300 });

			const overview = [...document.querySelectorAll('a')].find(
				(link) => link.textContent === 'Übersicht' && link.getClientRects().length > 0,
			);
			return overview?.getBoundingClientRect().top ?? Number.NaN;
		});

		expect(panelTop).toBeGreaterThan(0);
	});

	test('expands the club group in the mobile menu and follows a sub-entry', async ({
		isMobile,
		page,
	}) => {
		test.skip(!isMobile, 'the mobile menu only exists below the desktop breakpoint');

		await page.goto('/');
		await waitForPage(page);

		const toggle = page.getByRole('button', { name: 'Menü' });
		const menu = page.locator('#mobile-navigation');
		const group = menu.getByRole('button', { name: 'Verein', exact: true });

		await toggle.click();
		await expect(group).toHaveAttribute('aria-expanded', 'false');
		await expect(menu.getByRole('link', { name: 'Übersicht', exact: true })).toBeHidden();

		await group.click();
		await expect(group).toHaveAttribute('aria-expanded', 'true');

		await menu.getByRole('link', { name: 'Kontakt', exact: true }).click();
		await expect(page).toHaveURL('/kontakt');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	test('fits the contact button to the width of the bar', async ({ isMobile, page }) => {
		test.skip(isMobile, 'the viewport is set by hand here; one browser project covers it');

		const navigation = page.getByRole('navigation', { name: 'Hauptnavigation' });
		const short = navigation.getByRole('link', { name: 'Kontakt', exact: true });
		const long = navigation.getByRole('link', { name: 'Kontakt aufnehmen', exact: true });

		// Between lg and xl the bar is tight, so the button shrinks to its short label.
		await page.setViewportSize({ height: 800, width: 1100 });
		await page.goto('/');
		await waitForPage(page);
		await expect(short).toBeVisible();
		await expect(long).toBeHidden();

		await page.setViewportSize({ height: 800, width: 1280 });
		await expect(short).toBeHidden();
		await expect(long).toBeVisible();

		// Below lg it lives in the mobile menu, which used to hide it from 640 px on.
		await page.setViewportSize({ height: 1000, width: 800 });
		await page.getByRole('button', { name: 'Menü' }).click();
		await expect(
			page
				.locator('#mobile-navigation')
				.getByRole('link', { name: 'Kontakt aufnehmen', exact: true }),
		).toBeVisible();
	});

	test('names every navigation landmark, so a landmark list can tell them apart', async ({
		page,
	}) => {
		await page.goto('/');
		await waitForPage(page);

		// The three the home page carries. `landmark-unique` would report them, but it is an axe
		// `best-practice` rule and the sweep deliberately runs the WCAG tags only, so this spec is
		// what holds the names in place.
		for (const name of ['Hauptnavigation', 'Fußzeilennavigation', 'Social Media']) {
			await expect(page.getByRole('navigation', { exact: true, name })).toHaveCount(1);
		}

		// The fourth only exists below the overviews.
		await openFirstArticle(page);
		await expect(page.getByRole('navigation', { exact: true, name: 'Breadcrumb' })).toHaveCount(1);
	});

	test('reaches every legal page from the footer', async ({ page }) => {
		await page.goto('/');
		// The footer sits a long scroll below the fold, so the first click can land before the App
		// Router has hydrated, and WebKit then drops the navigation.
		await waitForPage(page);

		const footer = page.getByRole('contentinfo');

		await footer.getByRole('link', { name: 'Impressum' }).click();
		await expect(page).toHaveURL('/impressum');

		await footer.getByRole('link', { name: 'Datenschutz' }).click();
		await expect(page).toHaveURL('/datenschutz');

		await footer.getByRole('link', { name: 'Barrierefreiheit' }).click();
		await expect(page).toHaveURL('/barrierefreiheit');

		await footer.getByRole('link', { name: 'Feedback geben' }).click();
		await expect(page).toHaveURL('/kontakt/feedback');
	});
});
