import { client } from '@/lib/sanity/client';
import { searchPopularSettingsQuery } from '@/lib/sanity/queries/search';
import type { SearchPopularSettingsQueryResult } from '@/types/sanity.types';

import { POPULAR_SEARCHES_LIMIT } from './constants';

/** The heading of „Häufig gesucht“ while the singleton is missing or the editors left it empty. */
const POPULAR_FALLBACK_TITLE = 'Häufig gesucht';

/**
 * How long the settings are cached, in seconds. The revalidation webhook expires them earlier: it
 * expires the tag of the document type it fires for, which for the singleton is `searchPage`.
 */
const POPULAR_REVALIDATE_SECONDS = 3600;

/** The terms below „Häufig gesucht“ and their heading. */
interface PopularSearches {
	terms: string[];
	title: string;
}

/**
 * The key two spellings of a term share: surrounding whitespace and case do not tell terms apart.
 *
 * @param term - The term.
 * @returns The key.
 */
function toKey(term: string): string {
	return term.trim().toLowerCase();
}

/**
 * The terms of „Häufig gesucht“. For now these are only the terms the editors pin: trimmed, without
 * the empty ones and the ones they block, once per term whatever its spelling (the first spelling
 * wins), and at most `POPULAR_SEARCHES_LIMIT`. A blocked or repeated term takes no place of the
 * limit.
 *
 * @param settings - The popular searches of the singleton.
 * @returns The terms, in the order the editors pinned them.
 */
function getTerms(settings: SearchPopularSettingsQueryResult): string[] {
	const blocked = new Set((settings?.blockedTerms ?? []).map((term) => toKey(term)));
	const terms = new Map<string, string>();

	for (const pinned of settings?.pinnedTerms ?? []) {
		const term = pinned.trim();
		const key = toKey(term);
		if (term !== '' && !blocked.has(key) && !terms.has(key)) {
			terms.set(key, term);
		}
	}

	return [...terms.values()].slice(0, POPULAR_SEARCHES_LIMIT);
}

/**
 * The heading of „Häufig gesucht“.
 *
 * @param settings - The popular searches of the singleton.
 * @returns The heading of the singleton, or the fallback while it is missing, empty or only
 * whitespace.
 */
function getTitle(settings: SearchPopularSettingsQueryResult): string {
	const title = settings?.title?.trim();
	return title === undefined || title === '' ? POPULAR_FALLBACK_TITLE : title;
}

/**
 * Reads „Häufig gesucht“: the heading and the terms the panel and the search page show without a
 * search term. The singleton is read as published, also while draft mode is on, like every search
 * fetch.
 *
 * @returns The heading, „Häufig gesucht“ while the singleton has none, and the terms, none while
 * it is missing.
 */
async function getPopularSearches(): Promise<PopularSearches> {
	const settings = await client.fetch<SearchPopularSettingsQueryResult>(
		searchPopularSettingsQuery,
		{},
		{
			next: { revalidate: POPULAR_REVALIDATE_SECONDS, tags: ['searchPage'] },
			perspective: 'published',
		},
	);

	return {
		terms: getTerms(settings),
		title: getTitle(settings),
	};
}

export { getPopularSearches };
export type { PopularSearches };
