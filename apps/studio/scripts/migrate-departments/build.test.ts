// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { buildDepartmentDocument, migrateAffiliations, toGroupDocument } from './build';
import type { LegacyGroupDocument, StatsItem } from './build';
import { DEPARTMENT_SEEDS } from './seeds';

const ASSET_IDS = {
	card: 'image-card-480x480-webp',
	hero: 'image-hero-1920x800-webp',
	openGraph: 'image-og-1200x630-webp',
};
const STATS: StatsItem[] = [
	{ _key: '40d4a28f5866', _type: 'stats', suffix: '+', title: 'Fußball-Teams', value: 10 },
	{ _key: '512c6655bfdc', _type: 'stats', title: 'Breitensportgruppen', value: 20 },
];
const DEPARTMENT_ID_BY_LEGACY = new Map([
	['soccer', 'department-fussball'],
	['dance', 'department-tanzen'],
]);
const ROLE = { _ref: 'role-trainer', _type: 'reference' } as const;
const TEAM = { _ref: 'group-vorstand', _type: 'reference' } as const;

const fussball = DEPARTMENT_SEEDS[0];
const kurse = DEPARTMENT_SEEDS[2];

describe('a department document', () => {
	it('makes Fußball a team sport with its open graph image', () => {
		const department = buildDepartmentDocument(fussball, ASSET_IDS, STATS, []);

		expect(department.isTeamSport).toBe(true);
		expect(department.meta.openGraphImage.asset._ref).toBe('image-og-1200x630-webp');
	});

	it('copies the stats with new keys', () => {
		const { stats } = buildDepartmentDocument(fussball, ASSET_IDS, STATS, []);

		expect(stats.map(({ suffix, title, value }) => ({ suffix, title, value }))).toStrictEqual(
			STATS.map(({ suffix, title, value }) => ({ suffix, title, value })),
		);
		const keys = stats.map(({ _key }) => _key);
		expect(keys).not.toContain('40d4a28f5866');
		expect(keys).not.toContain('512c6655bfdc');
		expect(new Set(keys).size).toBe(STATS.length);
	});

	it('names the document after its seed and gives every image the title as alt text', () => {
		expect(buildDepartmentDocument(kurse, ASSET_IDS, [], [])).toStrictEqual({
			_id: 'department-kurse',
			_type: 'department',
			cardImage: {
				_type: 'extendedImage',
				alt: 'Kurse',
				asset: { _ref: 'image-card-480x480-webp', _type: 'reference' },
			},
			contactPersons: [],
			heroImage: {
				_type: 'extendedImage',
				alt: 'Kurse',
				asset: { _ref: 'image-hero-1920x800-webp', _type: 'reference' },
			},
			icon: 'StepAerobic',
			isTeamSport: false,
			meta: {
				_type: 'metaFields',
				openGraphImage: {
					_type: 'image',
					alt: 'Kurse',
					asset: { _ref: 'image-og-1200x630-webp', _type: 'reference' },
				},
			},
			slug: { _type: 'slug', current: 'kurse' },
			sortOrder: 30,
			stats: [],
			title: 'Kurse',
		});
	});

	it('references the contact persons in their order, keyed by person id', () => {
		expect(
			buildDepartmentDocument(fussball, ASSET_IDS, [], ['person-b', 'person-a']).contactPersons,
		).toStrictEqual([
			{ _key: 'person-b', _ref: 'person-b', _type: 'reference' },
			{ _key: 'person-a', _ref: 'person-a', _type: 'reference' },
		]);
	});
});

