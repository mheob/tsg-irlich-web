import { SEARCH_PAGE_TYPES } from '@/lib/sanity/queries/search';
import { getInternalHref } from '@/utils/links';
import { getLocaleDate } from '@/utils/time';

import { WEIGHTS } from './constants';
import { getSearchThumbnail } from './thumbnail';
import type { SearchCandidate, SearchHit, SearchHitKind } from './types';

/** The search types without a page of their own. They lead to the pages that show them. */
const TYPES_WITHOUT_PAGE = new Set<string>(['faq', 'person']);

/**
 * The types a hit may link to: every page type of the search plus the news article.
 *
 * `getInternalHref` links any type it has no rule for to `/<slug>`, which is a wrong link for a
 * type that has no such page. Before the WEB-384 migration, persons still belong to documents of
 * the old `group.*` types, so a target's type is checked before it is linked.
 */
const LINKED_TYPES = new Set<string>([
	...SEARCH_PAGE_TYPES.filter((type) => !TYPES_WITHOUT_PAGE.has(type)),
	'news.article',
]);

/** The types with a meta line of their own. Every other linked type is a single page. */
const HIT_KINDS = new Map<string, SearchHitKind>([
	['department', 'department'],
	['echo.issue', 'echo'],
	['group', 'group'],
	['news.article', 'news'],
]);

/** The type of the only page a person's affiliation leads to. */
const GROUP_TYPE = 'group';

/** Separates the parts of a meta line. */
const META_SEPARATOR = ' · ';

/**
 * Trims a text that may be missing, whatever its generated type promises.
 *
 * @param text - The text.
 * @returns The trimmed text, an empty string when it is missing.
 */
function clean(text: string | null | undefined): string {
	return text?.trim() ?? '';
}

/**
 * Joins the parts of a meta line, leaving out the missing ones.
 *
 * @param parts - The parts in order.
 * @returns The meta line.
 */
function joinMeta(parts: (string | null | undefined)[]): string {
	return parts.filter(Boolean).join(META_SEPARATOR);
}

/**
 * The line under the title that says what a hit is, per kind: „Abteilung“, „Gruppe · {Abteilung}“,
 * „TSG-Echo“, „{TT.MM.JJJJ} · {Kategorie}“ (dated like the news previews) or „Seite“.
 */
const META_LINES: Record<SearchHitKind, (target: SearchTarget) => string> = {
	department: () => 'Abteilung',
	echo: () => 'TSG-Echo',
	group: (target) => joinMeta(['Gruppe', target.department?.title]),
	news: (target) =>
		joinMeta([
			target.publishedAt ? getLocaleDate(target.publishedAt, 'short') : undefined,
			target.category?.title,
		]),
	page: () => 'Seite',
};

/**
 * Turns a document the search found, or a page a person or a FAQ leads to, into a hit.
 *
 * @param target - The document, as the search queries project it.
 * @param score - What the hit is worth.
 * @param snippet - The text under the title, when the source brings its own.
 * @returns The hit, or `undefined` when the document has no page on the website: a type without a
 * page, a group without a department slug, an article without a category.
 */
function toSearchHit(target: SearchTarget, score: number, snippet?: string): SearchHit | undefined {
	if (!LINKED_TYPES.has(target._type)) {
		return undefined;
	}

	const href = getInternalHref({
		_type: target._type,
		category: target.category?.slug,
		department: target.department?.slug,
		slug: target.slug,
	});
	if (!href) {
		return undefined;
	}

	const kind = HIT_KINDS.get(target._type) ?? 'page';

	return {
		href,
		id: target._id,
		kind,
		meta: META_LINES[kind](target),
		score,
		...(snippet ? { snippet } : {}),
		thumbnail: getSearchThumbnail(target.image, kind, target.indexable),
		title: target.title,
	};
}

/**
 * The targets of a list that exist. A reference to a document that is gone or unpublished
 * dereferences to `null`, whatever the generated type promises.
 *
 * @param targets - The dereferenced targets, or nothing at all.
 * @returns The targets that exist.
 */
function existing<T extends SearchTarget>(targets: readonly (T | null)[] | null | undefined): T[] {
	return (targets ?? []).filter((target): target is T => target !== null);
}

/**
 * Whether a person's team is a group of today's schema. Before the WEB-384 migration, a team can
 * be a document of the old `group.*` types.
 *
 * @param team - The dereferenced team.
 * @returns Whether it is a `group`.
 */
function isGroup(team: SearchTarget | null): team is SearchTarget {
	return team?._type === GROUP_TYPE;
}

/**
 * The person line a page shows: the name and the role of the affiliation the page shows.
 *
 * @param person - The person.
 * @param role - The title of the role, `null` for a dangling or unpublished role reference.
 * @returns „Ansprechperson: {Vorname Nachname}, {Rolle}“, without the role when it is missing.
 */
