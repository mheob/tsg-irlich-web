import { buildDepartmentDocument, migrateAffiliations, toGroupDocument } from './build';
import type { Affiliation, LegacyGroupDocument, StatsItem } from './build';
import { isOrphanedGroup, isReleaseVersion, toPublishedId } from './documents';
import { collectPaths } from './paths';
import { ADMIN_LEGACY_TYPE, DEPARTMENT_SEEDS, SEED_BY_LEGACY_TYPE } from './seeds';
import type { DepartmentImages, DepartmentSeed } from './seeds';
import type {
	DepartmentSummary,
	DocumentStub,
	GroupSummary,
	MigrationStore,
	PersonDocument,
} from './store';
import { findGroupsWithoutDepartment } from './verify';

/** Stands in for an asset id in a dry run, which uploads nothing. */
const DRY_RUN_ASSET_PREFIX = 'probelauf-';
const IMAGE_FOLDER = 'scripts/migrate-departments/images';

const DEPARTMENT_ID_BY_LEGACY: ReadonlyMap<string, string> = new Map(
	DEPARTMENT_SEEDS.map((seed) => [seed.legacyAffiliation, seed.id]),
);

/**
 * Leaves out the versions in content releases, which the migration does not touch.
 *
 * @param documents - Documents of the raw perspective.
 * @returns The published documents and the drafts.
 */
function withoutReleaseVersions<Document extends { _id: string }>(
	documents: readonly Document[],
): Document[] {
	return documents.filter(({ _id }) => !isReleaseVersion(_id));
}

/**
 * Reads everything the migration decides on, before anything is written. Release versions are kept
 * apart: the migration reports them instead of touching them.
 *
 * @param store - The Sanity side.
 * @returns The dataset as it is now.
 */
async function readSnapshot(store: MigrationStore): Promise<Snapshot> {
	const [departments, groups, legacyGroups, persons, stats, versions] = await Promise.all([
		store.fetchDepartments(),
		store.fetchGroups(),
		store.fetchLegacyGroups(),
		store.fetchPersons(),
		store.fetchGroupsPageStats(),
		store.fetchReleaseVersions(),
	]);
	return {
		departments: withoutReleaseVersions(departments),
		groups: withoutReleaseVersions(groups),
		legacyGroups: withoutReleaseVersions(legacyGroups),
		persons: withoutReleaseVersions(persons),
		stats,
		versions,
	};
}

/**
 * One problem per release version: the migration cannot change a release, and publishing it
 * afterwards would bring back the old shape.
 *
 * @param versions - The release versions of the types the migration touches.
 * @returns The problems.
 */
function describeReleaseVersions(versions: readonly DocumentStub[]): string[] {
	return versions.map(
		({ _id, _type }) =>
			`Version ${_id} („${_type}“) liegt in einem Release und wird nicht migriert. Den Release vorher veröffentlichen oder verwerfen.`,
	);
}

/**
 * Uploads one image, or in a dry run checks that the file is there and returns a placeholder.
 *
 * @param run - The store, the mode and the report.
 * @param fileName - The file in the image folder.
 * @returns The asset id, or the placeholder.
 */
async function uploadImage(run: MigrationRun, fileName: string): Promise<string> {
	if (!run.dryRun) {
		return run.store.uploadImage(fileName);
	}
	if (!(await run.store.hasImage(fileName))) {
		run.report.problems.push(`Das Bild ${fileName} fehlt in ${IMAGE_FOLDER}.`);
	}
	return `${DRY_RUN_ASSET_PREFIX}${fileName}`;
}

/**
 * Step 1: uploads the images of the departments that are missing. A dry run uploads nothing.
 *
 * @param run - The store, the mode and the report.
 * @param seeds - The departments to create.
 * @returns Every department with the asset ids of its images.
 */
async function uploadImages(
	run: MigrationRun,
	seeds: readonly DepartmentSeed[],
): Promise<{ assetIds: DepartmentImages; seed: DepartmentSeed }[]> {
	const uploaded: { assetIds: DepartmentImages; seed: DepartmentSeed }[] = [];
	for (const seed of seeds) {
		// oxlint-disable-next-line no-await-in-loop -- one upload at a time keeps the failure point obvious
		const card = await uploadImage(run, seed.images.card);
		// oxlint-disable-next-line no-await-in-loop -- see above
		const hero = await uploadImage(run, seed.images.hero);
		// oxlint-disable-next-line no-await-in-loop -- see above
		const openGraph = await uploadImage(run, seed.images.openGraph);
		uploaded.push({ assetIds: { card, hero, openGraph }, seed });
	}
	return uploaded;
}

