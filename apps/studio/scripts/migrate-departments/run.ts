import { buildDepartmentDocument, migrateAffiliations, toGroupDocument } from './build';
import type { Affiliation, LegacyGroupDocument, StatsItem } from './build';
import {
	isOrphanedGroup,
	isPublished,
	isReleaseVersion,
	toNewGroupId,
	toPublishedId,
} from './documents';
import { collectPaths } from './paths';
import { isAffiliationList, referencesId, rewriteDocumentReferences } from './references';
import { ADMIN_LEGACY_TYPE, DEPARTMENT_SEEDS, SEED_BY_LEGACY_TYPE } from './seeds';
import type { DepartmentImages, DepartmentSeed } from './seeds';
import type {
	DepartmentSummary,
	DocumentStub,
	GroupSummary,
	MigrationStore,
	PersonDocument,
	RawDocument,
} from './store';
import { findGroupsWithoutDepartment } from './verify';

/** Stands in for an asset id in a dry run, which uploads nothing. */
const DRY_RUN_ASSET_PREFIX = 'probelauf-';
const IMAGE_FOLDER = 'scripts/migrate-departments/images';

const LEGACY_TYPE_PREFIX = 'group.';

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
 * The legacy groups the migration moves, each with its department: every `group.<x>` with a known
 * type. `group.admin` and unknown types have no department and stay out.
 *
 * @param legacyGroups - Every `group.<x>` document, published and draft.
 * @returns The groups with their seeds.
 */
function migratableGroups(legacyGroups: readonly LegacyGroupDocument[]): MigratableGroup[] {
	return legacyGroups.flatMap((group) => {
		const seed = SEED_BY_LEGACY_TYPE.get(group._type);
		return seed ? [{ group, seed }] : [];
	});
}

/**
 * Every release version once, by id.
 *
 * @param lists - Release versions from several reads.
 * @returns The versions, each once.
 */