function getPersonLine(person: PersonCandidate, role: string | null): string {
	const name = [clean(person.firstName), clean(person.lastName)].filter(Boolean).join(' ');
	const shownRole = clean(role);

	return shownRole ? `Ansprechperson: ${name}, ${shownRole}` : `Ansprechperson: ${name}`;
}

/**
 * The pages a person leads to.
 *
 * - A match in the name counts on every page that lists the person and on the group of every
 *   affiliation, with the weight of a lead field.
 * - A match in the role or task of an affiliation counts only where a page shows that affiliation:
 *   on the group of the affiliation, and on the pages that list the person only for the first one,
 *   which is the one they show. Its weight is that of a body field.
 *
 * A person the catch-all term found across name and task matches neither and leads nowhere.
 *
 * @param person - The person.
 * @returns The hits, `undefined` for a page that has no address.
 */
function getPersonHits(person: PersonCandidate): (SearchHit | undefined)[] {
	const affiliations = person.affiliations ?? [];
	const nameScore = person.nameMatches ? WEIGHTS.lead : 0;
	const getScore = (affiliation?: Affiliation): number =>
		nameScore + (affiliation?.roleMatches ? WEIGHTS.body : 0);

	const first = affiliations.at(0);
	const listedScore = getScore(first);
	const listedLine = getPersonLine(person, first?.role ?? null);
	const listed =
		listedScore > 0
			? existing(person.listedOn).map((page) => toSearchHit(page, listedScore, listedLine))
			: [];

	const teams = affiliations.map((affiliation) => {
		const score = getScore(affiliation);
		return score > 0 && isGroup(affiliation.team)
			? toSearchHit(affiliation.team, score, getPersonLine(person, affiliation.role))
			: undefined;
	});

	return [...listed, ...teams];
}

/**
 * The departments a FAQ leads to, with the question as their snippet.
 *
 * @param faq - The FAQ.
 * @returns The hits, `undefined` for a department that has no address.
 */
function getFaqHits(faq: FaqCandidate): (SearchHit | undefined)[] {
	const question = clean(faq.question);
	const snippet = question ? `Frage: ${question}` : undefined;

	return existing(faq.targets).map((department) => toSearchHit(department, faq._score, snippet));
}

/**
 * The hits a candidate gives: a FAQ or a person its pages, any other candidate itself.
 *
 * @param candidate - The candidate.
 * @returns The hits, `undefined` for a page that has no address.
 */
function getCandidateHits(candidate: SearchCandidate): (SearchHit | undefined)[] {
	if (candidate._type === 'faq') {
		return getFaqHits(candidate);
	}
	if (candidate._type === 'person') {
		return getPersonHits(candidate);
	}
	return [toSearchHit(candidate, candidate._score)];
}

/**
 * Orders hits best first, and hits of the same score by their title.
 *
 * @param first - One hit.
 * @param second - The other hit.
 * @returns The order of the two.
 */
function compareHits(first: SearchHit, second: SearchHit): number {
	return second.score - first.score || first.title.localeCompare(second.title, 'de');
}

/**
 * Turns the candidates of the „Seiten“ group into its hits.
 *
 * - A FAQ becomes the departments that show it, a person the pages that show them.
 * - A page found more than once, through its own content or through several persons or FAQs, is
 *   listed once, with its highest score and the snippet of the source that gave it.
 * - A page without an address is left out.
 *
 * @param candidates - The candidates as `searchCandidatesQuery` returns them.
 * @returns The hits, best first, hits of the same score by title.
 */
function mergePageHits(candidates: readonly SearchCandidate[]): SearchHit[] {
	const best = new Map<string, SearchHit>();

	for (const hit of candidates.flatMap((candidate) => getCandidateHits(candidate))) {
		const current = hit && best.get(hit.id);
		if (hit && (!current || hit.score > current.score)) {
			best.set(hit.id, hit);
		}
	}

	return [...best.values()].toSorted(compareHits);
}

type FaqCandidate = Extract<SearchCandidate, { _type: 'faq' }>;
type PersonCandidate = Extract<SearchCandidate, { _type: 'person' }>;
type Affiliation = NonNullable<PersonCandidate['affiliations']>[number];

/** The department of a group or the category of an article, as the search queries project it. */
interface TargetReference {
	slug?: string | null;
	title?: string | null;
}

/**
 * A document a hit links to, as the search queries project it. The references are optional,
 * because before the WEB-384 migration a group's `department` is a string and dereferences to
 * `null`, whatever the generated type promises.
 */
interface SearchTarget {
	_id: string;
	_type: string;
	category?: TargetReference | null;
	department?: TargetReference | null;
	image?: Exclude<Parameters<typeof getSearchThumbnail>[0], undefined>;
	indexable?: boolean | null;
	publishedAt?: string | null;
	slug?: string | null;
	title: string;
}

export { mergePageHits, toSearchHit };
