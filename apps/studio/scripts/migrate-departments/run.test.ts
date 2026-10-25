// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { runMigration, summarize } from './run';
import { WRITE_METHODS, clearCalls, createFakeStore } from './test-utils/fake-store';
import type { FakeDocument, FakeStore } from './test-utils/fake-store';
import {
	CONTACT_PERSON_IDS,
	GROUPS_PAGE_STATS,
	LEGACY_PERSONS,
	ORPHANED_GROUPS,
	createProductionFixture,
	legacyGroup,
	newsLinkingTo,
	ref,
} from './test-utils/fixtures';

/** The documents whose references the production fixture points at legacy groups. */
const REFERRERS = ['person-coach', 'drafts.person-coach', 'person-dancer', 'news-1'];

/**
 * Every write method the store saw called, with its call count.
 *
 * @param store - The fake store.
 * @returns The called write methods.
 */
function writesOf(store: FakeStore): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const method of WRITE_METHODS) {
		const count = store[method].mock.calls.length;
		if (count > 0) {
			counts[method] = count;
		}
	}
	return counts;
}

/**
 * The ids of the `group` documents the store created, in their order.
 *
 * @param store - The fake store.
 * @returns The ids.
 */
function createdGroups(store: FakeStore): string[] {
	return store.createOrReplace.mock.calls
		.map(([document]) => document)
		.filter(({ _type }) => _type === 'group')
		.map(({ _id }) => _id);
}

/**
 * When the store was first asked to create a `group`.
 *
 * @param store - The fake store.
 * @returns The invocation order of that call.
 */
function firstGroupCreation(store: FakeStore): number {
	const index = store.createOrReplace.mock.calls.findIndex(([{ _type }]) => _type === 'group');
	return store.createOrReplace.mock.invocationCallOrder[index];
}

/**
 * The deletions the store saw whose id passes a test, with their invocation order.
 *
 * @param store - The fake store.
 * @param matches - Which ids to keep.
 * @returns The ids and their order.
 */
function deletionsOf(
	store: FakeStore,
	matches: (id: string) => boolean,
): { id: string; order: number }[] {
	return store.deleteDocument.mock.calls
		.map(([id], index) => ({ id, order: store.deleteDocument.mock.invocationCallOrder[index] }))
		.filter(({ id }) => matches(id));
}

/**
 * A draft-only legacy group and a draft person that references it weakly, as the studio does
 * before the group is published.
 */
const DRAFT_ONLY: FakeDocument[] = [
	{ ...legacyGroup('group.other-sports', 'sportart-7'), _id: 'drafts.other-sports-sportart-7' },
	{
		_id: 'drafts.person-new',
		_type: 'person',
		affiliations: [
			{
				_key: 'n1',
				_type: 'affiliation',
				team: {
					_ref: 'other-sports-sportart-7',
					_strengthenOnPublish: {
						template: { id: 'group.other-sports' },
						type: 'group.other-sports',
					},
					_type: 'reference',
					_weak: true,
				},
			},
		],
	},
];