function uniqueVersions(...lists: readonly (readonly DocumentStub[])[]): DocumentStub[] {
	const byId = new Map(lists.flat().map(({ _id, _type }) => [_id, { _id, _type }]));
	return [...byId.values()];
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
	const current = withoutReleaseVersions(legacyGroups);
	const newIdByLegacy = new Map(
		migratableGroups(current).map(({ group }) => [
			toPublishedId(group._id),
			toNewGroupId(toPublishedId(group._id)),
		]),
	);
	const referring =
		newIdByLegacy.size > 0 ? await store.fetchReferringDocuments([...newIdByLegacy.keys()]) : [];
	return {
		departments: withoutReleaseVersions(departments),
		groups: withoutReleaseVersions(groups),
		legacyGroups: current,
		newIdByLegacy,
		persons: withoutReleaseVersions(persons),
		referrers: withoutReleaseVersions(referring).filter(
			({ _type }) => !_type.startsWith(LEGACY_TYPE_PREFIX),
		),
		stats,
		versions: uniqueVersions(
			versions,
			referring.filter(({ _id }) => isReleaseVersion(_id)),
		),
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
 * Step 4: creates the `group` for every legacy group under its new id, the published ones first,
 * then the drafts. A group that exists already is left alone; an unknown legacy type is reported.
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 */
async function createGroups(run: MigrationRun, snapshot: Snapshot): Promise<void> {
	for (const { _id, _type } of snapshot.legacyGroups.filter(
		(group) => group._type !== ADMIN_LEGACY_TYPE && !SEED_BY_LEGACY_TYPE.has(group._type),
	)) {
		run.report.problems.push(`Unbekannter Gruppentyp „${_type}“ bei ${_id}: nicht umgestellt.`);
	}
	const existing = new Set(snapshot.groups.map(({ _id }) => _id));
	const migratable = migratableGroups(snapshot.legacyGroups);
	const ordered = [
		...migratable.filter(({ group }) => isPublished(group._id)),
		...migratable.filter(({ group }) => !isPublished(group._id)),
	];
	for (const { group, seed } of ordered.filter(
		(entry) => !existing.has(toNewGroupId(entry.group._id)),
	)) {
		if (!run.dryRun) {
			// oxlint-disable-next-line no-await-in-loop -- one write at a time
			await run.store.createOrReplace(toGroupDocument(group, seed.id));
		}
		run.report.groups += 1;
	}
}

/**
 * The affiliations of a person, when they have the shape the studio stores: every entry an object
 * with a `_key`.
 *
 * @param document - Any document.
 * @returns The affiliations, or `undefined` for another type or another shape.
 */
function affiliationsOf(document: Readonly<Record<string, unknown>>): Affiliation[] | undefined {
	const { _type, affiliations } = document;
	return _type === 'person' && isAffiliationList(affiliations) ? affiliations : undefined;
}

/**
 * Finds every department string the migration does not know in a person.
 *
 * @param document - The document after the migration.
 * @returns The problems, one per unknown department string.
 */
function findUnknownDepartments(document: Record<string, unknown>): string[] {
	return (affiliationsOf(document) ?? []).flatMap(({ _key, department }) =>
		typeof department === 'string'
			? [
					`Person ${String(document._id)}: unbekannte Abteilung „${department}“ in der Zugehörigkeit ${_key}, nicht umgestellt.`,
				]
			: [],
	);
}

/**
 * The top-level fields a migration changed. Unchanged parts keep their identity, so a comparison
 * by identity finds exactly the changed ones.
 *
 * @param before - The document as read.
 * @param after - The document after the migration.
 * @returns The changed fields with their new values.
 */
function changedFields(
	before: Readonly<Record<string, unknown>>,
	after: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
	return Object.fromEntries(Object.entries(after).filter(([key, value]) => before[key] !== value));
}

/**
 * Migrates one document in memory: the affiliations of a person, then every reference to a legacy
 * group, wherever it sits.
 *
 * @param document - The document as read.
 * @param newIdByLegacy - The new id per published legacy id.
 * @returns The document after the migration and what changed in it.
 */
function migrateDocument(
	document: RawDocument,
	newIdByLegacy: ReadonlyMap<string, string>,
): MigratedDocument {
	const affiliations = migrateAffiliations(affiliationsOf(document), DEPARTMENT_ID_BY_LEGACY);
	const withAffiliations = affiliations ? { ...document, affiliations } : document;
	const after = rewriteDocumentReferences(withAffiliations, newIdByLegacy);
	return {
		affiliationsMigrated: affiliations !== undefined,
		after,
		fields: changedFields(document, after),
		referencesRewritten: after !== withAffiliations,
	};
}

/**
 * Every document step 5 looks at: each person, and each document that references a legacy group.
 * A referrer is read whole, so it replaces the partial person of the same id.
 *
 * @param snapshot - The dataset before the run.
 * @returns The documents, each once.
 */
function collectCandidates(snapshot: Snapshot): RawDocument[] {
	const byId = new Map<string, RawDocument>();
	for (const document of [...snapshot.persons, ...snapshot.referrers]) {
		byId.set(document._id, document);
	}
	return [...byId.values()];
}

/**
 * Counts what a migrated document changes.
 *
 * @param report - The report of the run.
 * @param migrated - The migrated document.
 */
function countChanges(report: MigrationReport, migrated: MigratedDocument): void {
	report.persons += migrated.affiliationsMigrated ? 1 : 0;
	report.rewritten += migrated.referencesRewritten ? 1 : 0;
}

/**
 * Step 5: points every reference to a legacy group at its new id and turns the department strings
 * of every person into references, in one patch per document, `ifRevisionID` guarded. The
 * references keep every other attribute (`_key`, `_weak`, …).
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 * @returns Every patched document as it is after the patch, by id.
 */
async function rewriteDocuments(
	run: MigrationRun,
	snapshot: Snapshot,
): Promise<Map<string, Record<string, unknown>>> {
	const afterById = new Map<string, Record<string, unknown>>();
	for (const document of collectCandidates(snapshot)) {
		const migrated = migrateDocument(document, snapshot.newIdByLegacy);
		run.report.problems.push(...findUnknownDepartments(migrated.after));
		if (Object.keys(migrated.fields).length > 0) {
			if (!run.dryRun) {
				// oxlint-disable-next-line no-await-in-loop -- one patch at a time
				await run.store.patchDocument(document._id, document._rev, migrated.fields);
			}
			afterById.set(document._id, migrated.after);
		}
		countChanges(run.report, migrated);
	}
	return afterById;
}

/**
 * Who still points at a document once step 5 is through: every referrer, unless its patched
 * version no longer references the id. In a real run the patched documents are gone from the
 * referrers already; in a dry run the patched versions stand in for the patches.
 *
 * @param store - The Sanity side.
 * @param id - The published id of the document to delete.
 * @param afterById - The documents step 5 patched, as they are after the patch.
 * @returns The ids of the documents in the way of the deletion.
 */
async function findRemainingReferrers(
	store: MigrationStore,
	id: string,
	afterById: ReadonlyMap<string, Record<string, unknown>>,
): Promise<string[]> {
	const referrers = await store.fetchReferrers(id);
	return referrers
		.filter(({ _id }) => {
			const after = afterById.get(_id);
			return after === undefined || referencesId(after, id);
		})
		.map(({ _id }) => _id);
}

/**
 * Step 6: deletes the legacy `group.<x>` documents that moved to a new id, the drafts first, once
 * nothing references them any more.
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 * @param afterById - The documents step 5 patched, as they are after the patch.
 */
async function deleteLegacyGroups(
	run: MigrationRun,
	snapshot: Snapshot,
	afterById: ReadonlyMap<string, Record<string, unknown>>,
): Promise<void> {
	const moved = migratableGroups(snapshot.legacyGroups).map(({ group }) => group);
	const deleted = await deleteUnreferenced(
		run,
		[
			...moved.filter(({ _id }) => !isPublished(_id)),
			...moved.filter(({ _id }) => isPublished(_id)),
		],
		{
			describe: (id, referrers) =>
				`Die Gruppe ${id} (alter Typ) bleibt bestehen, weil noch ${referrers.join(', ')} auf sie verweist.`,
			referrersOf: async (id) => findRemainingReferrers(run.store, id, afterById),
		},
	);
	run.report.legacyDeleted = deleted.size;
}

/**
 * Step 7: deletes the administration groups, published and draft, once no person points at them.
 *
 * @param run - The store, the mode and the report.
 * @param legacyGroups - Every `group.<x>` document, published and draft.
 * @param afterById - The documents step 5 patched, as they are after the patch.
 */
async function deleteAdminGroups(
	run: MigrationRun,
	legacyGroups: readonly LegacyGroupDocument[],
	afterById: ReadonlyMap<string, Record<string, unknown>>,
): Promise<void> {
	const deleted = await deleteUnreferenced(
		run,
		legacyGroups.filter(({ _type }) => _type === ADMIN_LEGACY_TYPE),
		{
			describe: (id, referrers) =>
				`Die Administration-Gruppe ${id} bleibt bestehen, weil noch ${referrers.join(', ')} auf sie verweist.`,
			referrersOf: async (id) => findRemainingReferrers(run.store, id, afterById),
		},
	);
	run.report.deleted = deleted.size;
}

/**
 * Step 8: removes the shared stats from the groups page, now that every department has a copy.
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
 * Runs the eight steps in their order.
 *
 * @param run - The store, the mode and the report.
 * @param snapshot - The dataset before the run.
 * @returns The `group` documents of the snapshot that are left after the run.
 */
async function runSteps(run: MigrationRun, snapshot: Snapshot): Promise<GroupSummary[]> {
	await createDepartments(run, snapshot);
	const deletedGroups = await deleteOrphanedGroups(run, snapshot.groups);
	await createGroups(run, snapshot);
	const afterById = await rewriteDocuments(run, snapshot);
	await deleteLegacyGroups(run, snapshot, afterById);
	await deleteAdminGroups(run, snapshot.legacyGroups, afterById);
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
			legacyDeleted: 0,
			orphanedGroups: 0,
			paths: [],
			persons: 0,
			problems: describeReleaseVersions(snapshot.versions),
			rewritten: 0,
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
		`  Gruppen unter neuer ID angelegt: ${report.groups}`,
		`  Dokumente mit umgeschriebenen Verweisen: ${report.rewritten}`,
		`  Personen angepasst: ${report.persons}`,
		`  Gruppen des alten Typs gelöscht: ${report.legacyDeleted}`,
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
	/** The new id per published id of every legacy group the migration moves. */
	newIdByLegacy: ReadonlyMap<string, string>;
	persons: PersonDocument[];
	/** Every document that references a legacy group the migration moves, without the legacy groups. */
	referrers: RawDocument[];
	stats: StatsItem[] | null;
	/** The release versions the migration leaves alone: of its own types, or referencing a legacy group. */
	versions: DocumentStub[];
}

interface MigratableGroup {
	group: LegacyGroupDocument;
	seed: DepartmentSeed;
}

interface MigratedDocument {
	after: Record<string, unknown>;
	affiliationsMigrated: boolean;
	/** The changed top-level fields, the payload of the patch. */
	fields: Record<string, unknown>;
	referencesRewritten: boolean;
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
	/** `group` documents created under the new ids, published and draft. */
	groups: number;
	/** Legacy `group.<x>` documents deleted after the move, published and draft. */
	legacyDeleted: number;
	/** `group` documents left from the 2024 schema that were deleted, published and draft. */
	orphanedGroups: number;
	/** The pages of every published department and group after the run. */
	paths: string[];
	/** Persons whose affiliations were migrated, published and draft. */
	persons: number;
	problems: string[];
	/** Documents whose references to legacy groups were rewritten, published and draft. */
	rewritten: number;
}

export { runMigration, summarize };
export type { MigrationReport };
