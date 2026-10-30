import type { SearchHit, SearchResult } from '@/lib/search/types';

/**
 * A page hit, a group called „Tanzen“ unless the caller says otherwise.
 *
 * @param overrides - The fields that differ.
 * @returns The hit, without a thumbnail so the logo placeholder stands in.
 */
function buildSearchHit(overrides: Partial<SearchHit> = {}): SearchHit {
	return {
		href: '/angebot/tanzen',
		id: 'group-tanzen',
		kind: 'group',
		meta: 'Gruppe · Breitensport',
		score: 10,
		thumbnail: null,
		title: 'Tanzen',
		...overrides,
	};
}

/**
 * Numbered hits, so a list of them keeps its order and each has a title of its own.
 *
 * @param title - The title before the number.
 * @param count - How many hits to create.
 * @param overrides - The fields every hit shares.
 * @returns `{title} 1` to `{title} {count}`, each linking to its own path.
 */
function buildSearchHits(
	title: string,
	count: number,
	overrides: Partial<SearchHit> = {},
): SearchHit[] {
	return Array.from({ length: count }, (_, index) =>
		buildSearchHit({
			href: `/${title.toLowerCase()}/${index + 1}`,
			id: `${title}-${index + 1}`,
			title: `${title} ${index + 1}`,
			...overrides,
		}),
	);
}

/**
 * The result of a search for „Tanzen“ without any hit, unless the caller says otherwise.
 *
 * @param overrides - The fields that differ.
 * @returns The result.
 */
function buildSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
	return {
		news: [],
		pages: [],
		query: 'Tanzen',
		totals: { news: 0, pages: 0 },
		words: ['tanzen'],
		...overrides,
	};
}

export { buildSearchHit, buildSearchHits, buildSearchResult };
