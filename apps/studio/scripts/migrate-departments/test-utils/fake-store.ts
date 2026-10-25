// oxlint-disable typescript/require-await -- an in-memory dataset answers at once behind the async store interface
import { vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

import type { Affiliation, StatsItem } from '../build';
import type { GroupSummary, MigrationStore, NewDocument } from '../store';

/** Any document of the in-memory dataset. */
interface FakeDocument {
	[field: string]: unknown;
	_id: string;
	_rev?: string;
	_type: string;
}

/** A store whose every method is a typed spy over an in-memory dataset. */
type FakeStore = { [Method in keyof MigrationStore]: Mock<MigrationStore[Method]> };

/** The store methods that write. A dry run must not reach a single one of them. */
const WRITE_METHODS = [
	'createOrReplace',
	'deleteDocument',
	'patchAffiliations',
	'swapType',
	'unsetGroupsPageStats',
	'uploadImage',
] as const satisfies readonly (keyof MigrationStore)[];

/** The types whose release versions the migration reports, like the store's query. */
const MIGRATED_TYPES = /^(?:department|group|groupsPage|person|group\..+)$/u;

interface Reference {
	_ref?: string;
}

/**
 * The id a reference points at, like GROQ's `field._ref`.
 *
 * @param value - Whatever the field holds: a reference, a legacy string or nothing.
 * @returns The id, or `null` when the value is no reference.
 */
function refOf(value: unknown): string | null {
	return typeof value === 'object' && value !== null ? ((value as Reference)._ref ?? null) : null;
}

/**
 * Whether a document references an id anywhere, like GROQ's `references()`.
 *
 * @param document - The document.
 * @param id - The referenced id.
 * @returns `true` when a `_ref` somewhere in it is the id.
 */
function referencesId(document: FakeDocument, id: string): boolean {
	return JSON.stringify(document).includes(`"_ref":"${id}"`);
}

/**
 * An in-memory dataset behind the migration store. Reads return copies, writes change the dataset,
 * and the revision changes with every write, so `ifRevisionID` can be checked.
 *
 * @param documents - The documents the dataset starts with.
 * @param contactPersonIds - The person ids per role email.
 * @param missingImages - The image files the folder lacks; every other one is there.
 * @returns The store and the dataset.
 */
function createFakeStore(
	documents: readonly FakeDocument[],
	contactPersonIds: Readonly<Record<string, string[]>> = {},
	missingImages: readonly string[] = [],
): { lake: Map<string, FakeDocument>; store: FakeStore } {
	const lake = new Map(documents.map((document) => [document._id, structuredClone(document)]));
	let revision = 0;
	const write = (document: FakeDocument | NewDocument): void => {
		revision += 1;
		lake.set(document._id, { ...structuredClone(document), _rev: `rev-${revision}` });
	};
	const all = (): FakeDocument[] => [...lake.values()].map((document) => structuredClone(document));
	const ofType = (type: string): FakeDocument[] => all().filter(({ _type }) => _type === type);

	const store: FakeStore = {
		createOrReplace: vi.fn<MigrationStore['createOrReplace']>(async (document) => {
			write(document);
		}),
		deleteDocument: vi.fn<MigrationStore['deleteDocument']>(async (id) => {
			lake.delete(id);
		}),
		fetchContactPersonIds: vi.fn<MigrationStore['fetchContactPersonIds']>(
			async (email) => contactPersonIds[email] ?? [],
		),
		fetchDepartments: vi.fn<MigrationStore['fetchDepartments']>(async () =>
			ofType('department').map((department) => ({
				_id: department._id,
				cardImageAssetId: refOf((department.cardImage as { asset?: unknown } | undefined)?.asset),
				slug: (department.slug as { current?: string } | undefined)?.current ?? null,
				sortOrder: (department.sortOrder as number | undefined) ?? null,
			})),
		),
		fetchGroups: vi.fn<MigrationStore['fetchGroups']>(async () =>
			ofType('group').map((group) => ({
				_id: group._id,
				department: group.department as GroupSummary['department'],
				isSportGroup: (group.isSportGroup as boolean | undefined) ?? null,
				slug: (group.slug as { current?: string } | undefined)?.current ?? null,
				title: (group.title as string | undefined) ?? null,
			})),
		),
		fetchGroupsPageStats: vi.fn<MigrationStore['fetchGroupsPageStats']>(
			async () =>
				(lake.get('groupsPage')?.content as { stats?: StatsItem[] } | undefined)?.stats ?? null,
		),
		fetchLegacyGroups: vi.fn<MigrationStore['fetchLegacyGroups']>(async () =>
			all().filter(({ _type }) => _type.startsWith('group.')),
		),
		fetchPersons: vi.fn<MigrationStore['fetchPersons']>(async () =>
			ofType('person').map(({ _id, _rev, affiliations }) => ({
				_id,
				_rev: _rev ?? 'rev-0',
				affiliations: affiliations as Affiliation[] | undefined,
			})),
		),
		fetchReferrers: vi.fn<MigrationStore['fetchReferrers']>(async (id) =>
			all()
				.filter((document) => referencesId(document, id))
				.map(({ _id, _type }) => ({ _id, _type })),
		),
		fetchReleaseVersions: vi.fn<MigrationStore['fetchReleaseVersions']>(async () =>
			all()
				.filter(({ _id, _type }) => _id.startsWith('versions.') && MIGRATED_TYPES.test(_type))
				.map(({ _id, _type }) => ({ _id, _type })),
		),
		hasImage: vi.fn<MigrationStore['hasImage']>(
			async (fileName) => !missingImages.includes(fileName),
		),
		patchAffiliations: vi.fn<MigrationStore['patchAffiliations']>(async (id, rev, affiliations) => {
			const person = lake.get(id);
			if (!person || (person._rev ?? 'rev-0') !== rev) {
				throw new Error(`Revision mismatch for ${id}`);
			}
			write({ ...person, affiliations });
		}),
		swapType: vi.fn<MigrationStore['swapType']>(async (legacyId, next) => {
			lake.delete(legacyId);
			write(next);
		}),
		unsetGroupsPageStats: vi.fn<MigrationStore['unsetGroupsPageStats']>(async () => {
			for (const page of ofType('groupsPage').filter(({ _id }) => !_id.startsWith('versions.'))) {
				const { stats: _stats, ...content } = page.content as Record<string, unknown>;
				write({ ...page, content });
			}
		}),
		uploadImage: vi.fn<MigrationStore['uploadImage']>(async (fileName) => `image-${fileName}`),
	};
	return { lake, store };
}

/**
 * Forgets every recorded call, so a test can look at a second run alone.
 *
 * @param store - The fake store.
 */
function clearCalls(store: FakeStore): void {
	for (const method of Object.values(store)) {
		method.mockClear();
	}
}

export { WRITE_METHODS, clearCalls, createFakeStore };
export type { FakeDocument, FakeStore };
