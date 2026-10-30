import type { QueryParams } from 'next-sanity';

import { client } from '@/lib/sanity/client';
import {
	SEARCH_PAGE_TYPES,
	searchCandidatesQuery,
	searchNewsCountQuery,
	searchNewsQuery,
	searchTextsQuery,
} from '@/lib/sanity/queries/search';
import type {
	SearchCandidatesQueryResult,
	SearchNewsCountQueryResult,
	SearchNewsQueryResult,
	SearchTextsQueryResult,
} from '@/types/sanity.types';

import { ALL_TAB_NEWS_HITS, ALL_TAB_PAGE_HITS, CANDIDATE_LIMIT, HITS_PER_PAGE } from './constants';
import { getSnippet } from './highlight';
import { mergePageHits, toSearchHit } from './merge';
import { getSearchWords, normalizeSearchInput, toTextQuery } from './query';
import type { SearchCandidate, SearchHit, SearchResult, SearchTab } from './types';

/**
 * How long a search result is cached, in seconds. The revalidation webhook expires it earlier: it
 * expires the tag of every document type it fires for, and the search tags its fetches with every
 * type it shows.
 */
const SEARCH_REVALIDATE_SECONDS = 3600;

/** The tags of every search fetch: the types of both groups, plus the categories in the news meta. */
const SEARCH_CACHE_TAGS: readonly string[] = [
	...SEARCH_PAGE_TYPES,
	'news.article',
	'news.category',
];

/**
 * Runs one search query. Every search fetch reads only published content, also while draft mode is
 * on, and is cached until a document of a type it shows changes.
 *
 * @param query - The GROQ query.
 * @param params - Its parameters. The search term only ever reaches GROQ as `$q`.
 * @returns The result.
 */
async function fetchSearch<R>(query: string, params: QueryParams): Promise<R> {
	return client.fetch<R>(query, params, {
		next: { revalidate: SEARCH_REVALIDATE_SECONDS, tags: [...SEARCH_CACHE_TAGS] },
		perspective: 'published',
	});
}

/**
 * The page number as an index from 0. Anything that is no whole number from 1 counts as the first
 * page, so a broken `seite` parameter never reaches GROQ.
 *
 * @param page - The page number, from 1.
 * @returns The index of the page.
 */
function getPageIndex(page = 1): number {
	return Number.isSafeInteger(page) && page > 1 ? page - 1 : 0;
}

/**
 * Which hits of both groups a call returns:
 *
 * | Call                   | Seiten                        | News                          |
 * | ---------------------- | ----------------------------- | ----------------------------- |
 * | `perGroup` (the panel) | the first `perGroup`          | the first `perGroup`          |
 * | „Alle“                 | the first `ALL_TAB_PAGE_HITS` | the first `ALL_TAB_NEWS_HITS` |
 * | „Seiten“               | page `page` of ten            | none, only the total          |
 * | „News“                 | none, only the total          | page `page` of ten            |
 *
 * @param options - The options of the call.
 * @param options.page - The page of the „Seiten“ or „News“ tab, from 1.
 * @param options.perGroup - The hits per group for the panel.
 * @param options.tab - The tab of the search page, „Alle“ when it is missing.
 * @returns The window of each group, `undefined` for a group that returns no hits.
 */
function getWindows({ page, perGroup, tab }: SearchOptions): SearchWindows {
	if (perGroup !== undefined) {
		return { news: { end: perGroup, start: 0 }, pages: { end: perGroup, start: 0 } };
	}

	const start = getPageIndex(page) * HITS_PER_PAGE;
	const paged = { end: start + HITS_PER_PAGE, start };

	if (tab === 'news') {
		return { news: paged, pages: undefined };
	}
	if (tab === 'seiten') {
		return { news: undefined, pages: paged };
	}
	return {
		news: { end: ALL_TAB_NEWS_HITS, start: 0 },
		pages: { end: ALL_TAB_PAGE_HITS, start: 0 },
	};
}

/**
 * The ids of the TSG-Echo issues search engines must not find. Their text never becomes a snippet.
 *
 * @param candidates - The candidates of the „Seiten“ group.
 * @returns The ids.
 */
function getHiddenIds(candidates: readonly SearchCandidate[]): Set<string> {
	return new Set(
		candidates
			.filter((candidate) => candidate._type === 'echo.issue' && candidate.indexable === false)
			.map((candidate) => candidate._id),
	);
}

/**
 * Cuts a snippet for every hit that has none yet, from the plain text of its document, around the
 * first match. One query fetches the texts of all of them.
 *
 * @param hits - The hits that are returned.
 * @param words - The search words.
 * @param hiddenIds - The hits that never get a snippet.
 * @returns The hits, those with text now with a snippet.
 */
