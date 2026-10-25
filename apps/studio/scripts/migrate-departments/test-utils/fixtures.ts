import type { FakeDocument } from './fake-store';

const ROLE = { _ref: 'role-trainer', _type: 'reference' };

/** How many groups each legacy type has on `production` (25.10.2026). */
const GROUPS_PER_TYPE: readonly [type: string, slug: string, count: number][] = [
	['group.soccer', 'mannschaft', 11],
	['group.children-gymnastics', 'kinderturnen', 4],
	['group.courses', 'kurs', 4],
	['group.taekwondo', 'taekwondo', 3],
	['group.dance', 'tanzgruppe', 4],
	['group.other-sports', 'sportart', 6],
];

/** The shared stats of the groups page. */
const GROUPS_PAGE_STATS = [
	{ _key: '40d4a28f5866', _type: 'stats', suffix: '+', title: 'Fußball-Teams', value: 10 },
	{ _key: '512c6655bfdc', _type: 'stats', title: 'Breitensportgruppen', value: 20 },
];

/**
 * A reference.
 *
 * @param id - The target.
 * @returns The reference.
 */
function ref(id: string): { _ref: string; _type: 'reference' } {
	return { _ref: id, _type: 'reference' };
}

/**
 * A legacy group as the studio stored it.
 *
 * @param type - The legacy type, e.g. `group.soccer`.
 * @param slug - Its slug.
 * @returns The document; its id is `<type without "group.">-<slug>`.
 */
function legacyGroup(type: string, slug: string): FakeDocument {
	return {
		_id: `${type.replace('group.', '')}-${slug}`,
		_rev: 'rev-0',
		_type: type,
		isSportGroup: type !== 'group.admin',
		slug: { _type: 'slug', current: slug },
		sortOrder: 1,
		title: slug,
		training: { trainingTimes: [] },
	};
}

/** The 32 sport groups of production, by type. */
const SPORT_GROUPS: FakeDocument[] = GROUPS_PER_TYPE.flatMap(([type, slug, count]) =>
	Array.from({ length: count }, (_, index) => legacyGroup(type, `${slug}-${index + 1}`)),
);

const ADMIN_GROUPS: FakeDocument[] = [
	legacyGroup('group.admin', 'vorstand'),
	legacyGroup('group.admin', 'pr-team'),
];

/** Persons with a legacy department string: a board member, a coach (published and draft), a dancer. */
const LEGACY_PERSONS: FakeDocument[] = [
	{
		_id: 'person-board',
		_type: 'person',
		affiliations: [
			{
				_key: 'b1',
				_type: 'affiliation',
				department: 'admin',
				role: ROLE,
				team: ref('admin-vorstand'),
			},
		],
	},
	{
		_id: 'person-coach',
		_type: 'person',
		affiliations: [
			{
				_key: 'c1',
				_type: 'affiliation',
				department: 'soccer',
				role: ROLE,
				team: ref('soccer-mannschaft-1'),
			},
			{
				_key: 'c2',
				_type: 'affiliation',
				department: 'admin',
				role: ROLE,
				team: ref('admin-pr-team'),
			},
		],
	},
	{
		_id: 'drafts.person-coach',
		_type: 'person',
		affiliations: [
			{
				_key: 'c1',
				_type: 'affiliation',
				department: 'soccer',
				role: ROLE,
				team: ref('soccer-mannschaft-1'),
			},
		],
	},
	{
		_id: 'person-dancer',
		_type: 'person',
		affiliations: [
			{
				_key: 'd1',
				_type: 'affiliation',
				department: 'dance',
				role: ROLE,
				team: ref('dance-tanzgruppe-2'),
			},
		],
	},
];

/** Persons the migration leaves alone: one without affiliations, one migrated already. */
const OTHER_PERSONS: FakeDocument[] = [
	{ _id: 'person-empty', _type: 'person' },
	{
		_id: 'person-migrated',
		_type: 'person',
		affiliations: [
			{ _key: 'm1', _type: 'affiliation', department: ref('department-kurse'), role: ROLE },
		],
	},
];

/**
 * `group` documents left from the 2024 schema: a department string (published and draft), or no
 * department but `isSportGroup`.
 */
const ORPHANED_GROUPS: FakeDocument[] = [
	{ _id: 'old-2-mannschaft', _type: 'group', department: 'soccer', title: '2. Mannschaft' },
	{ _id: 'drafts.old-2-mannschaft', _type: 'group', department: 'soccer', title: '2. Mannschaft' },
	{ _id: 'old-vorstand', _type: 'group', isSportGroup: false, title: 'Vorstand' },
];

/**
 * A dataset shaped like `production` before the migration: 32 sport groups, two administration
 * groups, `group` documents left from 2024, persons with department strings, a news article about
 * a team and the groups page stats.
 *
 * @returns The documents.
 */
function createProductionFixture(): FakeDocument[] {
	return [
		...SPORT_GROUPS,
		...ADMIN_GROUPS,
		...ORPHANED_GROUPS,
		...LEGACY_PERSONS,
		...OTHER_PERSONS,
		{
			_id: 'news-1',
			_type: 'news.article',
			groups: [{ _key: 'n1', ...ref('soccer-mannschaft-1') }],
		},
		{ _id: 'groupsPage', _type: 'groupsPage', content: { stats: GROUPS_PAGE_STATS } },
	];
}

/** The persons the department page lists today, per role email. */
const CONTACT_PERSON_IDS = {
	'breitensport@tsg-irlich.de': ['person-dancer'],
	'fussball@tsg-irlich.de': ['person-coach', 'person-board'],
};

export {
	CONTACT_PERSON_IDS,
	GROUPS_PAGE_STATS,
	LEGACY_PERSONS,
	ORPHANED_GROUPS,
	createProductionFixture,
	legacyGroup,
	ref,
};
