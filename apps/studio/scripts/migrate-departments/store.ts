import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import type { SanityClient } from 'sanity';

import { settle } from '@tsgi-web/shared';

import type {
	Affiliation,
	DepartmentDocument,
	GroupDocument,
	LegacyGroupDocument,
	StatsItem,
} from './build';

const RAW = { perspective: 'raw' } as const;
const PUBLISHED = { perspective: 'published' } as const;

const LEGACY_GROUPS_QUERY = /* groq */ '*[string::startsWith(_type, "group.")]';
const GROUPS_QUERY =
	/* groq */ '*[_type == "group"]{_id, department, isSportGroup, "slug": slug.current, title}';
const DEPARTMENTS_QUERY =
	/* groq */ '*[_type == "department"]{_id, "cardImageAssetId": cardImage.asset._ref, "slug": slug.current, sortOrder}';
const PERSONS_QUERY = /* groq */ '*[_type == "person"]{_id, _rev, _type, affiliations}';
const GROUPS_PAGE_STATS_QUERY = /* groq */ '*[_type == "groupsPage"][0].content.stats';
const GROUPS_PAGES_WITH_STATS_QUERY =
	/* groq */ '*[_type == "groupsPage" && defined(content.stats) && !(_id in path("versions.**"))]._id';
// The filter and the order of `offerGroupsPageContactPersonsQuery` in the web app.
const CONTACT_PERSON_IDS_QUERY =
	/* groq */ "*[_type == 'person'][affiliations[0].role->email == $email]._id";
const REFERRERS_QUERY = /* groq */ '*[references($id)]{_id, _type}';
const REFERRING_DOCUMENTS_QUERY = /* groq */ '*[references($ids)]';
const RELEASE_VERSIONS_QUERY =
	/* groq */ '*[_id in path("versions.**") && (_type in ["department", "group", "groupsPage", "person"] || string::startsWith(_type, "group."))]{_id, _type}';

/**
 * The Sanity side of the department migration. Reads that decide what to write go through the raw
 * perspective, so drafts are migrated as well; the stats and the contact persons are read like the
 * website reads them, published.
 *
 * @param client - The `sanity exec` client, with the user's token and the target dataset.
 * @param imageFolder - The folder that holds the department images.
 * @returns The store.
 */
function createSanityMigrationStore(client: SanityClient, imageFolder: string): MigrationStore {
	return {
		createOrReplace: async (document) => {
			await client.createOrReplace<Record<string, unknown>>(document);
		},
		deleteDocument: async (id) => {
			await client.delete(id);
		},
		fetchContactPersonIds: async (email) =>
			client.fetch<string[]>(CONTACT_PERSON_IDS_QUERY, { email }, PUBLISHED),
		fetchDepartments: async () => client.fetch<DepartmentSummary[]>(DEPARTMENTS_QUERY, {}, RAW),
		fetchGroups: async () => client.fetch<GroupSummary[]>(GROUPS_QUERY, {}, RAW),
		fetchGroupsPageStats: async () =>
			client.fetch<StatsItem[] | null>(GROUPS_PAGE_STATS_QUERY, {}, PUBLISHED),
		fetchLegacyGroups: async () =>
			client.fetch<LegacyGroupDocument[]>(LEGACY_GROUPS_QUERY, {}, RAW),
		fetchPersons: async () => client.fetch<PersonDocument[]>(PERSONS_QUERY, {}, RAW),
		fetchReferrers: async (id) => client.fetch<DocumentStub[]>(REFERRERS_QUERY, { id }, RAW),
		fetchReferringDocuments: async (ids) =>
			client.fetch<RawDocument[]>(REFERRING_DOCUMENTS_QUERY, { ids }, RAW),
		fetchReleaseVersions: async () => client.fetch<DocumentStub[]>(RELEASE_VERSIONS_QUERY, {}, RAW),
		hasImage: async (fileName) => {
			const found = await settle(access(path.join(imageFolder, fileName)));
			return found.ok;
		},
		patchDocument: async (id, rev, fields) => {
			await client.patch(id).ifRevisionId(rev).set(fields).commit();
		},
		unsetGroupsPageStats: async () => {
			const ids = await client.fetch<string[]>(GROUPS_PAGES_WITH_STATS_QUERY, {}, RAW);
			const transaction = client.transaction();
			for (const id of ids) {
				transaction.patch(id, (patch) => patch.unset(['content.stats']));
			}
			await transaction.commit();
		},
		uploadImage: async (fileName) => {
			const asset = await client.assets.upload(
				'image',
				createReadStream(path.join(imageFolder, fileName)),
				{ filename: fileName },
			);
			return asset._id;
		},
	};
}