describe('a group document', () => {
	const legacy: LegacyGroupDocument = {
		_createdAt: '2024-09-23T10:00:49Z',
		_id: 'drafts.9150a863',
		_rev: '4lJ2mGct5PnttFtjrn153E',
		_type: 'group.soccer',
		_updatedAt: '2026-09-29T12:28:49Z',
		isSportGroup: true,
		newsCategory: { _ref: 'category-fussball', _type: 'reference' },
		slug: { _type: 'slug', current: '1-mannschaft' },
		title: '1. Mannschaft',
		training: { trainingTimes: [{ _key: 'a', day: 'monday' }] },
	};

	it('keeps the content and drops the revision and the sport group flag', () => {
		const group = toGroupDocument(legacy, 'department-fussball');

		expect(group).toMatchObject({
			_createdAt: '2024-09-23T10:00:49Z',
			newsCategory: { _ref: 'category-fussball', _type: 'reference' },
			slug: { _type: 'slug', current: '1-mannschaft' },
			title: '1. Mannschaft',
			training: { trainingTimes: [{ _key: 'a', day: 'monday' }] },
		});
		expect(group).not.toHaveProperty('isSportGroup');
		expect(group).not.toHaveProperty('_rev');
		expect(group).not.toHaveProperty('_updatedAt');
	});

	// Sanity never changes the type of an id, so the group moves to `group-<id>`.
	it('moves a draft to the draft of its new id', () => {
		expect(toGroupDocument(legacy, 'department-fussball')._id).toBe('drafts.group-9150a863');
	});

	it('moves a published group to its new id', () => {
		expect(toGroupDocument({ ...legacy, _id: '9150a863' }, 'department-fussball')._id).toBe(
			'group-9150a863',
		);
	});

	it('becomes a group under its department', () => {
		expect(toGroupDocument(legacy, 'department-fussball')).toMatchObject({
			_type: 'group',
			department: { _ref: 'department-fussball', _type: 'reference' },
		});
	});
});

describe('the affiliations of a person', () => {
	it('lose department and group for the board and keep the role', () => {
		expect(
			migrateAffiliations(
				[{ _key: 'a1', _type: 'affiliation', department: 'admin', role: ROLE, team: TEAM }],
				DEPARTMENT_ID_BY_LEGACY,
			),
		).toStrictEqual([{ _key: 'a1', _type: 'affiliation', role: ROLE }]);
	});

	it('reference the department instead of naming it', () => {
		expect(
			migrateAffiliations([{ _key: 'a1', department: 'soccer' }], DEPARTMENT_ID_BY_LEGACY),
		).toStrictEqual([
			{ _key: 'a1', department: { _ref: 'department-fussball', _type: 'reference' } },
		]);
	});

	it('keep their group, role and order', () => {
		const team = { _ref: 'group-sweet-diamonds', _type: 'reference' } as const;

		expect(
			migrateAffiliations(
				[
					{ _key: 'a1', department: 'dance', role: ROLE, team },
					{ _key: 'a2', department: { _ref: 'department-fussball', _type: 'reference' } },
				],
				DEPARTMENT_ID_BY_LEGACY,
			),
		).toStrictEqual([
			{
				_key: 'a1',
				department: { _ref: 'department-tanzen', _type: 'reference' },
				role: ROLE,
				team,
			},
			{ _key: 'a2', department: { _ref: 'department-fussball', _type: 'reference' } },
		]);
	});

	it('need no change once they are migrated', () => {
		expect(
			migrateAffiliations(
				[
					{
						_key: 'a1',
						department: { _ref: 'department-fussball', _type: 'reference' },
						role: ROLE,
					},
				],
				DEPARTMENT_ID_BY_LEGACY,
			),
		).toBeUndefined();
	});

	it('need no change without affiliations', () => {
		expect(migrateAffiliations(undefined, DEPARTMENT_ID_BY_LEGACY)).toBeUndefined();
		expect(migrateAffiliations(null, DEPARTMENT_ID_BY_LEGACY)).toBeUndefined();
	});

	// The caller reports the unknown string; the migration does not guess.
	it('leave an unknown department string as it is', () => {
		expect(
			migrateAffiliations([{ _key: 'a1', department: 'massSports' }], DEPARTMENT_ID_BY_LEGACY),
		).toBeUndefined();
	});
});
