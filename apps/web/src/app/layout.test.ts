import { VisualEditing } from 'next-sanity/visual-editing';
import type * as visualEditing from 'next-sanity/visual-editing';
import type localFont from 'next/font/local';
import { draftMode } from 'next/headers';
import { Children } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import RootLayout, { metadata } from '@/app/layout';
import { JsonLd } from '@/components/ui/json-ld';
import { SkipLink } from '@/components/ui/skip-link';
import { DisableDraftModeLazy } from '@/components/with-logic/disable-draft-mode-lazy';
import { Navigation } from '@/components/with-logic/navigation/navigation';
import type { client } from '@/lib/sanity/client';
import { searchPlaceholderQuery } from '@/lib/sanity/queries/search';

import { findElement } from '../../test-utils/react-tree';
import { clientFetchMock } from '../../test-utils/sanity-client-mock';

/**
 * Stands in for the `next/font/local` loader, which runs at build time and is unavailable here.
 *
 * @returns The class names the layout reads off a font.
 */
function testFont(): { className: string; variable: string } {
	return { className: 'font', variable: '--font-test' };
}

/**
 * Stands in for a component the layout only decides to render or not.
 *
 * @returns Nothing to render.
 */
function nullComponent(): null {
	return null;
}

// `next/font/local` runs the font loader at build time and is unavailable in a test run; the
// layout only ever reads the `variable` class name of each font.
vi.mock(
	import('next/font/local'),
	() =>
		// The real loader returns a much larger object; the layout only reads `variable`.
		({ default: testFont }) as unknown as { default: typeof localFont },
);

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

// `defineLive` reads `SANITY_API_READ_TOKEN` at import time and would open a live connection.
vi.mock(import('@/lib/sanity/live'), () => ({
	// Its own stub, not `nullComponent`: the tree is searched by component identity, so two
	// mocks sharing one function would be indistinguishable.
	SanityLive: () => null,
}));

vi.mock(import('next/headers'), () => ({ draftMode: vi.fn() }));

// All three pull in Next-internal client entry points that a plain node test run cannot resolve;
// the layout only decides whether they are rendered at all.
vi.mock(
	import('next-sanity/visual-editing'),
	() => ({ VisualEditing: nullComponent }) as unknown as typeof visualEditing,
);
vi.mock(import('@vercel/analytics/next'), () => ({ Analytics: () => null }));
vi.mock(import('@vercel/speed-insights/next'), () => ({ SpeedInsights: () => null }));

const mockedFetch = clientFetchMock();
const mockedDraftMode = vi.mocked(draftMode);

const NAV_ITEM = { _key: 'news', title: 'News' };

function mockDraftMode(isEnabled: boolean): void {
	// The real return value also carries `enable`/`disable`; the layout only reads `isEnabled`.
	mockedDraftMode.mockResolvedValue({ isEnabled } as unknown as Awaited<
		ReturnType<typeof draftMode>
	>);
}

describe('the root layout', () => {
	afterEach(() => {
		mockedFetch.mockReset();
		mockedDraftMode.mockReset();
	});

	it('carries the club-wide metadata and points at the feed', () => {
		expect(metadata.title).toStrictEqual({
			default: 'TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich',
			template: '%s | TSG Irlich',
		});
		expect(metadata.alternates?.types).toStrictEqual({ 'application/rss+xml': '/feed.xml' });
	});

	it('names the site in the open graph fields and asks for large social previews', () => {
		expect(metadata.openGraph).toMatchObject({
			locale: 'de_DE',
			siteName: 'TSG Irlich',
			type: 'website',
		});
		expect(metadata.twitter).toStrictEqual({ card: 'summary_large_image' });
	});

	it('describes the club and the website as structured data', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ contact: { email: 'info@tsg-irlich.de' }, mainNavigation: [] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, JsonLd)?.props.data).toMatchObject({
			'@graph': [
				{ '@type': 'SportsOrganization', email: 'info@tsg-irlich.de', name: 'TSG Irlich' },
				{ '@type': 'WebSite', name: 'TSG Irlich' },
			],
		});
	});

	// WEB-370: the revalidation webhook tags its run with the document type, so both fetches of the
	// site settings carry the `site-settings` tag; without it a menu change waited out the 12 hours.
	// The placeholder belongs to the search page and expires with its type, read as published like
	// every fetch of the search. Each carries a `revalidate` as well: without one a dynamic render
	// (draft mode, a page that reads its search params) asks Sanity again on every request. The
	// organization comes through the helper the footer reads it with (WEB-415).
	it('tags each of its fetches with the type it reads', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [] });

		await RootLayout({ children: null });

		expect(mockedFetch.mock.calls.map((call) => call[2])).toStrictEqual([
			{ next: { revalidate: 43_200, tags: ['site-settings'] } },
			{ next: { revalidate: 43_200, tags: ['site-settings'] } },
			{ next: { revalidate: 43_200, tags: ['searchPage'] }, perspective: 'published' },
		]);
	});

	it('hands the navigation the placeholder of the search page', async () => {
		mockDraftMode(false);
		// The navigation, the organization and the placeholder, in the order the layout asks.
		mockedFetch
			.mockResolvedValueOnce({ mainNavigation: [] })
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce('Sportart, Gruppe oder Name');

		const layout = await RootLayout({ children: null });

		expect(mockedFetch.mock.calls[2]?.[0]).toBe(searchPlaceholderQuery);
		expect(findElement(layout, Navigation)?.props.searchPlaceholder).toBe(
			'Sportart, Gruppe oder Name',
		);
	});

	it('hands the navigation the items it fetched', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, Navigation)?.props.navItems).toStrictEqual([NAV_ITEM]);
	});

	it('warns and renders an empty navigation when the query returned none', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, Navigation)?.props.navItems).toStrictEqual([]);
		expect(warnSpy).toHaveBeenCalledWith('No navigation items loaded from Sanity');
		warnSpy.mockRestore();
	});

	it('survives failing queries', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();
		mockDraftMode(false);
		mockedFetch.mockRejectedValue(new Error('content lake unreachable'));

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, Navigation)?.props.navItems).toStrictEqual([]);
		expect(findElement(layout, Navigation)?.props.searchPlaceholder).toBeNull();
		warnSpy.mockRestore();
	});

	// WEB-419: the skip link is the first focusable element of every page, and its target can take
	// the focus, so the next Tab starts in the content.
	it('opens the body with a skip link to the main content', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });
		const [firstChild] = Children.toArray(
			findElement<{ children?: ReactNode }>(layout, 'body')?.props.children,
		);

		expect(firstChild).toMatchObject({ props: { targetId: 'main' }, type: SkipLink });
		expect(findElement<{ id?: string; tabIndex?: number }>(layout, 'main')?.props).toMatchObject({
			id: 'main',
			tabIndex: -1,
		});
	});

	it('leaves the visual editing out while draft mode is off', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, VisualEditing)).toBeUndefined();
		expect(findElement(layout, DisableDraftModeLazy)).toBeUndefined();
	});

	it('adds the visual editing and the exit link while draft mode is on', async () => {
		mockDraftMode(true);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, VisualEditing)).toBeDefined();
		expect(findElement(layout, DisableDraftModeLazy)).toBeDefined();
	});
});