/** A department as the migration needs to know it. */
interface DepartmentSummary {
	_id: string;
	cardImageAssetId?: string | null;
	slug?: string | null;
	sortOrder?: number | null;
}

/** A `group` document as the migration needs to know it. */
interface GroupSummary {
	_id: string;
	/** A reference; a string or nothing in a group left from the 2024 schema. */
	department?: { _ref?: string | null } | string | null;
	/** Only set in a group left from the 2024 schema. */
	isSportGroup?: boolean | null;
	slug?: string | null;
	title?: string | null;
}

interface PersonDocument {
	[field: string]: unknown;
	_id: string;
	_rev: string;
	_type: string;
	affiliations?: Affiliation[] | null;
}

/** A whole document as the raw perspective returns it. */
interface RawDocument {
	[field: string]: unknown;
	_id: string;
	_rev: string;
	_type: string;
}

interface DocumentStub {
	_id: string;
	_type: string;
}

/** Any document the migration creates: a department or a group. */
type NewDocument = DepartmentDocument | GroupDocument;

interface MigrationStore {
	createOrReplace: (document: NewDocument) => Promise<void>;
	deleteDocument: (id: string) => Promise<void>;
	/** The published persons the department page lists today for a role email, in that order. */
	fetchContactPersonIds: (email: string) => Promise<string[]>;
	/** Every department: published, draft and release version. */
	fetchDepartments: () => Promise<DepartmentSummary[]>;
	/** Every `group`: published, draft and release version. */
	fetchGroups: () => Promise<GroupSummary[]>;
	/** The published stats of the groups page, `null` when it has none. */
	fetchGroupsPageStats: () => Promise<StatsItem[] | null>;
	/** Every `group.<x>` document: published, draft and release version. */
	fetchLegacyGroups: () => Promise<LegacyGroupDocument[]>;
	/** Every person: published, draft and release version. */
	fetchPersons: () => Promise<PersonDocument[]>;
	/** Every document, published, draft and release version, that references the given id. */
	fetchReferrers: (id: string) => Promise<DocumentStub[]>;
	/** Every whole document, published, draft and release version, that references one of the ids. */
	fetchReferringDocuments: (ids: readonly string[]) => Promise<RawDocument[]>;
	/** Every release version (`versions.<release>.<id>`) of a type the migration touches. */
	fetchReleaseVersions: () => Promise<DocumentStub[]>;
	/** Whether the image folder holds the file. Reads the disk only. */
	hasImage: (fileName: string) => Promise<boolean>;
	/** Sets top-level fields of a document, unless it changed since `rev`. */
	patchDocument: (id: string, rev: string, fields: Record<string, unknown>) => Promise<void>;
	/** Removes `content.stats` from the groups page, published and draft, not from a release. */
	unsetGroupsPageStats: () => Promise<void>;
	/** Uploads a file of the image folder and returns the asset id. */
	uploadImage: (fileName: string) => Promise<string>;
}

export { createSanityMigrationStore };
export type {
	DepartmentSummary,
	DocumentStub,
	GroupSummary,
	MigrationStore,
	NewDocument,
	PersonDocument,
	RawDocument,
};
