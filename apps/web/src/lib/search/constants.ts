/** The shortest search term that is looked up. Anything below it is not worth a query. */
const SEARCH_MIN_LENGTH = 2;

/** The longest search term. Longer input is cut, so a pasted paragraph never reaches Sanity. */
const SEARCH_MAX_LENGTH = 100;

/** How long the panel waits after the last keystroke before it searches, in milliseconds. */
const SEARCH_DEBOUNCE_MS = 250;

/** The hits per group ("Seiten", "News") the panel shows. */
const PANEL_HITS_PER_GROUP = 3;

/** The page hits the "Alle" tab of the search page shows. */
const ALL_TAB_PAGE_HITS = 6;

/** The news hits the "Alle" tab of the search page shows. */
const ALL_TAB_NEWS_HITS = 3;

/** The hits per page of the "Seiten" and "News" tabs of the search page. */
const HITS_PER_PAGE = 10;

/** The length of a text snippet around the first match, without its ellipses. */
const SNIPPET_LENGTH = 160;

/** How many scored candidates the page query fetches before the hits are merged and cut. */
const CANDIDATE_LIMIT = 100;

/** The most terms "Häufig gesucht" shows. */
const POPULAR_SEARCHES_LIMIT = 8;

/**
 * What a match in a field is worth to the score. The queries add the weights of every field a
 * term hits:
 *
 * - `title` is the title of a page.
 * - `searchTerms` are the terms editors add to a department or group by hand.
 * - `lead` is the intro, the subtitle, the group description, a FAQ question and a person's name.
 * - `body` is everything else, including a person's role and task description.
 */
const WEIGHTS = { body: 1, lead: 3, searchTerms: 8, title: 10 } as const;

export {
	ALL_TAB_NEWS_HITS,
	ALL_TAB_PAGE_HITS,
	CANDIDATE_LIMIT,
	HITS_PER_PAGE,
	PANEL_HITS_PER_GROUP,
	POPULAR_SEARCHES_LIMIT,
	SEARCH_DEBOUNCE_MS,
	SEARCH_MAX_LENGTH,
	SEARCH_MIN_LENGTH,
	SNIPPET_LENGTH,
	WEIGHTS,
};