/**
 * Reads today's contact persons once per role email.
 *
 * @param store - The Sanity side.
 * @param seeds - The departments to create.
 * @returns The person ids per email.
 */
async function fetchContactPersons(
	store: MigrationStore,
	seeds: readonly DepartmentSeed[],
): Promise<Map<string, string[]>> {
	const emails = [...new Set(seeds.map((seed) => seed.contactEmail))];
	const ids = await Promise.all(emails.map(async (email) => store.fetchContactPersonIds(email)));
	return new Map(emails.map((email, index) => [email, ids[index] ?? []]));
}

/**
 * Steps 1 and 2: creates every department that does not exist yet. An existing one is left alone,
 * so a rerun neither uploads again nor overwrites what the editors changed since.
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 */
async function createDepartments(run: MigrationRun, snapshot: Snapshot): Promise<void> {
	const existing = new Set(snapshot.departments.map((department) => department._id));
	const missing = DEPARTMENT_SEEDS.filter((seed) => !existing.has(seed.id));
	const uploaded = await uploadImages(run, missing);
	const contactPersons = await fetchContactPersons(run.store, missing);
	for (const { assetIds, seed } of uploaded) {
		const document = buildDepartmentDocument(
			seed,
			assetIds,
			snapshot.stats ?? [],
			contactPersons.get(seed.contactEmail) ?? [],
		);
		if (!run.dryRun) {
			// oxlint-disable-next-line no-await-in-loop -- one write at a time
			await run.store.createOrReplace(document);
		}
		run.report.departments += 1;
	}
}

/**
 * Finds the documents that something still references once the run is through, and reports each.
 *
 * @param run - The store and the report.
 * @param publishedIds - The published ids to delete.
 * @param guard - Who still references an id, and how to report it.
 * @returns The published ids that must not be deleted.
 */
async function findReferenced(
	run: MigrationRun,
	publishedIds: readonly string[],
	guard: DeletionGuard,
): Promise<Set<string>> {
	const referenced = new Set<string>();
	for (const id of publishedIds) {
		// oxlint-disable-next-line no-await-in-loop -- one query per document
		const referrers = await guard.referrersOf(id);
		if (referrers.length > 0) {
			referenced.add(id);
			run.report.problems.push(guard.describe(id, referrers));
		}
	}
	return referenced;
}

/**
 * Deletes documents, published and draft, unless something still references them. A referenced
 * one stays, with a problem, so a deletion cannot fail halfway.
 *
 * @param run - The store, the mode and the report.
 * @param documents - The documents to delete.
 * @param guard - Who still references an id, and how to report it.
 * @returns The ids deleted, or in a dry run the ids a real run would delete.
 */
async function deleteUnreferenced(
	run: MigrationRun,
	documents: readonly { _id: string }[],
	guard: DeletionGuard,
): Promise<Set<string>> {
	const publishedIds = [...new Set(documents.map(({ _id }) => toPublishedId(_id)))];
	const referenced = await findReferenced(run, publishedIds, guard);
	const deleted = new Set<string>();
	for (const { _id } of documents.filter(
		(document) => !referenced.has(toPublishedId(document._id)),
	)) {
		if (!run.dryRun) {
			// oxlint-disable-next-line no-await-in-loop -- one deletion at a time
			await run.store.deleteDocument(_id);
		}
		deleted.add(_id);
	}
	return deleted;
}

/**
 * Step 3: deletes the `group` documents left from the 2024 schema (see `isOrphanedGroup`). They
 * have no department to go to, and no page on the website.
 *
 * @param run - The store, the mode and the report.
 * @param groups - Every `group`, published and draft.
 * @returns The ids of the deleted groups.
 */
async function deleteOrphanedGroups(
	run: MigrationRun,
	groups: readonly GroupSummary[],
): Promise<Set<string>> {
	const deleted = await deleteUnreferenced(
		run,
		groups.filter((group) => isOrphanedGroup(group)),
		{
			describe: (id, referrers) =>
				`Die alte Gruppe ${id} ohne Abteilungsverweis bleibt bestehen, weil noch ${referrers.join(', ')} auf sie verweist.`,
			referrersOf: async (id) => {
				const referrers = await run.store.fetchReferrers(id);
				return referrers.map(({ _id }) => _id);
			},
		},
	);
	run.report.orphanedGroups = deleted.size;
	return deleted;
}