describe('a dry run', () => {
	it('calls no write method and leaves the dataset as it was', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);
		const before = structuredClone([...lake.entries()]);

		await runMigration(store, { dryRun: true });

		expect(writesOf(store)).toStrictEqual({});
		expect([...lake.entries()]).toStrictEqual(before);
	});

	it('counts every write a real run would make', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		const report = await runMigration(store, { dryRun: true });

		expect(report).toMatchObject({
			changed: new Set([...REFERRERS, ...LEGACY_PERSONS.map(({ _id }) => _id)]).size,
			deleted: 2,
			departments: 6,
			groups: 11 + 4 + 4 + 3 + 4 + 6,
			legacyDeleted: 32,
			orphanedGroups: ORPHANED_GROUPS.length,
			persons: LEGACY_PERSONS.length,
			problems: [],
			rewritten: REFERRERS.length,
		});
	});

	it('lists the department and group pages the website serves after the migration', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		const { paths } = await runMigration(store, { dryRun: true });

		expect(paths).toContain('/angebot/fussball');
		expect(paths).toContain('/angebot/fussball/mannschaft-1');
		expect(paths).toContain('/angebot/weitere-sportarten/sportart-6');
		expect(paths).toHaveLength(6 + 32);
	});

	it('lists the departments in their order, each followed by its groups by slug', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		const { paths } = await runMigration(store, { dryRun: true });

		expect(paths.slice(0, 3)).toStrictEqual([
			'/angebot/fussball',
			'/angebot/fussball/mannschaft-1',
			'/angebot/fussball/mannschaft-10',
		]);
		expect(paths.filter((path) => path.split('/').length === 3)).toStrictEqual([
			'/angebot/fussball',
			'/angebot/kinderturnen',
			'/angebot/kurse',
			'/angebot/taekwondo',
			'/angebot/tanzen',
			'/angebot/weitere-sportarten',
		]);
	});

	// A draft is migrated as well, but the website does not serve it.
	it('counts a group draft without listing a path for it', async () => {
		const { store } = createFakeStore(
			[...createProductionFixture(), ...DRAFT_ONLY],
			CONTACT_PERSON_IDS,
		);

		const report = await runMigration(store, { dryRun: true });

		expect(report.groups).toBe(33);
		expect(report.paths.some((path) => path.endsWith('/sportart-7'))).toBe(false);
	});
});

