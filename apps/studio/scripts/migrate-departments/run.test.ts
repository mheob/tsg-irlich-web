// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { runMigration, summarize } from './run';
import { WRITE_METHODS, clearCalls, createFakeStore } from './test-utils/fake-store';
import type { FakeStore } from './test-utils/fake-store';
import {
	CONTACT_PERSON_IDS,
	GROUPS_PAGE_STATS,
	LEGACY_PERSONS,
	createProductionFixture,
	legacyGroup,
	ref,
} from './test-utils/fixtures';

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

describe('a dry run', () => {
	it('calls no write method and leaves the dataset as it was', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);
		const before = structuredClone([...lake.entries()]);

		await runMigration(store, { dryRun: true });

		expect(writesOf(store)).toStrictEqual({});
		expect([...lake.entries()]).toStrictEqual(before);
	});

	it('counts six departments, 32 groups, two deletions and every person with a department string', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		const report = await runMigration(store, { dryRun: true });

		expect(report).toMatchObject({
			deleted: 2,
			departments: 6,
			groups: 11 + 4 + 4 + 3 + 4 + 6,
			persons: LEGACY_PERSONS.length,
			problems: [],
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

	// A draft is swapped as well, but the website does not serve it.
	it('swaps a group draft without listing a path for it', async () => {
		const draft = {
			...legacyGroup('group.other-sports', 'tischtennis'),
			_id: 'drafts.tischtennis',
		};
		const { store } = createFakeStore([...createProductionFixture(), draft], CONTACT_PERSON_IDS);

		const report = await runMigration(store, { dryRun: true });

		expect(report.groups).toBe(33);
		expect(report.paths.some((path) => path.endsWith('/tischtennis'))).toBe(false);
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

	it('swaps every sport group for a group under its department with the same id', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('soccer-mannschaft-1')).toMatchObject({
			_type: 'group',
			department: ref('department-fussball'),
			slug: { current: 'mannschaft-1' },
		});
		expect(lake.get('soccer-mannschaft-1')).not.toHaveProperty('isSportGroup');
		expect([...lake.values()].filter(({ _type }) => _type.startsWith('group.'))).toStrictEqual([]);
	});

	it('patches the persons and deletes the administration groups only after the last patch', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('person-coach')?.affiliations).toStrictEqual([
			{
				_key: 'c1',
				_type: 'affiliation',
				department: ref('department-fussball'),
				role: ref('role-trainer'),
				team: ref('soccer-mannschaft-1'),
			},
			{ _key: 'c2', _type: 'affiliation', role: ref('role-trainer') },
		]);
		expect(store.deleteDocument.mock.calls.map(([id]) => id)).toStrictEqual([
			'admin-vorstand',
			'admin-pr-team',
		]);
		const lastPatch = Math.max(...store.patchAffiliations.mock.invocationCallOrder);
		const firstDeletion = Math.min(...store.deleteDocument.mock.invocationCallOrder);
		expect(firstDeletion).toBeGreaterThan(lastPatch);
	});

	it('removes the stats from the groups page', async () => {
		const { lake, store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);

		await runMigration(store, { dryRun: false });

		expect(lake.get('groupsPage')?.content).toStrictEqual({});
	});

	it('writes nothing the second time', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);
		await runMigration(store, { dryRun: false });
		clearCalls(store);

		const report = await runMigration(store, { dryRun: false });

		expect(writesOf(store)).toStrictEqual({});
		expect(report).toMatchObject({
			deleted: 0,
			departments: 0,
			groups: 0,
			persons: 0,
			problems: [],
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
		const { store } = createFakeStore([legacyGroup('group.swimming', 'kraulen')]);

		const report = await runMigration(store, { dryRun: false });

		expect(report.problems).toContain(
			'Unbekannter Gruppentyp „group.swimming“ bei swimming-kraulen: nicht umgestellt.',
		);
		expect(store.swapType).not.toHaveBeenCalled();
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

	// Development and production hold `group` documents from 2024 whose department is a string.
	it('report a group without a department reference and list no path for it', async () => {
		const { store } = createFakeStore([
			{ _id: 'old-group', _type: 'group', department: 'soccer', title: '2. Mannschaft' },
		]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain('Gruppe old-group („2. Mannschaft“) hat keine Abteilung.');
		expect(report.paths).toHaveLength(6);
	});

	it('report a group without slug', async () => {
		const { _id, _type, title } = legacyGroup('group.dance', 'ohne-slug');
		const { store } = createFakeStore([{ _id, _type, title }]);

		const report = await runMigration(store, { dryRun: true });

		expect(report.problems).toContain(
			'Gruppe dance-ohne-slug („ohne-slug“) hat keinen Slug und bekommt keinen Pfad.',
		);
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

describe('the summary of a run', () => {
	const report = {
		deleted: 2,
		departments: 6,
		groups: 32,
		paths: ['/angebot/fussball', '/angebot/fussball/1-mannschaft'],
		persons: 42,
		problems: [],
	};

	it('says that a dry run wrote nothing and lists the paths', () => {
		expect(summarize(report, [], true)).toStrictEqual([
			'Probelauf, geschrieben wurde nichts. Ein echter Lauf würde:',
			'  Abteilungen angelegt: 6',
			'  Gruppen umgestellt: 32',
			'  Personen angepasst: 42',
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
