import type { SearchCandidatesQueryResult } from '@/types/sanity.types';

/**
 * What a hit is, which decides its meta line. Everything that is no department, group, TSG-Echo
 * issue or news article is a single page.
 */
type SearchHitKind = 'department' | 'echo' | 'group' | 'news' | 'page';

/** The image in front of a hit. */
interface SearchThumbnail {
	src: string;
	/**
	 * Whether the image must bypass the Next.js image optimizer. The cover of a TSG-Echo issue that
	 * search engines must not find is served through the archive path, which the optimizer would
	 * deliver without its `noindex` header.
	 */
	unoptimized: boolean;
}

/** One hit, in the „Seiten“ group or in the „News“ group. */
interface SearchHit {
	href: string;
	id: string;
	kind: SearchHitKind;
	meta: string;
	score: number;
	snippet?: string;
	thumbnail: SearchThumbnail | null;
	title: string;
}

/** The tab of the search page: „Alle“, „Seiten“ or „News“. */
type SearchTab = 'alle' | 'news' | 'seiten';

/** What a search returns: the hits of the requested window and the totals of both groups. */
interface SearchResult {
	news: SearchHit[];
	pages: SearchHit[];
	/** The search term as the search read it: trimmed, collapsed and cut to the maximum length. */
	query: string;
	totals: { news: number; pages: number };
	/** The search words, for the highlighting. */
	words: string[];
}

/** One scored candidate of the „Seiten“ group, before persons and FAQs are merged into their pages. */
type SearchCandidate = NonNullable<SearchCandidatesQueryResult>[number];

export type { SearchCandidate, SearchHit, SearchHitKind, SearchResult, SearchTab, SearchThumbnail };
