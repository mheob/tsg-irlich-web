import { VisualEditing } from 'next-sanity/visual-editing';
import type * as visualEditing from 'next-sanity/visual-editing';
import type * as googleFonts from 'next/font/google';
import { draftMode } from 'next/headers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RootLayout, { metadata } from '@/app/layout';
import { DisableDraftMode } from '@/components/with-logic/disable-draft-mode';
import { Navigation } from '@/components/with-logic/navigation';
import type { client } from '@/lib/sanity/client';

import { findElement } from '../../test-utils/react-tree';
import { clientFetchMock } from '../../test-utils/sanity-client-mock';

/**
 * Stands in for a `next/font/google` loader, which runs at build time and is unavailable here.
 *
 * @returns The class names the layout reads off a font.
 */
function testFont(): { className: string; variable: string } {
	return { className: 'font', variable: '--font-test' };
}

type GoogleFonts = typeof googleFonts;

/**
 * Stands in for a component the layout only decides to render or not.
 *
 * @returns Nothing to render.
 */
function nullComponent(): null {
	return null;
}

// `next/font/google` runs the font loader at build time and is unavailable in a test run; the
// layout only ever reads the `variable` class name of each font.
vi.mock(
	import('next/font/google'),
	() =>
		// The real loaders return a much larger object; the layout only reads `variable`.
		({ Bebas_Neue: testFont, Inter: testFont, Oswald: testFont }) as unknown as GoogleFonts,
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

// Both pull in Next-internal client entry points that a plain node test run cannot resolve; the
// layout only decides whether they are rendered at all.
vi.mock(
	import('next-sanity/visual-editing'),
	() => ({ VisualEditing: nullComponent }) as unknown as typeof visualEditing,
);
vi.mock(import('@vercel/analytics/next'), () => ({ Analytics: () => null }));

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
		expect(metadata.title).toBe('TSG Irlich — deine Turn- und Sportgemeinde in Neuwied / Irlich');
		expect(metadata.alternates?.types).toStrictEqual({ 'application/rss+xml': '/feed.xml' });
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

	it('survives a failing navigation query', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockReturnValue();
		mockDraftMode(false);
		mockedFetch.mockRejectedValue(new Error('content lake unreachable'));

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, Navigation)?.props.navItems).toStrictEqual([]);
		warnSpy.mockRestore();
	});

	it('leaves the visual editing out while draft mode is off', async () => {
		mockDraftMode(false);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, VisualEditing)).toBeUndefined();
		expect(findElement(layout, DisableDraftMode)).toBeUndefined();
	});

	it('adds the visual editing and the exit link while draft mode is on', async () => {
		mockDraftMode(true);
		mockedFetch.mockResolvedValue({ mainNavigation: [NAV_ITEM] });

		const layout = await RootLayout({ children: null });

		expect(findElement(layout, VisualEditing)).toBeDefined();
		expect(findElement(layout, DisableDraftMode)).toBeDefined();
	});
});
