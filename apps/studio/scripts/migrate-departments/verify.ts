import { DEPARTMENT_SEEDS } from './seeds';
import type { GroupSummary, MigrationStore } from './store';

const DRAFTS_PREFIX = 'drafts.';

/**
 * Finds every `group` without a department reference. It has no place on the website and no list
 * in the desk.
 *
 * @param groups - Every `group`, published and draft.
 * @returns One German problem per group.
 */
function findGroupsWithoutDepartment(groups: readonly GroupSummary[]): string[] {
	return groups
		.filter(({ departmentId }) => !departmentId)
		.map(({ _id, title }) => `Gruppe ${_id} („${title ?? ''}“) hat keine Abteilung.`);
}

/**
 * Checks the dataset after a real run: no legacy type left, every group under a department, no
 * department string left in an affiliation, all six departments there, each with a card image.
 *
 * @param store - The Sanity side.
 * @returns The problems in German, empty when the migration is complete.
 */
async function verifyMigration(store: MigrationStore): Promise<string[]> {
	const [departments, groups, legacyGroups, persons] = await Promise.all([
		store.fetchDepartments(),
		store.fetchGroups(),
		store.fetchLegacyGroups(),
		store.fetchPersons(),
	]);
	const published = departments.filter(({ _id }) => !_id.startsWith(DRAFTS_PREFIX));
	return [
		...legacyGroups.map(({ _id, _type }) => `Dokument ${_id} hat noch den alten Typ „${_type}“.`),
		...findGroupsWithoutDepartment(groups),
		...persons.flatMap(({ _id, affiliations }) =>
			(affiliations ?? []).flatMap(({ _key, department }) =>
				typeof department === 'string'
					? [
							`Person ${_id}: Die Zugehörigkeit ${_key} nennt die Abteilung noch als Text („${department}“).`,
						]
					: [],
			),
		),
		...(published.length < DEPARTMENT_SEEDS.length
			? [`Nur ${published.length} von ${DEPARTMENT_SEEDS.length} Abteilungen sind veröffentlicht.`]
			: []),
		...departments
			.filter(({ cardImageAssetId }) => !cardImageAssetId)
			.map(({ _id }) => `Abteilung ${_id} hat kein Kachelbild.`),
	];
}

export { findGroupsWithoutDepartment, verifyMigration };