/**
 * Step 4: swaps every legacy group except the administration for a `group` with the same id.
 *
 * @param run - The store, the mode and the report.
 * @param legacyGroups - Every `group.<x>` document, published and draft.
 */
async function swapGroups(
	run: MigrationRun,
	legacyGroups: readonly LegacyGroupDocument[],
): Promise<void> {
	for (const group of legacyGroups.filter(({ _type }) => _type !== ADMIN_LEGACY_TYPE)) {
		const seed = SEED_BY_LEGACY_TYPE.get(group._type);
		if (seed) {
			if (!run.dryRun) {
				// oxlint-disable-next-line no-await-in-loop -- one transaction at a time
				await run.store.swapType(group._id, toGroupDocument(group, seed.id));
			}
			run.report.groups += 1;
		} else {
			run.report.problems.push(
				`Unbekannter Gruppentyp „${group._type}“ bei ${group._id}: nicht umgestellt.`,
			);
		}
	}
}

/**
 * Notes which groups a person points at after the migration, and finds every department string the
 * migration does not know.
 *
 * @param person - The person.
 * @param affiliations - Its affiliations after the migration.
 * @param personsByTeam - The persons per group, which this adds the person to.
 * @returns The problems, one per unknown department string.
 */
function inspectAffiliations(
	person: PersonDocument,
	affiliations: readonly Affiliation[],
	personsByTeam: Map<string, string[]>,
): string[] {
	const problems: string[] = [];
	for (const affiliation of affiliations) {
		const teamId = affiliation.team?._ref;
		if (teamId) {
			personsByTeam.set(teamId, [...(personsByTeam.get(teamId) ?? []), person._id]);
		}
		if (typeof affiliation.department === 'string') {
			problems.push(
				`Person ${person._id}: unbekannte Abteilung „${affiliation.department}“ in der Zugehörigkeit ${affiliation._key}, nicht umgestellt.`,
			);
		}
	}
	return problems;
}

/**
 * Step 5: turns the department strings of every person into references, `ifRevisionID` guarded.
 *
 * @param run - The store, the mode and the report.
 * @param persons - Every person, published and draft.
 * @returns The ids of the persons that still point at a group after the migration, per group.
 */
async function patchPersons(
	run: MigrationRun,
	persons: readonly PersonDocument[],
): Promise<Map<string, string[]>> {
	const personsByTeam = new Map<string, string[]>();
	for (const person of persons) {
		const migrated = migrateAffiliations(person.affiliations, DEPARTMENT_ID_BY_LEGACY);
		run.report.problems.push(
			...inspectAffiliations(person, migrated ?? person.affiliations ?? [], personsByTeam),
		);
		if (migrated) {
			if (!run.dryRun) {
				// oxlint-disable-next-line no-await-in-loop -- one patch at a time
				await run.store.patchAffiliations(person._id, person._rev, migrated);
			}
			run.report.persons += 1;
		}
	}
	return personsByTeam;
}

/**
 * Who still points at an administration group once the persons are migrated: the persons that
 * kept it as their group, and every other document that references it.
 *
 * @param store - The Sanity side.
 * @param id - The published id of the administration group.
 * @param personsByTeam - The persons per group after the migration.
 * @returns The ids of the documents in the way of the deletion.
 */
async function findRemainingReferrers(
	store: MigrationStore,
	id: string,
	personsByTeam: ReadonlyMap<string, string[]>,
): Promise<string[]> {
	const referrers = await store.fetchReferrers(id);
	const others = referrers.filter(({ _type }) => _type !== 'person').map(({ _id }) => _id);
	return [...new Set([...(personsByTeam.get(id) ?? []), ...others])];
}

/**
 * Step 6: deletes the administration groups, published and draft, once no person points at them.
 *
 * @param run - The store, the mode and the report.
 * @param legacyGroups - Every `group.<x>` document, published and draft.
 * @param personsByTeam - The persons per group after the migration.
 */
async function deleteAdminGroups(
	run: MigrationRun,
	legacyGroups: readonly LegacyGroupDocument[],
	personsByTeam: ReadonlyMap<string, string[]>,
): Promise<void> {
	const deleted = await deleteUnreferenced(
		run,
		legacyGroups.filter(({ _type }) => _type === ADMIN_LEGACY_TYPE),
		{
			describe: (id, referrers) =>
				`Die Administration-Gruppe ${id} bleibt bestehen, weil noch ${referrers.join(', ')} auf sie verweist.`,
			referrersOf: async (id) => findRemainingReferrers(run.store, id, personsByTeam),
		},
	);
	run.report.deleted = deleted.size;
}

