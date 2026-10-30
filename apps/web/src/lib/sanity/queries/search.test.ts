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
 * @returns Every `boost(<lhs> match text::query($q), <weight>)` term, with the guard of a term
 * written as `boost(<guard>, 0) && boost(…)` (an empty string for a term without a guard)
 */
function getScoreTerms(query: string): ScoreTerm[] {
	const term =
		/(?:boost\((?<guard>(?:[^()]|\([^()]*\))*?), 0\) && )?boost\((?<lhs>(?:(?!boost\()[\s\S])*?) match text::query\(\$q\), (?<weight>\d+)\)/gu;

	return [...query.matchAll(term)].map((match) => ({
		guard: match.groups?.guard ?? '',
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

/** A score term on the text of a TSG-Echo issue, behind the `indexable` guard. */
const GUARDED_ECHO_MATCH = /boost\(indexable != false, 0\) && boost\(extractedText match /gu;

/** The text of a TSG-Echo issue as the value of a `select()` that gives it for indexable issues. */
const GUARDED_ECHO_SELECT = /select\(\s*indexable != false\s*=>\s*extractedText\s*\)/gu;

/**
 * Finds every place a query reads the text of a TSG-Echo issue without the `indexable` guard. The
 * only two forms that read it are a guarded score term and a guarded `select()`.
 *
 * @param query - The GROQ query
 * @returns A few characters around each occurrence of `extractedText` that is neither, so a failing
 * test shows where it sits
 */
function getUnguardedEchoText(query: string): string[] {
	const withoutGuardedForms = query
		.replaceAll(GUARDED_ECHO_MATCH, '')
		.replaceAll(GUARDED_ECHO_SELECT, '');

	return [...withoutGuardedForms.matchAll(/.{0,40}extractedText.{0,40}/gu)].map(([context]) =>
		context.trim(),
	);
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
				`boost(indexable != false, 0) && boost(extractedText match text::query($q), ${WEIGHTS.body})`,
			);
		});

		// Every occurrence, not just the plain `extractedText match`: a `[subtitle, extractedText] match`
		// or a projection of the text would leak it just the same.
		it.each(ALL_QUERIES)('is never read without the guard in %s', (_label, query) => {
			expect(getUnguardedEchoText(query)).toStrictEqual([]);
		});

		it('accepts the two guarded forms', () => {
			expect(
				getUnguardedEchoText(
					'boost(indexable != false, 0) && boost(extractedText match text::query($q), 1)',
				),
			).toStrictEqual([]);
			expect(getUnguardedEchoText('select(indexable != false => extractedText)')).toStrictEqual([]);
		});

		it.each([
			['an array of fields', 'boost([subtitle, extractedText] match text::query($q), 1)'],
			['a projection', '"text": extractedText'],
			['a term without the guard', 'boost(extractedText match text::query($q), 1)'],
			['a select on another condition', 'select(indexable == true => extractedText)'],
		])('is spotted in %s', (_label, query) => {
			expect(getUnguardedEchoText(query)).toHaveLength(1);
		});

		// A snippet would show the text of a non-indexable issue just as a hit would.
		it('is only read for a snippet when the issue is indexable', () => {
			const reads = countOccurrences(searchTextsQuery, 'extractedText');
			const guarded = searchTextsQuery.match(GUARDED_ECHO_SELECT);

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
			]);
			expect(searchCandidatesQuery).toContain(
				`_type in [${SEARCH_PAGE_TYPES.map((type) => `'${type}'`).join(', ')}]`,
			);
		});

		// Nobody searches for them, and their long texts would turn up for almost any word.
		it.each(['imprint', 'privacy', 'accessibility'])('leave out the legal page %s', (type) => {
			expect(searchCandidatesQuery).not.toContain(`'${type}'`);
			expect(searchTextsQuery).not.toContain(`'${type}'`);
		});

		// A pending or failed issue has no page of its own, or shows the pages of the previous PDF.
		it('only find finished tsg-echo issues', () => {
			expect(searchCandidatesQuery).toContain(`(_type != 'echo.issue' || (${finishedEchoIssue}))`);
		});

		it.each([
			{ guard: '', lhs: 'title', weight: WEIGHTS.title },
			{ guard: '', lhs: 'searchTerms[]', weight: WEIGHTS.searchTerms },
			{ guard: "_type in ['department', 'home']", lhs: 'intro', weight: WEIGHTS.lead },
			{ guard: '', lhs: 'question', weight: WEIGHTS.lead },
			{ guard: '', lhs: '[firstName, lastName]', weight: WEIGHTS.lead },
			{ guard: '', lhs: 'affiliations[].taskDescription', weight: WEIGHTS.body },
			{ guard: 'indexable != false', lhs: 'extractedText', weight: WEIGHTS.body },
		])('weigh $lhs with $weight', (term) => {
			expect(getScoreTerms(searchCandidatesQuery)).toContainEqual(term);
		});

		// Content Lake adds the score of every other true predicate inside a term, so a guard joined
		// to the match by `&&` would count once more. A guard of its own, boosted by 0, adds nothing.
		it('never let a guard add to the score', () => {
			expect(
				getScoreTerms(searchCandidatesQuery).filter(({ lhs }) => /&&|==|!=/u.test(lhs)),
			).toStrictEqual([]);
			expect(countOccurrences(searchCandidatesQuery, ' && boost(')).toBe(
				countOccurrences(searchCandidatesQuery, ', 0) && boost('),
			);
		});

		// `score()` rejects `role->title`, so a role counts through the roles that reference it.
		it('weigh a matching role like the text', () => {
			expect(searchCandidatesQuery).toContain(
				`boost(references(*[_type == 'role' && title match text::query($q)]._id), ${WEIGHTS.body})`,
			);
		});

		// A portable text object as a whole would be matched down to its `_type` and `style` values.
		it('only match a bare intro where it is plain text', () => {
			const guard = "_type in ['department', 'home']";

			const inArrays = getScoreTerms(searchCandidatesQuery).filter(({ lhs }) =>
				/[\s,[]intro\s*[,\]]/u.test(lhs),
			);

			expect(countOccurrences(searchCandidatesQuery, 'intro match')).toBe(
				countOccurrences(searchCandidatesQuery, `boost(${guard}, 0) && boost(intro match`),
			);
			expect(inArrays).not.toHaveLength(0);
			expect(inArrays.filter((term) => term.guard !== guard)).toStrictEqual([]);
		});

		// `text::query()` wants every word in the one field it is matched against, so a page whose
		// words sit in different fields would not be found by any single field.
		it('score words that sit in different fields of one page', () => {
			const catchAll = getCatchAllTerms(searchCandidatesQuery);

			expect(catchAll.map(({ guard }) => guard)).toStrictEqual([
				"_type in ['department', 'home']",
				"!(_type in ['department', 'home', 'echo.issue'])",
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

			expect(terms).toContainEqual({ guard: '', lhs: 'title', weight: WEIGHTS.title });
			expect(terms).toContainEqual({
				guard: '',
				lhs: 'body[].text[].children[].text',
				weight: WEIGHTS.body,
			});
		});

		it('score words that sit in the title and the text of one article', () => {
			expect(getCatchAllTerms(searchNewsQuery)).toStrictEqual([
				{ guard: '', lhs: '[title, body[].text[].children[].text]', weight: WEIGHTS.body },
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
	guard: string;
	lhs: string;
	weight: number;
}