describe('a real run', () => {
	it('creates the departments with uploaded images, the shared stats and today’s contact persons', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(store.uploadImage).toHaveBeenCalledTimes(18);
		expect(lake.get('department-fussball')).toMatchObject({
			cardImage: { asset: { _ref: 'image-fussball-card.webp' } },
			contactPersons: [ref('person-coach'), ref('person-board')],
			heroImage: { asset: { _ref: 'image-fussball-hero.webp' } },
			meta: { openGraphImage: { asset: { _ref: 'image-fussball-og.webp' } } },
			stats: GROUPS_PAGE_STATS.map(({ title, value }) => ({ title, value })),
		});
		expect(lake.get('department-tanzen')).toMatchObject({ contactPersons: [ref('person-dancer')] });
	});

	it('moves every sport group to a group under its department with a new id', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('group-soccer-mannschaft-1')).toMatchObject({
			_type: 'group',
			department: ref('department-fussball'),
			slug: { current: 'mannschaft-1' },
		});
		expect(lake.get('group-soccer-mannschaft-1')).not.toHaveProperty('isSportGroup');
		expect([...lake.values()].filter(({ _type }) => _type.startsWith('group.'))).toStrictEqual([]);
	});

	it('creates the published groups first, then the drafts, and a draft-only group as a draft', async () => {
		const draft = {
			...legacyGroup('group.soccer', 'mannschaft-1'),
			_id: 'drafts.soccer-mannschaft-1',
		};
		const { lake, store } = createFakeStore(
			[...createProductionFixture(), draft, ...DRAFT_ONLY],
			CONTACT_PERSON_IDS,
		);

		await runMigration(store, { dryRun: false });

		expect(createdGroups(store).slice(-3)).toStrictEqual([
			'group-other-sports-sportart-6',
			'drafts.group-soccer-mannschaft-1',
			'drafts.group-other-sports-sportart-7',
		]);
		expect(lake.has('group-other-sports-sportart-7')).toBe(false);
	});

	it('rewrites the references and the affiliations of a person in one patch', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('person-coach')?.affiliations).toStrictEqual([
			{
				_key: 'c1',
				_type: 'affiliation',
				department: ref('department-fussball'),
				role: ref('role-trainer'),
				team: ref('group-soccer-mannschaft-1'),
			},
			{ _key: 'c2', _type: 'affiliation', role: ref('role-trainer') },
		]);
		expect(store.patchDocument.mock.calls.filter(([id]) => id === 'person-coach')).toStrictEqual([
			['person-coach', 'rev-0', { affiliations: lake.get('person-coach')?.affiliations }],
		]);
	});

	it('rewrites an internal link deep inside a news article', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('news-1')?.body).toStrictEqual(
			newsLinkingTo('news-1', 'group-soccer-mannschaft-1').body,
		);
	});

	it('keeps a weak reference weak and strengthens it to a group on publish', async () => {
		const { lake, store } = createFakeStore(DRAFT_ONLY);

		await runMigration(store, { dryRun: false });

		expect(lake.get('drafts.person-new')?.affiliations).toStrictEqual([
			{
				_key: 'n1',
				_type: 'affiliation',
				team: {
					_ref: 'group-other-sports-sportart-7',
					_strengthenOnPublish: { template: { id: 'group.other-sports' }, type: 'group' },
					_type: 'reference',
					_weak: true,
				},
			},
		]);
	});

	it('deletes the legacy groups, drafts first, once the last reference is rewritten', async () => {
		const draft = {
			...legacyGroup('group.soccer', 'mannschaft-1'),
			_id: 'drafts.soccer-mannschaft-1',
		};
		const { store } = createFakeStore([...createProductionFixture(), draft], CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		const legacy = deletionsOf(store, (id) => /^(?:drafts\.)?(?:soccer|dance)-/u.test(id));
		expect(legacy[0]?.id).toBe('drafts.soccer-mannschaft-1');
		expect(legacy).toHaveLength(11 + 4 + 1);
		const lastPatch = Math.max(...store.patchDocument.mock.invocationCallOrder);
		expect(Math.min(...legacy.map(({ order }) => order))).toBeGreaterThan(lastPatch);
	});

	it('deletes the administration groups only after the last patch', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		const admin = deletionsOf(store, (id) => id.startsWith('admin-'));
		expect(admin.map(({ id }) => id)).toStrictEqual(['admin-vorstand', 'admin-pr-team']);
		const lastPatch = Math.max(...store.patchDocument.mock.invocationCallOrder);
		expect(Math.min(...admin.map(({ order }) => order))).toBeGreaterThan(lastPatch);
	});

	it('removes the stats from the groups page', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('groupsPage')?.content).toStrictEqual({});
	});

	it('writes nothing the second time', async () => {
		const { store } = createFakeStore(
			[...createProductionFixture(), ...DRAFT_ONLY],
			CONTACT_PERSON_IDS,
		);
		await runMigration(store, { dryRun: false });
		clearCalls(store);

		const report = await runMigration(store, { dryRun: false });

		expect(writesOf(store)).toStrictEqual({});
		expect(report).toMatchObject({
			changed: 0,
			deleted: 0,
			departments: 0,
			groups: 0,
			legacyDeleted: 0,
			orphanedGroups: 0,
			persons: 0,
			problems: [],
			rewritten: 0,
		});
		expect(report.paths).toHaveLength(6 + 32);
	});

	// An editor may have changed a department between two runs.
	it('leaves an existing department alone', async () => {
		const edited = {
			_id: 'department-fussball',
			_type: 'department',
			cardImage: { asset: ref('image-edited') },
			slug: { current: 'fussball' },
			sortOrder: 10,
			stats: [],
		};
		const { lake, store } = createFakeStore(
			[...createProductionFixture(), edited],
			CONTACT_PERSON_IDS,
		);

		const report = await runMigration(store, { dryRun: false });

		expect(report.departments).toBe(5);
		expect(store.uploadImage).toHaveBeenCalledTimes(15);
		expect(lake.get('department-fussball')).toStrictEqual(edited);
	});
});

