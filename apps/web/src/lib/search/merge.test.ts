import { describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';

import { mergePageHits, toSearchHit } from './merge';
import { getSearchThumbnail } from './thumbnail';
import type { SearchCandidate } from './types';

// `@sanity/image-url` reads the project and the dataset from the client's config to build a URL.
vi.mock(import('@/lib/sanity/client'), () => ({
	client: {
		config: () => ({ dataset: 'test-dataset', projectId: 'test-project' }),
	} as unknown as typeof client,
}));

type Candidate<T extends SearchCandidate['_type']> = Extract<SearchCandidate, { _type: T }>;
type PersonCandidate = Candidate<'person'>;
type Affiliation = NonNullable<PersonCandidate['affiliations']>[number];
type Team = NonNullable<Affiliation['team']>;
type ListedPage = PersonCandidate['listedOn'][number];

/** The fields every projected target carries, empty. */
const NO_EXTRAS = { category: null, image: null, indexable: null, publishedAt: null };

const TANZEN = {
	...NO_EXTRAS,
	_id: 'department-tanzen',
	_type: 'department' as const,
	department: null,
	image: {
		_type: 'extendedImage' as const,
		alt: 'Tanzen',
		asset: { _ref: 'image-tanzen-1600x900-jpg', _type: 'reference' as const },
	},
	slug: 'tanzen',
	title: 'Tanzen',
};

const DIAMONDS: Team = {
	...NO_EXTRAS,
	_id: 'group-diamonds',
	_type: 'group',
	department: { slug: 'tanzen', title: 'Tanzen' },
	slug: 'funky-diamonds',
	title: 'Funky Diamonds',
};

const ZUMBA: Team = {
	...NO_EXTRAS,
	_id: 'group-zumba',
	_type: 'group',
	department: { slug: 'tanzen', title: 'Tanzen' },
	slug: 'zumba',
	title: 'Zumba',
};

// A page whose hero image is still missing, which the generated type does not allow for.
const CONTACT = {
	...NO_EXTRAS,
	_id: 'contact',
	_type: 'contact',
	department: null,
	slug: 'kontakt',
	title: 'Kontakt',
} as unknown as ListedPage;

const HOME: ListedPage = {
	...NO_EXTRAS,
	_id: 'home',
	_type: 'home',
	department: null,
	slug: 'home',
	title: 'Startseite',
};

function page(target: ListedPage | Team | typeof TANZEN, score: number): SearchCandidate {
	return { ...target, _score: score } as SearchCandidate;
}

function person(overrides: Partial<PersonCandidate> = {}): PersonCandidate {
	return {
		...NO_EXTRAS,
		_id: 'person-alina',
		_score: 4,
		_type: 'person',
		affiliations: [{ role: 'Übungsleiterin', roleMatches: false, team: DIAMONDS }],
		department: null,
		firstName: 'Alina',
		lastName: 'Kaap',
		listedOn: [CONTACT],
		nameMatches: true,
		slug: null,
		title: null,
		...overrides,
	};
}

function faq(overrides: Partial<Candidate<'faq'>> = {}): Candidate<'faq'> {
	return {
		...NO_EXTRAS,
		_id: 'faq-training',
		_score: 4,
		_type: 'faq',
		department: null,
		question: 'Wann ist Training?',
		slug: null,
		targets: [TANZEN],
		title: null,
		...overrides,
	};
}

describe(mergePageHits, () => {
	it('lists a page that persons lead to once, with the score of its own title hit', () => {
		const hits = mergePageHits([
			page(DIAMONDS, 10),
			person({ listedOn: [] }),
			person({ _id: 'person-meike', firstName: 'Meike', lastName: 'Muster', listedOn: [] }),
		]);

		expect(hits).toHaveLength(1);
		expect(hits[0]).toMatchObject({ id: 'group-diamonds', score: 10 });
		expect(hits[0].snippet).toBeUndefined();
	});

	it('leads a name match to every page that lists the person, with the role that page shows', () => {
		const hits = mergePageHits([person()]);

		expect(hits.find((hit) => hit.id === 'contact')).toStrictEqual({
			href: '/kontakt',
			id: 'contact',
			kind: 'page',
			meta: 'Seite',
			score: 3,
			snippet: 'Ansprechperson: Alina Kaap, Übungsleiterin',
			thumbnail: null,
			title: 'Kontakt',
		});
	});

	it('leads a name match to the group of every affiliation, with the role of that affiliation', () => {
		const hits = mergePageHits([
			person({
				affiliations: [
					{ role: 'Abteilungsleiterin', roleMatches: false, team: DIAMONDS },
					{ role: 'Trainerin', roleMatches: false, team: ZUMBA },
				],
				listedOn: [],
			}),
		]);

		expect(hits.map((hit) => [hit.href, hit.meta, hit.snippet])).toStrictEqual([
			[
				'/angebot/tanzen/funky-diamonds',
				'Gruppe · Tanzen',
				'Ansprechperson: Alina Kaap, Abteilungsleiterin',
			],
			['/angebot/tanzen/zumba', 'Gruppe · Tanzen', 'Ansprechperson: Alina Kaap, Trainerin'],
		]);
	});

	// A general word like „Trainerin“ must not pull up every page where some trainer is listed.
	it('leads a role match on a later affiliation to its group only, not to the listing pages', () => {
		const hits = mergePageHits([
			person({
				affiliations: [
					{ role: 'Abteilungsleiterin', roleMatches: false, team: DIAMONDS },
					{ role: 'Übungsleiterin', roleMatches: true, team: ZUMBA },
				],
				nameMatches: false,
			}),
		]);

		expect(hits.map((hit) => [hit.id, hit.score, hit.snippet])).toStrictEqual([
			['group-zumba', 1, 'Ansprechperson: Alina Kaap, Übungsleiterin'],
		]);
	});

	it('leads a role match on the first affiliation to its group and the listing pages', () => {
		const hits = mergePageHits([
			person({
				affiliations: [{ role: 'Übungsleiterin', roleMatches: true, team: DIAMONDS }],
				nameMatches: false,
			}),
		]);

		expect(hits.map((hit) => [hit.id, hit.score])).toStrictEqual([
			['group-diamonds', 1],
			['contact', 1],
		]);
	});

	it('adds a role match to a name match on the same page', () => {
		const hits = mergePageHits([
			person({ affiliations: [{ role: 'Übungsleiterin', roleMatches: true, team: DIAMONDS }] }),
		]);

		expect(hits.map((hit) => hit.score)).toStrictEqual([4, 4]);
	});

	it('turns a FAQ hit into its department, with the question as snippet', () => {
		expect(mergePageHits([faq()])).toStrictEqual([
			{
				href: '/angebot/tanzen',
				id: 'department-tanzen',
				kind: 'department',
				meta: 'Abteilung',
				score: 4,
				snippet: 'Frage: Wann ist Training?',
				thumbnail: getSearchThumbnail(TANZEN.image, 'department'),
				title: 'Tanzen',
			},
		]);
	});

	it('keeps the snippet of the source with the highest score', () => {
		expect(mergePageHits([faq({ _score: 4 }), page(TANZEN, 2)])[0]).toMatchObject({
			score: 4,
			snippet: 'Frage: Wann ist Training?',
		});
		expect(mergePageHits([page(TANZEN, 10), faq({ _score: 4 })])[0]).toMatchObject({ score: 10 });
		expect(mergePageHits([page(TANZEN, 10), faq({ _score: 4 })])[0].snippet).toBeUndefined();
	});

	it('names a TSG-Echo issue as such and links it below the archive', () => {
		const [hit] = mergePageHits([
			{
				...NO_EXTRAS,
				_id: 'echo-2010',
				_score: 10,
				_type: 'echo.issue',
				department: null,
				indexable: true,
				slug: '2010',
				title: 'TSG-Echo 2010',
			},
		]);

		expect(hit).toMatchObject({ href: '/verein/echo/2010', kind: 'echo', meta: 'TSG-Echo' });
	});

	it('sorts by score, then by title in German order', () => {
		const hits = mergePageHits([
			page({ ...ZUMBA, _id: 'group-volleyball', slug: 'volleyball', title: 'Volleyball' }, 3),
			page(HOME, 1),
			page({ ...ZUMBA, _id: 'group-uebung', slug: 'uebung', title: 'Übungsgruppe' }, 3),
		]);

		expect(hits.map((hit) => hit.title)).toStrictEqual([
			'Übungsgruppe',
			'Volleyball',
			'Startseite',
		]);
	});

	// Review focus 2: a group without a department slug has no page.
	it('drops a group without a department slug', () => {
		const orphan = { ...DIAMONDS, department: { slug: null, title: 'Tanzen' } } as unknown as Team;

		const trainer = person({
			affiliations: [{ role: 'Übungsleiterin', roleMatches: true, team: orphan }],
			listedOn: [],
		});

		expect(mergePageHits([page(orphan, 10), trainer])).toStrictEqual([]);
	});

	it('omits the role of a person whose role reference is dangling', () => {
		const hits = mergePageHits([
			person({
				affiliations: [{ role: null, roleMatches: false, team: null }] as unknown as Affiliation[],
			}),
		]);

		expect(hits.map((hit) => hit.snippet)).toStrictEqual(['Ansprechperson: Alina Kaap']);
	});

	it('keeps the trailing space of a name out of the snippet', () => {
		const hits = mergePageHits([person({ firstName: 'Meike ', lastName: ' Muster' })]);

		expect(hits.map((hit) => hit.snippet)).toContain(
			'Ansprechperson: Meike Muster, Übungsleiterin',
		);
	});

	// The catch-all term finds a person whose words sit in the name and the task together, but no
	// single page shows that match.
	it('gives no hit for a person matched only across name and task', () => {
		const hits = mergePageHits([
			person({
				affiliations: [{ role: 'Trainerin', roleMatches: false, team: DIAMONDS }],
				nameMatches: false,
			}),
		]);

		expect(hits).toStrictEqual([]);
	});

	// Review focus 2: `production` before the WEB-384 migration has no `department` documents, its
	// groups name their department as a string, and persons still belong to the old `group.*` types.
	it('keeps the remaining hits of a dataset from before the department migration', () => {
		const candidates = [
			page(HOME, 4),
			page({ ...DIAMONDS, department: null } as unknown as Team, 10),
			faq({ targets: [null] as unknown as Candidate<'faq'>['targets'] }),
			faq({ _id: 'faq-without-departments', targets: null as unknown as [] }),
			person({
				affiliations: [
					{
						role: null,
						roleMatches: false,
						team: { ...ZUMBA, _type: 'group.fussball', department: null },
					},
				] as unknown as Affiliation[],
			}),
			person({ _id: 'person-without-affiliations', affiliations: null, listedOn: [] }),
		];

		expect(mergePageHits(candidates).map((hit) => [hit.href, hit.snippet])).toStrictEqual([
			['/', undefined],
			['/kontakt', 'Ansprechperson: Alina Kaap'],
		]);
	});

	it('only leads a person to a page the website has', () => {
		const category: ListedPage = {
			...NO_EXTRAS,
			_id: 'newsOverviewCategory',
			_type: 'newsOverviewCategory',
			department: null,
			slug: null,
			title: 'News-Kategorie',
		};

		expect(mergePageHits([person({ affiliations: [], listedOn: [category] })])).toStrictEqual([]);
	});

	// The department then gets a snippet from its own text, like a hit on its own content.
	it('gives a FAQ without a question no snippet of its own', () => {
		const [hit] = mergePageHits([faq({ question: ' ' })]);

		expect(hit).toMatchObject({ id: 'department-tanzen', score: 4 });
		expect(hit.snippet).toBeUndefined();
	});
});

describe(toSearchHit, () => {
	const ARTICLE = {
		...NO_EXTRAS,
		_id: 'article-gladbach',
		_type: 'news.article',
		category: { slug: 'fussball', title: 'Fußball' },
		department: null,
		publishedAt: '2026-03-01T12:00:00Z',
		slug: 'sieg-gegen-gladbach',
		title: 'Sieg gegen Gladbach',
	};

	it('dates a news hit like the news previews and names its category', () => {
		expect(toSearchHit(ARTICLE, 12)).toStrictEqual({
			href: '/news/fussball/sieg-gegen-gladbach',
			id: 'article-gladbach',
			kind: 'news',
			meta: '01.03.2026 · Fußball',
			score: 12,
			thumbnail: null,
			title: 'Sieg gegen Gladbach',
		});
	});

	it('names only the category of a news hit without a date', () => {
		expect(toSearchHit({ ...ARTICLE, publishedAt: null }, 12)).toMatchObject({ meta: 'Fußball' });
	});
});
