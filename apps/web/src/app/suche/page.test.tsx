import { notFound } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import SearchPage, { generateMetadata } from '@/app/suche/page';
import type { client } from '@/lib/sanity/client';
import { searchPageQuery } from '@/lib/sanity/queries/search';
import { getPopularSearches } from '@/lib/search/popular';
import { searchSite } from '@/lib/search/search-site';

import { PAGE_HERO_IMAGE } from '../../../test-utils/page-images';
import { renderWithUser } from '../../../test-utils/render';
import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import {
	buildSearchHit,
	buildSearchHits,
	buildSearchResult,
} from '../../../test-utils/search-fixtures';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
		fetch: vi.fn(),
	} as unknown as typeof client,
}));

vi.mock(import('@/lib/search/search-site'), () => ({ searchSite: vi.fn() }));
vi.mock(import('@/lib/search/popular'), () => ({ getPopularSearches: vi.fn() }));

// The newsletter form drives a server action, which the page test has no use for.
vi.mock(import('@/actions/subscribe-to-newsletter'), () => ({ subscribeToNewsletter: vi.fn() }));

// The hero's breadcrumb reads the pathname, which the central mock of `next/navigation` provides;
// replacing the module here takes that with it, so the page's own `usePathname` is stood in for.
vi.mock(import('next/navigation'), () => ({
	notFound: vi.fn(() => {
		throw new Error('NEXT_NOT_FOUND');
	}),
	usePathname: () => '/suche',
}));

const mockedFetch = clientFetchMock();
const mockedSearchSite = vi.mocked(searchSite);
const mockedPopularSearches = vi.mocked(getPopularSearches);

const SEARCH_PAGE = {
	content: {
		contactPersonsSection: {
			contactPersons: [],
			intro: 'Das PR-Team hilft dir weiter.',
			subtitle: 'Ansprechpartner',
			title: 'Wir sind für dich da',
		},
		noResults: {
			links: [
				{
					_key: 'offer',
					href: null,
					link: { _type: 'departmentsPage', category: null, department: null, slug: 'angebot' },
					linkType: 'internal',
					title: 'Unser Angebot',
				},
				{
					_key: 'contact',
					href: null,
					link: { _type: 'contact', category: null, department: null, slug: 'kontakt' },
					linkType: 'internal',
					title: 'Kontakt',
				},
			],
			text: {
				_type: 'simpleBlockContent',
				text: [
					{
						_key: 'p1',
						_type: 'block',
						children: [
							{
								_key: 's1',
								_type: 'span',
								marks: [],
								text: 'Versuch es mit einem kürzeren Begriff.',
							},
						],
						markDefs: [],
						style: 'normal',
					},
				],
			},
			title: 'Leider nichts gefunden',
		},
		searchSection: {
			intro: 'Durchsuche alle Seiten und News der TSG Irlich.',
			placeholder: 'Wonach suchst du?',
			subtitle: 'Suchergebnisse',
			title: 'Was suchst du?',
		},
	},
	heroImage: PAGE_HERO_IMAGE,
	meta: undefined,
	subtitle: 'Finden',
	title: 'Suche',
};

const POPULAR = { terms: ['Trainingszeiten', '1. Mannschaft'], title: 'Häufig gesucht' };

type SearchParams = Record<string, string | string[] | undefined>;

function routeProps(searchParams: SearchParams = {}): PageProps<'/suche'> {
	// `PageProps<'/suche'>` types the search params as a promise.
	return { searchParams: Promise.resolve(searchParams) } as unknown as PageProps<'/suche'>;
}

async function renderPage(searchParams: SearchParams = {}) {
	return renderWithUser(await SearchPage(routeProps(searchParams)));
}

/**
 * Lets the search find „Tanzen“: 4 page hits and 26 news hits, of which the „Alle“ tab shows a few.
 *
 * @param overrides - The fields of the result that differ.
 */
function mockHits(overrides: Parameters<typeof buildSearchResult>[0] = {}): void {
	mockedSearchSite.mockResolvedValue(
		buildSearchResult({
			news: buildSearchHits('Bericht', 3, { kind: 'news' }),
			pages: [buildSearchHit(), ...buildSearchHits('Gruppe', 3)],
			totals: { news: 26, pages: 4 },
			...overrides,
		}),
	);
}