describe('the problems of a run', () => {
	it('report a legacy type without a department and leave it alone', async () => {
		const { lake, store } = createFakeStore([legacyGroup('group.swimming', 'kraulen')]);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toContain(
			'Unbekannter Gruppentyp „group.swimming“ bei swimming-kraulen: nicht umgestellt.',
		);
		expect(createdGroups(store)).toStrictEqual([]);
		expect(lake.has('swimming-kraulen')).toBe(true);
	});

	it('report a department string the migration does not know', async () => {
		const { store } = createFakeStore([
			{
				_id: 'person-x',
				_type: 'person',
				affiliations: [{ _key: 'x1', department: 'massSports' }],
			},
		]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Person person-x: unbekannte Abteilung „massSports“ in der Zugehörigkeit x1, nicht umgestellt.',
		);
		expect(report.persons).toBe(0);
	});

	// Neither migrated nor reported would leave the department strings behind unnoticed.
	it.each([
		['a dry run', true],
		['a real run', false],
	])('report affiliations the migration cannot read in %s', async (_name, dryRun) => {
		const { store } = createFakeStore([
			{ _id: 'person-a', _type: 'person', affiliations: [{ department: 'soccer' }] },
			{
				_id: 'person-b',
				_type: 'person',
				affiliations: [null, { _key: 'b1', department: 'soccer' }],
			},
			{ _id: 'person-c', _type: 'person', affiliations: { _key: 'c1', department: 'soccer' } },
			{ _id: 'person-d', _type: 'person', affiliations: [] },
			{ _id: 'person-e', _type: 'person', affiliations: null },
			{ _id: 'person-f', _type: 'person' },
		]);

		const report = await runMigration(store, { dryRun });

		expect(report.problems).toStrictEqual(
			['person-a', 'person-b', 'person-c'].map(
				(id) =>
					`Person ${id}: Die Zugehörigkeiten haben nicht die erwartete Form (Liste von Objekten mit _key), nicht umgestellt.`,
			),
		);
		expect(report).toMatchObject({ changed: 0, persons: 0 });
		expect(store.patchDocument).not.toHaveBeenCalled();
	});

	// A draft the current studio creates has no department until the editor picks one.
	it('report a group without department and list no path for it, but keep it', async () => {
		const { store } = createFakeStore([{ _id: 'drafts.new-group', _type: 'group', title: 'Neu' }]);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toContain('Gruppe drafts.new-group („Neu“) hat keine Abteilung.');
		expect(report.paths).toHaveLength(6);
		expect(store.deleteDocument).not.toHaveBeenCalled();
	});

	it('report a group without slug', async () => {
		const { _id, _type, title } = legacyGroup('group.dance', 'ohne-slug');
		const { store } = createFakeStore([{ _id, _type, title }]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Gruppe group-dance-ohne-slug („ohne-slug“) hat keinen Slug und bekommt keinen Pfad.',
		);
	});

	// Sanity refuses to delete a document that is still referenced, so it stays and is reported.
	it('keep a legacy group that a release version still references', async () => {
		const version = {
			...newsLinkingTo('news-2', 'soccer-mannschaft-1'),
			_id: 'versions.r1.news-2',
		};
		const { lake, store } = createFakeStore(
			[...createProductionFixture(), version],
			CONTACT_PERSON_IDS,
		);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toStrictEqual([
			'Version versions.r1.news-2 („news.article“) liegt in einem Release und wird nicht migriert. Den Release vorher veröffentlichen oder verwerfen.',
			'Die Gruppe soccer-mannschaft-1 (alter Typ) bleibt bestehen, weil noch versions.r1.news-2 auf sie verweist.',
		]);
		expect(lake.get('soccer-mannschaft-1')?._type).toBe('group.soccer');
		expect(lake.get('versions.r1.news-2')).toStrictEqual(version);
		expect(report.legacyDeleted).toBe(31);
	});

	it('keep an administration group that a person still uses as team', async () => {
		const { store } = createFakeStore([
			legacyGroup('group.admin', 'vorstand'),
			{
				_id: 'person-x',
				_type: 'person',
				affiliations: [{ _key: 'x1', department: 'soccer', team: ref('admin-vorstand') }],
			},
		]);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toContain(
			'Die Administration-Gruppe admin-vorstand bleibt bestehen, weil noch person-x auf sie verweist.',
		);
		expect(store.deleteDocument).not.toHaveBeenCalled();
		expect(report.deleted).toBe(0);
	});

	it('keep an administration group that another document references', async () => {
		const { store } = createFakeStore([
			legacyGroup('group.admin', 'vorstand'),
			{ ...legacyGroup('group.admin', 'vorstand'), _id: 'drafts.admin-vorstand' },
			{ _id: 'news-1', _type: 'news.article', team: ref('admin-vorstand') },
		]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Die Administration-Gruppe admin-vorstand bleibt bestehen, weil noch news-1 auf sie verweist.',
		);
		expect(report.deleted).toBe(0);
	});

	it('report an existing group under a department that is gone', async () => {
		const { store } = createFakeStore([
			{
				_id: 'group-x',
				_type: 'group',
				department: ref('department-schwimmen'),
				slug: { current: 'x' },
			},
		]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Gruppe group-x verweist auf die Abteilung department-schwimmen, die es nicht gibt.',
		);
	});

	it('report an existing department without slug', async () => {
		const { store } = createFakeStore([{ _id: 'department-x', _type: 'department' }]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Abteilung department-x hat keinen Slug und bekommt keinen Pfad.',
		);
	});
});

