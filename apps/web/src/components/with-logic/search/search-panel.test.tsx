import { setTimeout as sleep } from 'node:timers/promises';

import { waitFor, within } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import type { MockInstance } from 'vite-plus/test';

import type { SearchResult } from '@/lib/search/types';

import { renderWithUser } from '../../../../test-utils/render';
import {
	buildSearchHit,
	buildSearchHits,
	buildSearchResult,
} from '../../../../test-utils/search-fixtures';
import { routerMock } from '../../../../test-utils/setup-dom';
import { SearchPanel } from './search-panel';

const POPULAR = { terms: ['Fußball', 'Tanzen'], title: 'Häufig gesucht' };

/** The term the fake route answers with a server error. */
const FAILING_TERM = 'Kaputt';

const RESULTS: Record<string, SearchResult> = {
	Diamonds: buildSearchResult({
		news: buildSearchHits('Bericht', 3, { kind: 'news', meta: '01.03.2026 · Breitensport' }),
		pages: buildSearchHits('Diamonds', 3),
		query: 'Diamonds',
		totals: { news: 9, pages: 4 },
		words: ['diamonds'],
	}),
	Tanzen: buildSearchResult({
		news: [
			buildSearchHit({
				href: '/news/breitensport/tanz-in-den-mai',
				id: 'news-tanz-in-den-mai',
				kind: 'news',
				meta: '01.05.2026 · Breitensport',
				title: 'Tanz in den Mai',
			}),
		],
		pages: [buildSearchHit()],
		totals: { news: 1, pages: 1 },
	}),
};

/**
 * Reads the URL of a `fetch` call, whatever shape it was made with.
 *
 * @param input - The first argument of the call.
 * @returns The URL, resolved against the test origin.
 */
function getRequestUrl(input: RequestInfo | URL): URL {
	if (input instanceof URL) {
		return input;
	}

	return new URL(typeof input === 'string' ? input : input.url, 'http://localhost');
}

/**
 * Stands in for both search routes: „Häufig gesucht“, and a search that knows `RESULTS`, fails for
 * `FAILING_TERM` and finds nothing for any other term.
 *
 * @param input - The first argument of the call.
 * @returns The answer of the route.
 */
async function answerSearchRoutes(input: RequestInfo | URL): Promise<Response> {
	const url = getRequestUrl(input);

	// Mirrors the real `fetch`, which hands back the response on a later microtask.
	await Promise.resolve();

	if (url.pathname === '/api/search/popular') {
		return Response.json(POPULAR);
	}

	const term = url.searchParams.get('q') ?? '';

	if (term === FAILING_TERM) {
		return new Response('', { status: 500 });
	}

	return Response.json(RESULTS[term] ?? buildSearchResult({ query: term, words: [term] }));
}

/**
 * The lupe and the panel, wired the way the navigation wires them.
 *
 * @param props - The harness's props.
 * @param props.placeholder - The placeholder of the search page.
 * @returns The lupe and the panel.
 */
function PanelHarness({ placeholder }: Readonly<{ placeholder?: string | null }>) {
	const [isOpen, setIsOpen] = useState(false);
	const lupeRef = useRef<HTMLButtonElement>(null);

	return (
		<>
			<button
				onClick={() => {
					setIsOpen(true);
				}}
				ref={lupeRef}
				type="button"
			>
				Suche öffnen
			</button>
			<SearchPanel
				finalFocus={lupeRef}
				onOpenChange={setIsOpen}
				open={isOpen}
				placeholder={placeholder}
			/>
		</>
	);
}

/**
 * Renders the harness and opens the panel through its lupe.
 *
 * @param placeholder - The placeholder of the search page.
 * @returns The render result, the dialog, its input and the lupe.
 */
async function openPanel(placeholder?: string | null) {
	const view = renderWithUser(<PanelHarness placeholder={placeholder} />);
	const lupe = view.getByRole('button', { name: 'Suche öffnen' });

	await view.user.click(lupe);

	const dialog = await view.findByRole('dialog', { name: 'Website durchsuchen' });
	const input = within(dialog).getByRole('combobox', { name: 'Suchbegriff' });

	await waitFor(() => {
		expect(document.activeElement).toBe(input);
	});

	return { ...view, dialog, input, lupe };
}