/**
 * Step 7: removes the shared stats from the groups page, now that every department has a copy.
 *
 * @param run - The store and the mode.
 * @param stats - The stats of the groups page, `null` when they are gone already.
 */
async function removeGroupsPageStats(
	run: MigrationRun,
	stats: readonly StatsItem[] | null,
): Promise<void> {
	if (stats && !run.dryRun) {
		await run.store.unsetGroupsPageStats();
	}
}

/**
 * Runs the seven steps in their order.
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 * @returns The `group` documents of the snapshot that are left after the run.
 */
async function runSteps(run: MigrationRun, snapshot: Snapshot): Promise<GroupSummary[]> {
	await createDepartments(run, snapshot);
	const deletedGroups = await deleteOrphanedGroups(run, snapshot.groups);
	await swapGroups(run, snapshot.legacyGroups);
	const personsByTeam = await patchPersons(run, snapshot.persons);
	await deleteAdminGroups(run, snapshot.legacyGroups, personsByTeam);
	await removeGroupsPageStats(run, snapshot.stats);
	return snapshot.groups.filter(({ _id }) => !deletedGroups.has(_id));
}

/**
 * Migrates the dataset from the `group.<x>` types and the hard-coded departments to `department`
 * documents and one `group` type. Every step is idempotent: a rerun writes nothing. A dry run reads
 * everything and counts every write, but calls no write method of the store.
 *
 * @param store - The Sanity side.
 * @param options - Whether this is a dry run.
 * @returns The counts, the paths after the run and the problems found on the way.
 */
async function runMigration(
	store: MigrationStore,
	options: { dryRun: boolean },
): Promise<MigrationReport> {
	const snapshot = await readSnapshot(store);
	const run: MigrationRun = {
		dryRun: options.dryRun,
		report: {
			deleted: 0,
			departments: 0,
			groups: 0,
			orphanedGroups: 0,
			paths: [],
			persons: 0,
			problems: describeReleaseVersions(snapshot.versions),
		},
		store,
	};
	const groups = await runSteps(run, snapshot);
	run.report.problems.push(...findGroupsWithoutDepartment(groups));
	run.report.paths = collectPaths({ ...snapshot, groups }, run.report.problems);
	return run.report;
}

/**
 * The closing lines of a run, in German.
 *
 * @param report - The report of the run.
 * @param problems - The problems of the run and, after a real run, of the verification.
 * @param dryRun - Whether it was a dry run.
 * @returns The counts, the paths and the problems.
 */
function summarize(
	report: MigrationReport,
	problems: readonly string[],
	dryRun: boolean,
): string[] {
	return [
		dryRun ? 'Probelauf, geschrieben wurde nichts. Ein echter Lauf würde:' : 'Geschrieben:',
		`  Abteilungen angelegt: ${report.departments}`,
		`  Alte Gruppen ohne Abteilungsverweis gelöscht: ${report.orphanedGroups}`,
		`  Gruppen umgestellt: ${report.groups}`,
		`  Personen angepasst: ${report.persons}`,
		`  Administration-Gruppen gelöscht: ${report.deleted}`,
		`Pfade nach der Migration (${report.paths.length}):`,
		...report.paths,
		problems.length > 0 ? `Probleme (${problems.length}):` : 'Keine Probleme.',
		...problems.map((problem) => `  ${problem}`),
	];
}

interface Snapshot {
	departments: DepartmentSummary[];
	groups: GroupSummary[];
	legacyGroups: LegacyGroupDocument[];
	persons: PersonDocument[];
	stats: StatsItem[] | null;
	/** The release versions of the types the migration touches, which it leaves alone. */
	versions: DocumentStub[];
}

interface DeletionGuard {
	/** The problem to report for a document that something still references. */
	describe: (id: string, referrers: readonly string[]) => string;
	/** The ids of the documents that point at a published id once the run is through. */
	referrersOf: (id: string) => Promise<string[]>;
}

interface MigrationRun {
	dryRun: boolean;
	report: MigrationReport;
	store: MigrationStore;
}

interface MigrationReport {
	/** Administration groups deleted, published and draft. */
	deleted: number;
	/** Departments created. */
	departments: number;
	/** Legacy groups swapped for a `group`, published and draft. */
	groups: number;
	/** `group` documents left from the 2024 schema that were deleted, published and draft. */
	orphanedGroups: number;
	/** The pages of every published department and group after the run. */
	paths: string[];
	/** Persons whose affiliations were migrated, published and draft. */
	persons: number;
	problems: string[];
}

export { runMigration, summarize };
export type { MigrationReport };