describe('the groups left from 2024', () => {
	it('are deleted, published and draft, before the first new group is created', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(ORPHANED_GROUPS.filter(({ _id }) => lake.has(_id))).toStrictEqual([]);
		const orphans = deletionsOf(store, (id) => id.includes('old-'));
		expect(orphans.map(({ id }) => id)).toStrictEqual(ORPHANED_GROUPS.map(({ _id }) => _id));
		expect(Math.max(...orphans.map(({ order }) => order))).toBeLessThan(firstGroupCreation(store));
	});

	it('stay untouched in a dry run', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		const report = await runMigration(store, { dryRun: true });

		expect(report.orphanedGroups).toBe(3);
		expect(ORPHANED_GROUPS.filter(({ _id }) => !lake.has(_id))).toStrictEqual([]);
	});

	it('stay with a problem while something references them', async () => {
		const { lake, store } = createFakeStore([
			...ORPHANED_GROUPS,
			{ _id: 'news-9', _type: 'news.article', team: ref('old-2-mannschaft') },
		]);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toContain(
			'Die alte Gruppe old-2-mannschaft ohne Abteilungsverweis bleibt bestehen, weil noch news-9 auf sie verweist.',
		);
		expect(lake.has('old-2-mannschaft')).toBe(true);
		expect(lake.has('drafts.old-2-mannschaft')).toBe(true);
		expect(report.orphanedGroups).toBe(1);
	});
});

describe('an orphaned group that references a legacy group', () => {
	/** A 2024 group, published and draft, that points at a group the migration moves. */
	const orphans: FakeDocument[] = ['old-3-mannschaft', 'drafts.old-3-mannschaft'].map((_id) => ({
		_id,
		_type: 'group',
		department: 'soccer',
		team: ref('soccer-mannschaft-1'),
		title: '3. Mannschaft',
	}));

	// Step 3 deletes it, so a patch with `ifRevisionID` in step 5 would abort the real run.
	it('is deleted in step 3 and never patched', async () => {
		const { lake, store } = createFakeStore(
			[...createProductionFixture(), ...orphans],
			CONTACT_PERSON_IDS,
		);

		const report = await runMigration(store, { dryRun: false });

		expect(orphans.filter(({ _id }) => lake.has(_id))).toStrictEqual([]);
		expect(store.patchDocument.mock.calls.map(([id]) => id)).not.toContain('old-3-mannschaft');
		expect(store.patchDocument.mock.calls.map(([id]) => id)).not.toContain(
			'drafts.old-3-mannschaft',
		);
		expect(report).toMatchObject({ changed: 5, rewritten: REFERRERS.length });
		expect(report.problems).toStrictEqual([]);
	});

	it('gives a dry run the same report as a real run', async () => {
		const documents = [...createProductionFixture(), ...orphans];
		const dry = createFakeStore(documents, CONTACT_PERSON_IDS);
		const real = createFakeStore(documents, CONTACT_PERSON_IDS);

		const dryReport = await runMigration(dry.store, { dryRun: true });
		const realReport = await runMigration(real.store, { dryRun: false });

		expect(dryReport.problems).toStrictEqual([]);
		expect(dryReport).toStrictEqual(realReport);
	});

	// It exists afterwards, so its reference to the old group has to move like every other one.
	it('is still patched while something references it and it stays', async () => {
		const { lake, store } = createFakeStore([
			legacyGroup('group.soccer', 'mannschaft-1'),
			orphans[0],
			{ _id: 'news-9', _type: 'news.article', team: ref('old-3-mannschaft') },
		]);

		const report = await runMigration(store, { dryRun: false });

		expect(lake.get('old-3-mannschaft')?.team).toStrictEqual(ref('group-soccer-mannschaft-1'));
		expect(report.problems).toContain(
			'Die alte Gruppe old-3-mannschaft ohne Abteilungsverweis bleibt bestehen, weil noch news-9 auf sie verweist.',
		);
		expect(report.rewritten).toBe(1);
	});
});

