import { describe, expect, it } from 'vite-plus/test';

import { finishedEchoIssue } from '@/lib/sanity/queries';
import { WEIGHTS } from '@/lib/search/constants';

import {
	SEARCH_PAGE_TYPES,
	searchCandidatesQuery,
	searchNewsCountQuery,
	searchNewsQuery,
	searchPageQuery,
	searchPlaceholderQuery,
	searchPopularSettingsQuery,
	searchTextsQuery,
} from './search';

/** The queries the search term reaches. */
const TERM_QUERIES = [
	['the candidates', searchCandidatesQuery],
	['the news', searchNewsQuery],
	['the news count', searchNewsCountQuery],
] as const;

const ALL_QUERIES = [
	...TERM_QUERIES,
	['the texts', searchTextsQuery],
	['the page', searchPageQuery],
	['the placeholder', searchPlaceholderQuery],
	['the popular settings', searchPopularSettingsQuery],
] as const;

/**
 * Reads the score terms of a query.
 *
 * @param query - The GROQ query
 * @returns Every `boost(<lhs> match text::query($q), <weight>)` term, split into both parts
 */
function getScoreTerms(query: string): ScoreTerm[] {
	const term =
		/boost\((?<lhs>(?:(?!boost\()[\s\S])*?) match text::query\(\$q\), (?<weight>\d+)\)/gu;

	return [...query.matchAll(term)].map((match) => ({
		lhs: match.groups?.lhs ?? '',
		weight: Number(match.groups?.weight),
	}));
}

/**
 * Reads the score terms of a query that match several fields at once.
 *
 * @param query - The GROQ query
 * @returns The terms that match an array of fields starting with the title
 */
function getCatchAllTerms(query: string): ScoreTerm[] {
	return getScoreTerms(query).filter(({ lhs }) => /\[\s*title,/u.test(lhs));
}

/**
 * Counts how often a string occurs in a text.
 *
 * @param text - The text to search
 * @param search - The string to count
 * @returns The number of occurrences
 */
function countOccurrences(text: string, search: string): number {
	return text.split(search).length - 1;
}

describe('search queries', () => {
	describe('the text of a tsg-echo issue', () => {
		// Review focus 3: the text of a non-indexable issue must never make it a hit.
		it('only scores when the issue is indexable', () => {
			expect(searchCandidatesQuery).toContain(
				'indexable != false && extractedText match text::query($q)',
			);
		});

		it.each(ALL_QUERIES)('is never matched without the guard in %s', (_label, query) => {
			expect(countOccurrences(query, 'extractedText match')).toBe(
				countOccurrences(query, 'indexable != false && extractedText match'),
			);
		});

		// A snippet would show the text of a non-indexable issue just as a hit would.
		it('is only read for a snippet when the issue is indexable', () => {
			const reads = countOccurrences(searchTextsQuery, 'extractedText');
			const guarded = searchTextsQuery.match(
				/select\(\s*indexable != false\s*=>\s*extractedText\s*\)/gu,
			);

			expect(reads).toBeGreaterThan(0);
			expect(guarded).toHaveLength(reads);
		});
	});

	describe('the search term', () => {
		it.each(TERM_QUERIES)('reaches %s only as the parameter $q', (_label, query) => {
			expect(query).toContain('text::query($q)');
			expect(countOccurrences(query, ' match ')).toBe(
				countOccurrences(query, ' match text::query($q)'),
			);
		});
	});

	it.each(ALL_QUERIES)('leaves no interpolation unresolved in %s', (_label, query) => {
		expect(query).not.toContain('${');
		expect(query).not.toContain('undefined');
	});

	describe('the candidates', () => {
		it('search the pages of the „Seiten“ group', () => {
			expect(SEARCH_PAGE_TYPES).toStrictEqual([
				'department',
				'group',
				'echo.issue',
				'faq',
				'person',
				'home',
				'aboutUs',
				'departmentsPage',
				'membership',
				'contact',
				'newsOverview',
				'echoOverview',
				'imprint',
				'privacy',
				'accessibility',
			]);
			expect(searchCandidatesQuery).toContain(
				`_type in [${SEARCH_PAGE_TYPES.map((type) => `'${type}'`).join(', ')}]`,
			);
		});

		// A pending or failed issue has no page of its own, or shows the pages of the previous PDF.
		it('only find finished tsg-echo issues', () => {
			expect(searchCandidatesQuery).toContain(`(_type != 'echo.issue' || (${finishedEchoIssue}))`);
		});

		it.each([
			['title', WEIGHTS.title],
			['searchTerms[]', WEIGHTS.searchTerms],
			['question', WEIGHTS.lead],
			['[firstName, lastName]', WEIGHTS.lead],
			['affiliations[].taskDescription', WEIGHTS.body],
			['indexable != false && extractedText', WEIGHTS.body],
		])('weigh %s with %i', (lhs, weight) => {
			expect(getScoreTerms(searchCandidatesQuery)).toContainEqual({ lhs, weight });
		});

		// `score()` rejects `role->title`, so a role counts through the roles that reference it.
		it('weigh a matching role like the text', () => {
			expect(searchCandidatesQuery).toContain(
				`boost(references(*[_type == 'role' && title match text::query($q)]._id), ${WEIGHTS.body})`,
			);
		});

		// A portable text object as a whole would be matched down to its `_type` and `style` values.
		it('only match a bare intro where it is plain text', () => {
			const guard = "_type in ['department', 'home'] && ";

			const inArrays = getScoreTerms(searchCandidatesQuery).filter(({ lhs }) =>
				/[\s,[]intro\s*[,\]]/u.test(lhs),
			);

			expect(countOccurrences(searchCandidatesQuery, 'intro match')).toBe(
				countOccurrences(searchCandidatesQuery, `${guard}intro match`),
			);
			expect(inArrays).not.toHaveLength(0);
			expect(inArrays.filter(({ lhs }) => !lhs.startsWith(guard))).toStrictEqual([]);
		});

		// `text::query()` wants every word in the one field it is matched against, so a page whose
		// words sit in different fields would not be found by any single field.
		it('score words that sit in different fields of one page', () => {
			const catchAll = getCatchAllTerms(searchCandidatesQuery);

			expect(catchAll.map(({ lhs }) => lhs.slice(0, lhs.search(/\[\s*title,/u)))).toStrictEqual([
				"_type in ['department', 'home'] && ",
				"!(_type in ['department', 'home', 'echo.issue']) && ",
			]);
			for (const { weight } of catchAll) {
				expect(weight).toBe(WEIGHTS.body);
			}
			const paths = catchAll.map(({ lhs }) => lhs).join('\n');
			for (const path of [
				'title',
				'searchTerms[]',
				'subtitle',
				'intro',
				'intro.text[].children[].text',
				'description.text[].children[].text',
				'answer[].children[].text',
				'training.trainingDescription.text[].children[].text',
				'content.text[].children[].text',
				'firstName',
				'affiliations[].taskDescription',
			]) {
				expect(paths).toContain(path);
			}
		});

		// Review focus 3: the catch-all terms must not let the text of a non-indexable issue in.
		it('never put the text of a tsg-echo issue into a catch-all term', () => {
			for (const { lhs } of getCatchAllTerms(searchCandidatesQuery)) {
				expect(lhs).not.toContain('extractedText');
			}
		});

		// TypeGen types `_score` as `null` and would type the result of `[_score > 0]` as empty.
		it('keep only scored candidates, best first, up to the limit', () => {
			expect(searchCandidatesQuery).toMatch(
				/\| order\(_score desc\)\s*\[_score != 0\]\s*\[0\.\.\.\$limit\]/u,
			);
			expect(searchCandidatesQuery).toContain('"_score": math::sum([_score])');
		});
	});

	describe('the news', () => {
		it('weigh a title hit above a text hit', () => {
			const terms = getScoreTerms(searchNewsQuery);

			expect(terms).toContainEqual({ lhs: 'title', weight: WEIGHTS.title });
			expect(terms).toContainEqual({ lhs: 'body[].text[].children[].text', weight: WEIGHTS.body });
		});

		it('score words that sit in the title and the text of one article', () => {
			expect(getCatchAllTerms(searchNewsQuery)).toStrictEqual([
				{ lhs: '[title, body[].text[].children[].text]', weight: WEIGHTS.body },
			]);
		});

		it('put the newer article first when two score the same', () => {
			expect(searchNewsQuery).toMatch(
				/\| order\(_score desc, publishedAt desc\)\s*\[\$start\.\.\.\$end\]/u,
			);
		});

		it('count the articles the list pages through', () => {
			const filter = /^count\((?<filter>\*\[[\s\S]*\])\)$/u.exec(searchNewsCountQuery.trim())
				?.groups?.filter;

			expect(filter).toBeDefined();
			expect(searchNewsQuery).toContain(filter);
		});
	});
});

interface ScoreTerm {
	lhs: string;
	weight: number;
}