describe('search page', () => {
	beforeEach(() => {
		mockedFetch.mockResolvedValue(SEARCH_PAGE);
		mockedPopularSearches.mockResolvedValue(POPULAR);
		// `searchSite` itself answers `undefined` for a term it cannot use, which is what a mock without
		// an answer returns, so a test that wants hits says so with `mockHits`.
	});

	afterEach(() => {
		mockedFetch.mockReset();
		mockedSearchSite.mockReset();
		mockedPopularSearches.mockReset();
		vi.mocked(notFound).mockClear();
	});

	describe('metadata', () => {
		it('keeps the page out of search engines but lets crawlers follow its links', async () => {
			const metadata = await generateMetadata();

			expect(metadata.robots).toStrictEqual({ follow: true, index: false });
		});

		it('takes the title and the hero image of the singleton', async () => {
			const metadata = await generateMetadata();

			expect(metadata).toMatchObject({ openGraph: { title: 'Suche' }, title: 'Suche' });
			expect(metadata.openGraph?.images).toMatchObject({ alt: 'Hero der Seite' });
		});

		it('prefers the meta title and description of the editors', async () => {
			mockedFetch.mockResolvedValue({
				...SEARCH_PAGE,
				meta: { metaDescription: 'Alles finden', metaTitle: 'Suche · TSG Irlich' },
			});

			await expect(generateMetadata()).resolves.toMatchObject({
				description: 'Alles finden',
				title: { absolute: 'Suche · TSG Irlich' },
			});
		});

		it('points its canonical URL at the page without a search term', async () => {
			const metadata = await generateMetadata();

			expect(metadata.alternates?.canonical).toBe('/suche');
		});

		it('still keeps the page out of search engines while the singleton is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			await expect(generateMetadata()).resolves.toMatchObject({
				robots: { follow: true, index: false },
				title: 'Suche',
			});
		});

		it('reads the singleton as published, tagged for the revalidation webhook', async () => {
			await generateMetadata();

			expect(mockedFetch.mock.calls[0]).toMatchObject([
				searchPageQuery,
				{},
				{ next: { tags: ['searchPage'] }, perspective: 'published' },
			]);
		});
	});

	describe('the frame', () => {
		it('heads the page with the hero of the singleton', async () => {
			const { getByRole } = await renderPage();

			expect(getByRole('heading', { name: 'Suche' })).not.toBeNull();
			expect(getByRole('img', { name: 'Hero der Seite' })).not.toBeNull();
		});

		it('opens the search section with its heading and intro, then the form', async () => {
			const { getByRole, getByText } = await renderPage();

			expect(getByRole('heading', { level: 2, name: 'Was suchst du?' })).not.toBeNull();
			expect(getByText('Durchsuche alle Seiten und News der TSG Irlich.')).not.toBeNull();
			expect(getByRole('searchbox', { name: 'Suchbegriff' }).getAttribute('placeholder')).toBe(
				'Wonach suchst du?',
			);
		});

		it('ends with the contact persons and the newsletter', async () => {
			const { getByRole } = await renderPage({ q: 'Tanzen' });

			expect(getByRole('heading', { name: 'Wir sind für dich da' })).not.toBeNull();
			expect(
				getByRole('heading', { name: 'Bleib auf dem Laufenden und lass dich informieren' }),
			).not.toBeNull();
		});

		it('falls back to the plain page while the singleton is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			const { getByRole, queryByRole } = await renderPage();

			expect(getByRole('heading', { name: 'Suche' })).not.toBeNull();
			expect(queryByRole('img')).toBeNull();
			expect(getByRole('searchbox', { name: 'Suchbegriff' }).getAttribute('placeholder')).toBe(
				'Wonach suchst du?',
			);
			expect(getByRole('heading', { name: 'Häufig gesucht' })).not.toBeNull();
		});

		it('leaves out the contact persons but keeps the newsletter while the singleton is missing', async () => {
			mockedFetch.mockResolvedValue(null);

			const { getByRole, queryByRole } = await renderPage();

			expect(queryByRole('heading', { name: 'Wir sind für dich da' })).toBeNull();
			expect(
				getByRole('heading', { name: 'Bleib auf dem Laufenden und lass dich informieren' }),
			).not.toBeNull();
		});

		// A document published through the API is not held to the studio's required fields.
		it.each([
			['no content at all', undefined],
			['no section in its content', {}],
		])('falls back to the plain page for a singleton with %s', async (_label, content) => {
			mockedFetch.mockResolvedValue({ ...SEARCH_PAGE, content });
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { getByRole, queryByRole } = await renderPage({ q: 'xyz' });

			expect(getByRole('heading', { name: 'Suche' })).not.toBeNull();
			expect(queryByRole('heading', { name: 'Was suchst du?' })).toBeNull();
			expect(getByRole('searchbox', { name: 'Suchbegriff' }).getAttribute('placeholder')).toBe(
				'Wonach suchst du?',
			);
			expect(getByRole('heading', { name: 'Keine Treffer für „xyz“' })).not.toBeNull();
			expect(queryByRole('heading', { name: 'Wir sind für dich da' })).toBeNull();
		});

		it('names the search term in the empty state when the singleton has no title for it', async () => {
			mockedFetch.mockResolvedValue({
				...SEARCH_PAGE,
				content: { ...SEARCH_PAGE.content, noResults: { links: [] } },
			});
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { getByRole } = await renderPage({ q: 'xyz' });

			expect(getByRole('heading', { name: 'Keine Treffer für „xyz“' })).not.toBeNull();
			// The rest of the page still comes from the singleton.
			expect(getByRole('heading', { name: 'Wir sind für dich da' })).not.toBeNull();
		});

		it('names the search term in the empty state while the singleton is missing', async () => {
			mockedFetch.mockResolvedValue(null);
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { getByRole } = await renderPage({ q: 'xyz' });

			expect(getByRole('heading', { name: 'Keine Treffer für „xyz“' })).not.toBeNull();
		});
	});

	describe('with hits', () => {
		it('sums both groups in the summary', async () => {
			mockHits();

			const { getByText } = await renderPage({ q: 'Tanzen' });

			// The count is bold, so the sentence is spread over two nodes.
			expect(getByText('30 Treffer', { selector: 'strong' }).parentElement?.textContent).toBe(
				'30 Treffer für „Tanzen“',
			);
		});

		it('lists the hits of „Alle“, with a link to the hit', async () => {
			mockHits();

			const { getByRole } = await renderPage({ q: 'Tanzen' });

			expect(getByRole('link', { name: 'Tanzen' }).getAttribute('href')).toBe('/angebot/tanzen');
			expect(getByRole('heading', { level: 2, name: 'Seiten' })).not.toBeNull();
			expect(getByRole('heading', { level: 2, name: 'News' })).not.toBeNull();
			expect(getByRole('link', { name: 'Alle 26 News-Treffer anzeigen' })).not.toBeNull();
		});

		it('searches „Alle“ for the term of the URL', async () => {
			mockHits();

			await renderPage({ q: 'Tanzen' });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', { page: 1, tab: 'alle' });
		});

		it('offers the tabs and marks „Alle“ as the current one', async () => {
			mockHits();

			const { getByRole } = await renderPage({ q: 'Tanzen' });

			expect(getByRole('navigation', { name: 'Trefferart' })).not.toBeNull();
			expect(getByRole('link', { name: 'Alle 30' }).getAttribute('aria-current')).toBe('page');
			expect(getByRole('link', { name: 'Seiten 4' }).getAttribute('aria-current')).toBeNull();
			expect(getByRole('link', { name: 'News 26' }).getAttribute('href')).toBe(
				'/suche?q=Tanzen&typ=news',
			);
		});

		it('keeps the term in the form, so a new search starts from it', async () => {
			mockHits();

			const { getByRole } = await renderPage({ q: 'Tanzen' });

			expect((getByRole('searchbox', { name: 'Suchbegriff' }) as HTMLInputElement).value).toBe(
				'Tanzen',
			);
		});

		it('shows no popular searches next to hits', async () => {
			mockHits();

			const { queryByRole } = await renderPage({ q: 'Tanzen' });

			expect(queryByRole('heading', { name: 'Häufig gesucht' })).toBeNull();
		});

		it('reads the term from the first value of a repeated parameter', async () => {
			mockHits();

			await renderPage({ q: ['Tanzen', 'Turnen'] });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', expect.anything());
		});
	});

	describe('tabs and pages', () => {
		it('lists one group on the tab of the typ parameter and pages through it', async () => {
			mockHits({ news: buildSearchHits('Bericht', 6, { kind: 'news' }), pages: [] });

			const { getByRole, queryByRole } = await renderPage({ q: 'Tanzen', seite: '3', typ: 'news' });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', { page: 3, tab: 'news' });
			expect(getByRole('link', { name: 'News 26' }).getAttribute('aria-current')).toBe('page');
			expect(queryByRole('heading', { name: 'Seiten' })).toBeNull();
			expect(getByRole('link', { name: 'Seite 3' }).getAttribute('aria-current')).toBe('page');
			expect(getByRole('link', { name: 'Seite 2' }).getAttribute('href')).toBe(
				'/suche?q=Tanzen&typ=news&seite=2',
			);
		});

		it('keeps the tab in the form as a hidden typ', async () => {
			mockHits();

			const { getByRole } = await renderPage({ q: 'Tanzen', typ: 'seiten' });

			const form = getByRole('search') as HTMLFormElement;
			expect(Object.fromEntries(new FormData(form))).toStrictEqual({ q: 'Tanzen', typ: 'seiten' });
		});

		it('treats a typ that does not exist as „Alle“', async () => {
			mockHits();

			const { getByRole } = await renderPage({ q: 'Tanzen', typ: 'foo' });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', { page: 1, tab: 'alle' });
			expect(getByRole('link', { name: 'Alle 30' }).getAttribute('aria-current')).toBe('page');
		});

		it('ignores the page number on „Alle“', async () => {
			mockHits();

			await renderPage({ q: 'Tanzen', seite: '9' });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', { page: 1, tab: 'alle' });
			expect(vi.mocked(notFound)).not.toHaveBeenCalled();
		});

		it.each(['abc', '0', '-2', ''])('reads the page number %j as the first page', async (seite) => {
			mockHits({ pages: buildSearchHits('Gruppe', 10), totals: { news: 0, pages: 25 } });

			await renderPage({ q: 'Tanzen', seite, typ: 'seiten' });

			expect(mockedSearchSite).toHaveBeenCalledWith('Tanzen', { page: 1, tab: 'seiten' });
		});

		it('answers a page beyond the last one with not found', async () => {
			mockHits({ news: [], totals: { news: 26, pages: 4 } });

			await expect(
				SearchPage(routeProps({ q: 'Tanzen', seite: '9', typ: 'news' })),
			).rejects.toThrow('NEXT_NOT_FOUND');
			expect(vi.mocked(notFound)).toHaveBeenCalledWith();
		});

		it('judges the page by the total of its own tab', async () => {
			mockHits({ pages: [], totals: { news: 26, pages: 4 } });

			await expect(
				SearchPage(routeProps({ q: 'Tanzen', seite: '2', typ: 'seiten' })),
			).rejects.toThrow('NEXT_NOT_FOUND');
		});

		it('still renders the last page that holds a hit', async () => {
			mockHits({ news: buildSearchHits('Bericht', 6, { kind: 'news' }), pages: [] });

			const { getByRole } = await renderPage({ q: 'Tanzen', seite: '3', typ: 'news' });

			expect(getByRole('link', { name: 'Bericht 6' })).not.toBeNull();
		});

		it('answers a page 2 with no hit at all with not found', async () => {
			mockedSearchSite.mockResolvedValue(buildSearchResult());

			await expect(
				SearchPage(routeProps({ q: 'Tanzen', seite: '2', typ: 'news' })),
			).rejects.toThrow('NEXT_NOT_FOUND');
		});
	});

	describe('without a hit', () => {
		it('shows the empty state of the editors and the popular searches', async () => {
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { getByRole, getByText } = await renderPage({ q: 'xyz' });

			expect(getByRole('heading', { level: 2, name: 'Leider nichts gefunden' })).not.toBeNull();
			expect(getByText('Versuch es mit einem kürzeren Begriff.')).not.toBeNull();
			expect(getByRole('link', { name: 'Unser Angebot' }).getAttribute('href')).toBe('/angebot');
			expect(getByRole('link', { name: 'Kontakt' }).getAttribute('href')).toBe('/kontakt');
			expect(getByRole('heading', { level: 2, name: 'Häufig gesucht' })).not.toBeNull();
		});

		it('shows no tabs when there is nothing to switch between', async () => {
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { queryByRole } = await renderPage({ q: 'xyz' });

			expect(queryByRole('navigation', { name: 'Trefferart' })).toBeNull();
		});

		it('keeps the term in the form', async () => {
			mockedSearchSite.mockResolvedValue(buildSearchResult({ query: 'xyz' }));

			const { getByRole } = await renderPage({ q: 'xyz' });

			expect((getByRole('searchbox', { name: 'Suchbegriff' }) as HTMLInputElement).value).toBe(
				'xyz',
			);
		});
	});

	describe('without a usable search term', () => {
		it('shows the popular searches as links to their search', async () => {
			const { getByRole } = await renderPage();

			expect(getByRole('heading', { level: 2, name: 'Häufig gesucht' })).not.toBeNull();
			expect(getByRole('link', { name: 'Trainingszeiten' }).getAttribute('href')).toBe(
				'/suche?q=Trainingszeiten',
			);
			expect(getByRole('link', { name: '1. Mannschaft' }).getAttribute('href')).toBe(
				'/suche?q=1.%20Mannschaft',
			);
		});

		it('shows neither the summary, the tabs nor the empty state', async () => {
			const { container, queryByRole } = await renderPage();

			expect(queryByRole('navigation', { name: 'Trefferart' })).toBeNull();
			expect(queryByRole('heading', { name: 'Leider nichts gefunden' })).toBeNull();
			expect(container.textContent).not.toContain('Treffer für');
		});

		it('hands the input to the search even when it is nothing but punctuation', async () => {
			const { getByRole } = await renderPage({ q: '--' });

			expect(mockedSearchSite).toHaveBeenCalledWith('--', expect.anything());
			expect(getByRole('heading', { name: 'Häufig gesucht' })).not.toBeNull();
		});
	});
});