describe('the search panel', () => {
	let fetchSpy: MockInstance<typeof fetch>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(answerSearchRoutes);
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	it('opens as a dialog with the input and a button to close it', async () => {
		const { dialog, input } = await openPanel();

		expect(input.getAttribute('placeholder')).toBe('Wonach suchst du?');
		expect(within(dialog).getByRole('button', { name: 'Suche schließen' })).not.toBeNull();
	});

	it('takes the placeholder of the search page', async () => {
		const { input } = await openPanel('Sportart, Gruppe oder Name');

		expect(input.getAttribute('placeholder')).toBe('Sportart, Gruppe oder Name');
	});

	it('offers the popular searches while the input is empty', async () => {
		const { dialog } = await openPanel();

		await expect(
			within(dialog).findByRole('heading', { name: 'Häufig gesucht' }),
		).resolves.not.toBeNull();
		expect(within(dialog).getByRole('link', { name: 'Fußball' }).getAttribute('href')).toBe(
			'/suche?q=Fu%C3%9Fball',
		);
	});

	// Review focus 1: input of nothing but operators or punctuation searches for nothing.
	it('keeps the popular searches and asks the search route nothing for input without letters', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, '-"*');
		// Longer than the debounce, after which a search would have gone out.
		await sleep(400);

		expect(within(dialog).getByRole('link', { name: 'Fußball' })).not.toBeNull();
		expect(fetchSpy.mock.calls.map(([request]) => getRequestUrl(request).pathname)).not.toContain(
			'/api/search',
		);
	});

	it('lists the hits of „Seiten“ and „News“ as options of their groups', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, 'Tanzen');

		const pages = await within(dialog).findByRole('group', { name: 'Seiten' });
		const option = within(pages).getByRole('option', { name: 'Tanzen' });
		expect(option.getAttribute('href')).toBe('/angebot/tanzen');
		expect(option.getAttribute('aria-selected')).toBe('false');

		const news = within(dialog).getByRole('group', { name: 'News' });
		expect(within(news).getByRole('option', { name: 'Tanz in den Mai' })).not.toBeNull();
	});

	it('wires the input to the listbox as a combobox', async () => {
		const { dialog, input, user } = await openPanel();

		expect(input.getAttribute('aria-autocomplete')).toBe('list');
		expect(input.getAttribute('aria-expanded')).toBe('false');
		expect(input.getAttribute('aria-controls')).toBeNull();

		await user.type(input, 'Tanzen');
		const listbox = await within(dialog).findByRole('listbox');

		expect(input.getAttribute('aria-expanded')).toBe('true');
		expect(input.getAttribute('aria-controls')).toBe(listbox.id);
	});

	it('marks the first option on ArrowDown and opens it on Enter', async () => {
		const { dialog, input, queryByRole, user } = await openPanel();
		await user.type(input, 'Tanzen');
		const option = await within(dialog).findByRole('option', { name: 'Tanzen' });

		await user.keyboard('{ArrowDown}');

		expect(option.getAttribute('aria-selected')).toBe('true');
		expect(input.getAttribute('aria-activedescendant')).toBe(option.id);

		await user.keyboard('{Enter}');

		expect(routerMock.push).toHaveBeenCalledExactlyOnceWith('/angebot/tanzen');
		await waitFor(() => {
			expect(queryByRole('dialog')).toBeNull();
		});
	});

	it('goes to the search page on Enter without a marked option', async () => {
		const { input, queryByRole, user } = await openPanel();

		await user.type(input, ' Tanzen {Enter}');

		expect(routerMock.push).toHaveBeenCalledExactlyOnceWith('/suche?q=Tanzen');
		await waitFor(() => {
			expect(queryByRole('dialog')).toBeNull();
		});
	});

	it('goes to the search page without a term on Enter in the empty input', async () => {
		const { user } = await openPanel();

		await user.keyboard('{Enter}');

		expect(routerMock.push).toHaveBeenCalledExactlyOnceWith('/suche');
	});

	it('drops the mark as soon as the input changes, so Enter never opens a stale hit', async () => {
		const { dialog, input, user } = await openPanel();
		await user.type(input, 'Tanzen');
		const option = await within(dialog).findByRole('option', { name: 'Tanzen' });
		await user.keyboard('{ArrowDown}');

		await user.type(input, 'x');

		// The hits of „Tanzen“ stay on screen until the new answer is in, but none is marked.
		expect(option.getAttribute('aria-selected')).toBe('false');
		expect(input.getAttribute('aria-activedescendant')).toBeNull();

		await user.keyboard('{Enter}');

		expect(routerMock.push).toHaveBeenCalledExactlyOnceWith('/suche?q=Tanzenx');
	});

	it('closes when a hit is clicked', async () => {
		const { dialog, input, queryByRole, user } = await openPanel();
		await user.type(input, 'Tanzen');

		await user.click(await within(dialog).findByRole('option', { name: 'Tanzen' }));

		await waitFor(() => {
			expect(queryByRole('dialog')).toBeNull();
		});
	});

	it('closes on Escape and hands the focus back to the lupe', async () => {
		const { lupe, queryByRole, user } = await openPanel();

		await user.keyboard('{Escape}');

		await waitFor(() => {
			expect(queryByRole('dialog')).toBeNull();
		});
		await waitFor(() => {
			expect(document.activeElement).toBe(lupe);
		});
	});

	it('closes through its close button', async () => {
		const { dialog, queryByRole, user } = await openPanel();

		await user.click(within(dialog).getByRole('button', { name: 'Suche schließen' }));

		await waitFor(() => {
			expect(queryByRole('dialog')).toBeNull();
		});
	});

	it('links to all hits of a group, outside the listbox, when the group shows only some', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, 'Diamonds');

		const morePages = await within(dialog).findByRole('link', { name: 'Alle 4 Seiten anzeigen' });
		const moreNews = within(dialog).getByRole('link', { name: 'Alle 9 News anzeigen' });
		expect(morePages.getAttribute('href')).toBe('/suche?q=Diamonds&typ=seiten');
		expect(moreNews.getAttribute('href')).toBe('/suche?q=Diamonds&typ=news');

		const listbox = within(dialog).getByRole('listbox');
		expect(listbox.contains(morePages)).toBe(false);
		expect(listbox.contains(moreNews)).toBe(false);
	});

	it('links to no more hits when every group shows all of its own', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, 'Tanzen');
		await within(dialog).findByRole('option', { name: 'Tanzen' });

		expect(within(dialog).queryByRole('link', { name: /^Alle /u })).toBeNull();
	});

	it('says that nothing was found and links to the search page', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, 'Xyz');

		await expect(within(dialog).findByText('Keine Treffer für „Xyz“.')).resolves.not.toBeNull();
		expect(within(dialog).getByRole('link', { name: 'Zur Suchseite' }).getAttribute('href')).toBe(
			'/suche?q=Xyz',
		);
		expect(within(dialog).queryByRole('listbox')).toBeNull();
		expect(input.getAttribute('aria-expanded')).toBe('false');
	});

	it('says when the search cannot be reached and links to the search page', async () => {
		const { dialog, input, user } = await openPanel();

		await user.type(input, FAILING_TERM);

		await expect(
			within(dialog).findByText('Die Suche ist gerade nicht erreichbar.'),
		).resolves.not.toBeNull();
		expect(within(dialog).getByRole('link', { name: 'Zur Suchseite' }).getAttribute('href')).toBe(
			`/suche?q=${FAILING_TERM}`,
		);
	});

	it('announces a running search in a polite live region', async () => {
		const { dialog, input, user } = await openPanel();
		const status = within(dialog).getByRole('status');

		expect(status.getAttribute('aria-live')).toBe('polite');
		expect(status.textContent).toBe('');

		await user.type(input, 'Tanzen');

		expect(status.textContent).toBe('Suche läuft …');

		await within(dialog).findByRole('option', { name: 'Tanzen' });

		expect(status.textContent).toBe('');
	});
});