async function addSnippets(
	hits: SearchHit[],
	words: string[],
	hiddenIds: ReadonlySet<string>,
): Promise<SearchHit[]> {
	const pending = new Set(
		hits.filter((hit) => hit.snippet === undefined && !hiddenIds.has(hit.id)).map((hit) => hit.id),
	);
	if (pending.size === 0) {
		return hits;
	}

	const texts = await fetchSearch<SearchTextsQueryResult>(searchTextsQuery, { ids: [...pending] });
	const snippets = new Map(
		texts.map((entry) => [entry._id, entry.text ? getSnippet(entry.text, words) : undefined]),
	);

	// Only a pending hit takes a snippet, whatever the query returns: a hidden issue never gets one.
	return hits.map((hit) => {
		const snippet = pending.has(hit.id) ? snippets.get(hit.id) : undefined;
		return snippet ? { ...hit, snippet } : hit;
	});
}

/**
 * Fetches both groups and cuts them to their windows. The candidates of the „Seiten“ group are
 * always fetched, because their total depends on the merge; the news only for a window that shows
 * them, their total through a count.
 *
 * @param q - The text query.
 * @param windows - The window of each group.
 * @returns The hits of both windows, without the snippets cut from texts, and the totals.
 */
async function fetchGroups(q: string, windows: SearchWindows): Promise<SearchGroups> {
	const [candidates, articles, newsTotal] = await Promise.all([
		fetchSearch<SearchCandidatesQueryResult>(searchCandidatesQuery, { limit: CANDIDATE_LIMIT, q }),
		windows.news
			? fetchSearch<SearchNewsQueryResult>(searchNewsQuery, { ...windows.news, q })
			: Promise.resolve([]),
		fetchSearch<SearchNewsCountQueryResult>(searchNewsCountQuery, { q }),
	]);

	const pages = mergePageHits(candidates);

	return {
		hiddenIds: getHiddenIds(candidates),
		news: articles.flatMap((article) => toSearchHit(article, article._score) ?? []),
		pages: windows.pages ? pages.slice(windows.pages.start, windows.pages.end) : [],
		totals: { news: newsTotal, pages: pages.length },
	};
}

/**
 * Searches the website: the „Seiten“ group (departments, groups, single pages, TSG-Echo issues, and
 * the pages persons and FAQs lead to) and the „News“ group.
 *
 * This is the seam the provider sits behind. The search page calls it directly, the panel through
 * `GET /api/search`.
 *
 * @param input - The search input, as the visitor typed it.
 * @param options - Which hits to return, see `getWindows`. A call with `perGroup` (the panel) gets
 * no text snippets, so it never fetches the texts.
 * @returns The hits of the requested window and the totals of both groups, or `undefined` without
 * a usable search term, in which case nothing reaches Sanity.
 */
async function searchSite(
	input: string,
	options: SearchOptions = {},
): Promise<SearchResult | undefined> {
	const query = normalizeSearchInput(input);
	const q = toTextQuery(query);
	if (q === undefined) {
		return undefined;
	}

	const words = getSearchWords(query);
	const { hiddenIds, news, pages, totals } = await fetchGroups(q, getWindows(options));
	// The panel shows one line per hit and no text snippet, so it skips the query that fetches the
	// texts. The person and FAQ lines are part of the hits already and stay.
	const hits =
		options.perGroup === undefined
			? await addSnippets([...pages, ...news], words, hiddenIds)
			: [...pages, ...news];

	return {
		news: hits.slice(pages.length),
		pages: hits.slice(0, pages.length),
		query,
		totals,
		words,
	};
}

/** Which hits a search returns. */
interface SearchOptions {
	/** The page of the „Seiten“ or „News“ tab, from 1. */
	page?: number;
	/**
	 * The hits per group for the panel. Overrides `tab` and `page`, and cuts no text snippets: only
	 * the person and FAQ lines, which the hits carry, remain.
	 */
	perGroup?: number;
	/** The tab of the search page, „Alle“ when it is missing. */
	tab?: SearchTab;
}

/** The hits of a group a search returns, `end` exclusive. */
interface SearchWindow {
	end: number;
	start: number;
}

interface SearchWindows {
	news: SearchWindow | undefined;
	pages: SearchWindow | undefined;
}

/** Both groups of a search before the snippets are cut from the texts. */
interface SearchGroups {
	/** The TSG-Echo issues that never get a snippet. */
	hiddenIds: ReadonlySet<string>;
	news: SearchHit[];
	pages: SearchHit[];
	totals: SearchResult['totals'];
}

export { searchSite };
export type { SearchOptions };
