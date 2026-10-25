// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { runMigration } from './run';
import { DEPARTMENT_SEEDS } from './seeds';
import { createFakeStore } from './test-utils/fake-store';
import type { FakeDocument } from './test-utils/fake-store';
import {
	CONTACT_PERSON_IDS,
	createProductionFixture,
	legacyGroup,
	ref,
} from './test-utils/fixtures';
import { verifyMigration } from './verify';

/** The six departments as the migration leaves them: published, each with a card image. */
const DEPARTMENTS: FakeDocument[] = DEPARTMENT_SEEDS.map(({ id, slug }) => ({
	_id: id,
	_type: 'department',
	cardImage: { _type: 'extendedImage', asset: ref(`image-${slug}`) },
	slug: { current: slug },
}));

/**
 * The problems the verification finds in a dataset.
 *
 * @param documents - The dataset.
 * @returns The problems.
 */
async function problemsIn(documents: readonly FakeDocument[]): Promise<string[]> {
	return verifyMigration(createFakeStore(documents).store);
}

describe('the verification', () => {
	it('finds nothing after a complete migration', async () => {
		const { store } = createFakeStore(createProductionFixture(), CONTACT_PERSON_IDS);
		await runMigration(store, { dryRun: false });

		await expect(verifyMigration(store)).resolves.toStrictEqual([]);
	});

	it('finds a document of a legacy group type', async () => {
		await expect(
			problemsIn([...DEPARTMENTS, legacyGroup('group.soccer', 'a-jugend')]),
		).resolves.toStrictEqual(['Dokument soccer-a-jugend hat noch den alten Typ „group.soccer“.']);
	});

	it('finds a group without department', async () => {
		await expect(
			problemsIn([
				...DEPARTMENTS,
				{ _id: 'group-x', _type: 'group', department: 'soccer', title: 'X' },
			]),
		).resolves.toStrictEqual(['Gruppe group-x („X“) hat keine Abteilung.']);
	});

	it('finds an affiliation that names its department as text', async () => {
		await expect(
			problemsIn([
				...DEPARTMENTS,
				{
					_id: 'drafts.person-x',
					_type: 'person',
					affiliations: [{ _key: 'x1', department: 'soccer' }],
				},
			]),
		).resolves.toStrictEqual([
			'Person drafts.person-x: Die Zugehörigkeit x1 nennt die Abteilung noch als Text („soccer“).',
		]);
	});

	// A draft does not count: the website only shows published departments.
	it('finds fewer than six published departments', async () => {
		const [first, ...rest] = DEPARTMENTS;
		const draftOnly = { ...first, _id: `drafts.${first._id}` };

		await expect(problemsIn([draftOnly, ...rest])).resolves.toStrictEqual([
			'Nur 5 von 6 Abteilungen sind veröffentlicht.',
		]);
	});

	it('finds a department without card image', async () => {
		const [first, ...rest] = DEPARTMENTS;
		const { cardImage: _cardImage, ...withoutImage } = first;

		await expect(problemsIn([withoutImage, ...rest])).resolves.toStrictEqual([
			'Abteilung department-fussball hat kein Kachelbild.',
		]);
	});
});
