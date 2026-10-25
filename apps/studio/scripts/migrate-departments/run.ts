import { buildDepartmentDocument, migrateAffiliations, toGroupDocument } from './build';
import type { Affiliation, LegacyGroupDocument, StatsItem } from './build';
import { ADMIN_LEGACY_TYPE, DEPARTMENT_SEEDS } from './seeds';
import type { DepartmentImages, DepartmentSeed } from './seeds';
import type { DepartmentSummary, GroupSummary, MigrationStore, PersonDocument } from './store';
import { findGroupsWithoutDepartment } from './verify';

const DRAFTS_PREFIX = 'drafts.';
const OFFER_PATH = '/angebot';
/** Stands in for an asset id in a dry run, which uploads nothing. */
const DRY_RUN_ASSET_PREFIX = 'probelauf-';

const SEED_BY_LEGACY_TYPE: ReadonlyMap<string, DepartmentSeed> = new Map(
	DEPARTMENT_SEEDS.map((seed) => [seed.legacyType, seed]),
);
const DEPARTMENT_ID_BY_LEGACY: ReadonlyMap<string, string> = new Map(
	DEPARTMENT_SEEDS.map((seed) => [seed.legacyAffiliation, seed.id]),
);

/**
 * Whether an id is the published one, not a draft.
 *
 * @param id - The document id.
 * @returns `false` for `drafts.<id>`.
 */
function isPublished(id: string): boolean {
	return !id.startsWith(DRAFTS_PREFIX);
}

/**
 * The published id behind a draft id.
 *
 * @param id - A published or draft id.
 * @returns The published id.
 */
function toPublishedId(id: string): string {
	return isPublished(id) ? id : id.slice(DRAFTS_PREFIX.length);
}

/**
 * Reads everything the migration decides on, before anything is written.
 *
 * @param store - The Sanity side.
 * @returns The dataset as it is now.
 */
async function readSnapshot(store: MigrationStore): Promise<Snapshot> {
	const [departments, groups, legacyGroups, persons, stats] = await Promise.all([
		store.fetchDepartments(),
		store.fetchGroups(),
		store.fetchLegacyGroups(),
		store.fetchPersons(),
		store.fetchGroupsPageStats(),
	]);
	return { departments, groups, legacyGroups, persons, stats };
}

/**
 * Step 1: uploads the images of the departments that are missing. A dry run uploads nothing and
 * uses placeholders.
 *
 * @param run - The store, the mode and the report.
 * @param seeds - The departments to create.
 * @returns Every department with the asset ids of its images.
 */
