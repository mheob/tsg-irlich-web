import type { Affiliation } from './build';
import { departmentIdOf } from './documents';
import { isRecord } from './references';
import { DEPARTMENT_SEEDS } from './seeds';
import type { GroupSummary, MigrationStore, PersonDocument } from './store';

const DRAFTS_PREFIX = 'drafts.';

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
 * The affiliations of a person that the checks can read: the objects of the list. The documents
 * come from the lake as they are, so a `null` entry or an `affiliations` field that is no list
 * must not stop the verification and lose its summary. `runMigration` reports such a person.
 *
 * @param person - A person.
 * @returns The entries that are objects, none when `affiliations` is no list.
 */
function readableAffiliations(person: PersonDocument): Affiliation[] {
	const { affiliations } = person;
	return Array.isArray(affiliations) ? affiliations.filter((entry) => isRecord(entry)) : [];
}

/**
 * Finds every affiliation that still names its department as a string.
 *
 * @param persons - Every person, published and draft.
 * @returns One German problem per affiliation.
 */
function findDepartmentStrings(persons: readonly PersonDocument[]): string[] {
	return persons.flatMap((person) =>
		readableAffiliations(person).flatMap(({ _key, department }) =>
			typeof department === 'string'
				? [
						`Person ${person._id}: Die Zugehörigkeit ${_key} nennt die Abteilung noch als Text („${department}“).`,
					]
				: [],
		),
	);
}

/**
 * Whether a reference resolves among the given ids. A weak reference may point at a document that
 * only exists as a draft.
 *
 * @param ids - The ids of every document of the expected type, published and draft.
 * @param id - The referenced, published id.
 * @returns `true` when the published document or its draft exists.
 */
function resolves(ids: ReadonlySet<string>, id: string): boolean {
	return ids.has(id) || ids.has(`${DRAFTS_PREFIX}${id}`);
}

/**
 * Finds every affiliation whose group or department reference points at a document of another
 * type, or at nothing, for instance at a legacy group the migration left behind.
 *
 * @param persons - Every person, published and draft.
 * @param targets - The ids of every group and every department.
 * @returns One German problem per wrong reference.
 */
function findWrongTargets(persons: readonly PersonDocument[], targets: ReferenceTargets): string[] {
	const problems: string[] = [];
	for (const person of persons) {
		const { _id } = person;
		for (const { _key, department, team } of readableAffiliations(person)) {
			if (team?._ref && !resolves(targets.groups, team._ref)) {
				problems.push(
					`Person ${_id}: Die Zugehörigkeit ${_key} verweist als Gruppe auf ${team._ref}, das keine Gruppe ist.`,
				);
			}
			if (
				typeof department === 'object' &&
				department !== null &&
				!resolves(targets.departments, department._ref)
			) {
				problems.push(
					`Person ${_id}: Die Zugehörigkeit ${_key} verweist als Abteilung auf ${department._ref}, das keine Abteilung ist.`,
				);
			}
		}
	}
	return problems;
}

/**
 * Checks the dataset after a real run: no legacy type left, every group under a department, no
 * department string left in an affiliation, every affiliation pointing at a group and a department,
 * every seeded department published with a card image.
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
		...findWrongTargets(persons, {
			departments: departmentIds,
			groups: new Set(groups.map(({ _id }) => _id)),
		}),
		...DEPARTMENT_SEEDS.filter(({ id }) => !departmentIds.has(id)).map(
			({ id }) => `Abteilung ${id} fehlt oder ist nicht veröffentlicht.`,
		),
		...departments
			.filter(({ cardImageAssetId }) => !cardImageAssetId)
			.map(({ _id }) => `Abteilung ${_id} hat kein Kachelbild.`),
	];
}

interface ReferenceTargets {
	departments: ReadonlySet<string>;
	groups: ReadonlySet<string>;
}

export { findGroupsWithoutDepartment, verifyMigration };