describe('the release versions', () => {
	const versions = [
		{ ...legacyGroup('group.soccer', 'mannschaft-1'), _id: 'versions.r1.soccer-mannschaft-1' },
		{
			_id: 'versions.r1.person-dancer',
			_type: 'person',
			affiliations: [{ _key: 'd1', department: 'dance' }],
		},
		{ _id: 'versions.r1.groupsPage', _type: 'groupsPage', content: { stats: GROUPS_PAGE_STATS } },
	];

	it('are reported and left alone', async () => {
		const { lake, store } = createFakeStore(
			[...createProductionFixture(), ...versions],
			CONTACT_PERSON_IDS,
		);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toStrictEqual(
			versions.map(
				({ _id, _type }) =>
					`Version ${_id} („${_type}“) liegt in einem Release und wird nicht migriert. Den Release vorher veröffentlichen oder verwerfen.`,
			),
		);
		expect(versions.map(({ _id }) => lake.get(_id))).toStrictEqual(versions);
		expect(report).toMatchObject({ groups: 32, persons: LEGACY_PERSONS.length });
	});

	it('get no path', async () => {
		const { store } = createFakeStore(
			[...createProductionFixture(), ...versions],
			CONTACT_PERSON_IDS,
		);

		const { paths } = await runMigration(store, { dryRun: true });

		expect(paths).toHaveLength(6 + 32);
	});
});

describe('the images of a dry run', () => {
	it('are reported when a file is missing', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS, [
			'fussball-hero.webp',
		]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toStrictEqual([
			'Das Bild fussball-hero.webp fehlt in scripts/migrate-departments/images.',
		]);
		expect(store.hasImage).toHaveBeenCalledTimes(18);
	});
});

describe('the summary of a run', () => {
	const report = {
		changed: 50,
		deleted: 2,
		departments: 6,
		groups: 32,
		legacyDeleted: 32,
		orphanedGroups: 44,
		paths: ['/angebot/fussball', '/angebot/fussball/1-mannschaft'],
		persons: 42,
		problems: [],
		rewritten: 42,
	};

	it('says that a dry run wrote nothing and lists the paths', () => {
		expect(summarize(report, [], true)).toStrictEqual([
			'Probelauf, geschrieben wurde nichts. Ein echter Lauf würde:',
			'  Abteilungen angelegt: 6',
			'  Alte Gruppen ohne Abteilungsverweis gelöscht: 44',
			'  Gruppen unter neuer ID angelegt: 32',
			'  Dokumente mit umgeschriebenen Verweisen: 42',
			'  Personen angepasst: 42',
			'  Dokumente geändert: 50',
			'  Gruppen des alten Typs gelöscht: 32',
			'  Administration-Gruppen gelöscht: 2',
			'Pfade nach der Migration (2):',
			'/angebot/fussball',
			'/angebot/fussball/1-mannschaft',
			'Keine Probleme.',
		]);
	});

	it('lists the problems of a real run', () => {
		expect(summarize(report, ['Abteilung department-x hat kein Kachelbild.'], false)).toStrictEqual(
			expect.arrayContaining([
				'Geschrieben:',
				'Probleme (1):',
				'  Abteilung department-x hat kein Kachelbild.',
			]),
		);
	});
});