async function uploadImages(
	run: MigrationRun,
	seeds: readonly DepartmentSeed[],
): Promise<{ assetIds: DepartmentImages; seed: DepartmentSeed }[]> {
	const upload = async (fileName: string): Promise<string> =>
		run.dryRun ? `${DRY_RUN_ASSET_PREFIX}${fileName}` : run.store.uploadImage(fileName);
	const uploaded: { assetIds: DepartmentImages; seed: DepartmentSeed }[] = [];
	for (const seed of seeds) {
		// oxlint-disable-next-line no-await-in-loop -- one upload at a time keeps the failure point obvious
		const card = await upload(seed.images.card);
		// oxlint-disable-next-line no-await-in-loop -- see above
		const hero = await upload(seed.images.hero);
		// oxlint-disable-next-line no-await-in-loop -- see above
		const openGraph = await upload(seed.images.openGraph);
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
 * Step 3: swaps every legacy group except the administration for a `group` with the same id.
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
 * Step 4: turns the department strings of every person into references, `ifRevisionID` guarded.
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
 * Finds the administration groups that are still referenced once the persons are migrated, and
 * reports each of them.
 *
 * @param run - The store and the report.
 * @param publishedIds - The published ids of the administration groups.
 * @param personsByTeam - The persons per group after the migration.
 * @returns The published ids that must not be deleted.
 */
async function findBlockedAdminGroups(
	run: MigrationRun,
	publishedIds: readonly string[],
	personsByTeam: ReadonlyMap<string, string[]>,
): Promise<Set<string>> {
	const blocked = new Set<string>();
	for (const id of publishedIds) {
		// oxlint-disable-next-line no-await-in-loop -- one query per administration group
		const referrers = await findRemainingReferrers(run.store, id, personsByTeam);
		if (referrers.length > 0) {
			blocked.add(id);
			run.report.problems.push(
				`Die Administration-Gruppe ${id} bleibt bestehen, weil noch ${referrers.join(', ')} auf sie verweist.`,
			);
		}
	}
	return blocked;
}

/**
 * Step 5: deletes the administration groups, published and draft. One that is still referenced
 * stays, with a problem, so the deletion cannot fail halfway.
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
	const adminGroups = legacyGroups.filter(({ _type }) => _type === ADMIN_LEGACY_TYPE);
	const publishedIds = [...new Set(adminGroups.map(({ _id }) => toPublishedId(_id)))];
	const blocked = await findBlockedAdminGroups(run, publishedIds, personsByTeam);
	for (const group of adminGroups.filter(({ _id }) => !blocked.has(toPublishedId(_id)))) {
		if (!run.dryRun) {
			// oxlint-disable-next-line no-await-in-loop -- one deletion at a time
			await run.store.deleteDocument(group._id);
		}
		run.report.deleted += 1;
	}
}

/**
 * Step 6: removes the shared stats from the groups page, now that every department has a copy.
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
 * The published departments once the run is through: the existing ones and the ones it creates.
 *
 * @param snapshot - The dataset before the run.
 * @param problems - Where a department without slug is reported.
 * @returns The departments by sort order.
 */
function departmentsAfter(snapshot: Snapshot, problems: string[]): PathDepartment[] {
	const existing = snapshot.departments.filter(({ _id }) => isPublished(_id));
	const existingIds = new Set(existing.map(({ _id }) => _id));
	const created = DEPARTMENT_SEEDS.filter(({ id }) => !existingIds.has(id));
	const departments: PathDepartment[] = created.map(({ id, slug, sortOrder }) => ({
		id,
		slug,
		sortOrder,
	}));
	for (const department of existing) {
		if (department.slug) {
			departments.push({
				id: department._id,
				slug: department.slug,
				sortOrder: department.sortOrder ?? Number.MAX_SAFE_INTEGER,
			});
		} else {
			problems.push(`Abteilung ${department._id} hat keinen Slug und bekommt keinen Pfad.`);
		}
	}
	return departments.toSorted(
		(first, second) => first.sortOrder - second.sortOrder || first.slug.localeCompare(second.slug),
	);
}

/**
 * The published groups once the run is through: the swapped legacy groups and the existing
 * `group` documents with a department.
 *
 * @param snapshot - The dataset before the run.
 * @returns The groups.
 */
function groupsAfter(snapshot: Snapshot): GroupSummary[] {
	const swapped = snapshot.legacyGroups
		.filter(({ _id, _type }) => isPublished(_id) && SEED_BY_LEGACY_TYPE.has(_type))
		.map((group) => ({
			_id: group._id,
			departmentId: SEED_BY_LEGACY_TYPE.get(group._type)?.id,
			slug: group.slug?.current,
			title: group.title,
		}));
	const existing = snapshot.groups.filter(
		({ _id, departmentId }) => isPublished(_id) && departmentId,
	);
	return [...swapped, ...existing];
}

/**
 * The paths of the group pages of one department, by slug.
 *
 * @param department - The department.
 * @param groups - Every published group after the run.
 * @param problems - Where a group without slug is reported.
 * @returns The paths.
 */
function groupPathsOf(
	department: PathDepartment,
	groups: readonly GroupSummary[],
	problems: string[],
): string[] {
	const slugs: string[] = [];
	for (const group of groups.filter(({ departmentId }) => departmentId === department.id)) {
		if (group.slug) {
			slugs.push(group.slug);
		} else {
			problems.push(
				`Gruppe ${group._id} („${group.title ?? ''}“) hat keinen Slug und bekommt keinen Pfad.`,
			);
		}
	}
	return slugs
		.toSorted((first, second) => first.localeCompare(second))
		.map((slug) => `${OFFER_PATH}/${department.slug}/${slug}`);
}

/**
 * Every page the website serves for a department or a group after the run, which is every page it
 * served before.
 *
 * @param snapshot - The dataset before the run.
 * @param problems - Where a document without path is reported.
 * @returns `/angebot/<department>` and `/angebot/<department>/<group>`, department by department.
 */
function collectPaths(snapshot: Snapshot, problems: string[]): string[] {
	const departments = departmentsAfter(snapshot, problems);
	const groups = groupsAfter(snapshot);
	const departmentIds = new Set(departments.map(({ id }) => id));
	for (const group of groups.filter(({ departmentId }) => !departmentIds.has(departmentId ?? ''))) {
		problems.push(
			`Gruppe ${group._id} verweist auf die Abteilung ${group.departmentId ?? ''}, die es nicht gibt.`,
		);
	}
	const paths: string[] = [];
	for (const department of departments) {
		paths.push(`${OFFER_PATH}/${department.slug}`, ...groupPathsOf(department, groups, problems));
	}
	return paths;
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
		report: { deleted: 0, departments: 0, groups: 0, paths: [], persons: 0, problems: [] },
		store,
	};
	await createDepartments(run, snapshot);
	await swapGroups(run, snapshot.legacyGroups);
	const personsByTeam = await patchPersons(run, snapshot.persons);
	await deleteAdminGroups(run, snapshot.legacyGroups, personsByTeam);
	await removeGroupsPageStats(run, snapshot.stats);
	run.report.problems.push(...findGroupsWithoutDepartment(snapshot.groups));
	run.report.paths = collectPaths(snapshot, run.report.problems);
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
}

interface PathDepartment {
	id: string;
	slug: string;
	sortOrder: number;
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
	/** The pages of every published department and group after the run. */
	paths: string[];
	/** Persons whose affiliations were migrated, published and draft. */
	persons: number;
	problems: string[];
}

export { runMigration, summarize };
export type { MigrationReport };
