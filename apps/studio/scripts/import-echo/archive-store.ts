import type { SanityClient } from 'sanity';

import { RELEASE_DESCRIPTION, RELEASE_TITLE } from './issue-document';
import type { EchoIssueDocument } from './issue-document';

const DRAFTS_PREFIX = 'drafts.';

const EXISTING_IDS_QUERY = /* groq */ '*[_id in $ids]._id';
const INDEXABLE_BEFORE_QUERY =
	/* groq */ '*[_type == "echo.issue" && releaseDate < $cutoff && indexable != false]._id';

/**
 * Every id a document can have here: published, draft and its version in the archive release.
 *
 * @param publishedId - The published id.
 * @param versionPrefix - `versions.<release id>.`.
 * @returns The three ids.
 */
function toAllIds(publishedId: string, versionPrefix: string): string[] {
	return [publishedId, `${DRAFTS_PREFIX}${publishedId}`, `${versionPrefix}${publishedId}`];
}

/**
 * The published id behind a draft or archive release version id.
 *
 * @param id - Any id `toAllIds` produced.
 * @param versionPrefix - `versions.<release id>.`.
 * @returns The published id.
 */
function toPublishedId(id: string, versionPrefix: string): string {
	if (id.startsWith(versionPrefix)) {
		return id.slice(versionPrefix.length);
	}
	return id.startsWith(DRAFTS_PREFIX) ? id.slice(DRAFTS_PREFIX.length) : id;
}

/**
 * The Sanity side of the archive import. Reads go through the raw perspective, so drafts and
 * release versions count as much as published documents.
 *
 * @param client - The `sanity exec` client, with the user's token and the target dataset.
 * @param releaseId - The release to fill, `tsg-echo-archiv` unless `--release` names another.
 * @returns The store.
 */
function createArchiveStore(client: SanityClient, releaseId: string): ArchiveStore {
	const versionPrefix = `versions.${releaseId}.`;
	return {
		createRelease: async () => {
			await client.releases.create({
				metadata: {
					description: RELEASE_DESCRIPTION,
					releaseType: 'undecided',
					title: RELEASE_TITLE,
				},
				releaseId,
			});
		},
		createVersion: async (publishedId, document) => {
			await client.createVersion({ document, publishedId, releaseId });
		},
		findExisting: async (publishedIds) => {
			const ids = await client.fetch<string[]>(
				EXISTING_IDS_QUERY,
				{ ids: publishedIds.flatMap((id) => toAllIds(id, versionPrefix)) },
				{ perspective: 'raw' },
			);
			return new Set(ids.map((id) => toPublishedId(id, versionPrefix)));
		},
		findIndexableBefore: async (cutoff) =>
			client.fetch<string[]>(INDEXABLE_BEFORE_QUERY, { cutoff }, { perspective: 'raw' }),
		getReleaseState: async () => {
			const release = await client.releases.get({ releaseId });
			return release?.state;
		},
		uploadPage: async (jpeg, filename) => {
			const asset = await client.assets.upload('image', Buffer.from(jpeg), {
				contentType: 'image/jpeg',
				filename,
			});
			return asset._id;
		},
		uploadPdf: async (bytes, filename) => {
			const asset = await client.assets.upload('file', Buffer.from(bytes), {
				contentType: 'application/pdf',
				filename,
			});
			return asset._id;
		},
	};
}

interface ArchiveStore {
	createRelease: () => Promise<void>;
	createVersion: (publishedId: string, document: EchoIssueDocument) => Promise<void>;
	/** The published ids of the given documents that exist as published, draft or release version. */
	findExisting: (publishedIds: readonly string[]) => Promise<Set<string>>;
	/** The raw ids of every `echo.issue` before the cutoff that is not switched off. */
	findIndexableBefore: (cutoff: string) => Promise<string[]>;
	/** `undefined` when the release does not exist. */
	getReleaseState: () => Promise<string | undefined>;
	uploadPage: (jpeg: Uint8Array, filename: string) => Promise<string>;
	uploadPdf: (bytes: Uint8Array, filename: string) => Promise<string>;
}

export { createArchiveStore };
export type { ArchiveStore };
