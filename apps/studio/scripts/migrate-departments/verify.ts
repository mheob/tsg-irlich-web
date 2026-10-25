import { departmentIdOf } from './documents';
import { DEPARTMENT_SEEDS } from './seeds';
import type { GroupSummary, MigrationStore, PersonDocument } from './store';

/**
 * Finds every `group` without a department reference: one whose department is still a string, or
 * one without department. It has no place on the website and no list in the desk.
 *
 * @param groups - Every `group`, published and draft.
 * @returns One German problem per group.
 */
function findGroupsWithoutDepartment(groups: readonly GroupSummary[]): string[] {
	return groups
		.filter((group) => !departmentIdOf(group))
		.map(({ _id, department, title }) =>
			typeof department === 'string'
				? `Gruppe ${_id} („${title ?? ''}“) nennt die Abteilung noch als Text („${department}“).`
				: `Gruppe ${_id} („${title ?? ''}“) hat keine Abteilung.`,
		);
}

/**
 * Finds every affiliation that still names its department as a string.
 *
 * @param persons - Every person, published and draft.
 * @returns One German problem per affiliation.
 */
function findDepartmentStrings(persons: readonly PersonDocument[]): string[] {
	return persons.flatMap(({ _id, affiliations }) =>
		(affiliations ?? []).flatMap(({ _key, department }) =>
			typeof department === 'string'
				? [
						`Person ${_id}: Die Zugehörigkeit ${_key} nennt die Abteilung noch als Text („${department}“).`,
					]
				: [],
		),
	);
}

/**
 * Checks the dataset after a real run: no legacy type left, every group under a department, no
 * department string left in an affiliation, every seeded department published with a card image.
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
	const departmentIds = new Set(departments.map(({ _id }) => _id));
	return [
		...legacyGroups.map(({ _id, _type }) => `Dokument ${_id} hat noch den alten Typ „${_type}“.`),
		...findGroupsWithoutDepartment(groups),
		...findDepartmentStrings(persons),
		...DEPARTMENT_SEEDS.filter(({ id }) => !departmentIds.has(id)).map(
			({ id }) => `Abteilung ${id} fehlt oder ist nicht veröffentlicht.`,
		),
		...departments
			.filter(({ cardImageAssetId }) => !cardImageAssetId)
			.map(({ _id }) => `Abteilung ${_id} hat kein Kachelbild.`),
	];
}

export { findGroupsWithoutDepartment, verifyMigration };
