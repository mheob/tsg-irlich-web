import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';

import type { SanityClient } from 'sanity';

import { settle } from '@tsgi-web/shared';

const RAW = { perspective: 'raw' } as const;

const RELEASE_VERSIONS_QUERY = /* groq */ '*[_id in path("versions.**") && _type in $types]._id';

/**
 * The query for the published documents and drafts of a type, each with the fields among the given
 * ones that are set. The field names come from the migration's own targets, never from input.
 *
 * @param fields - The image fields the migration fills on the type.
 * @returns The GROQ query.
 */
function getDocumentsQuery(fields: readonly string[]): string {
	const setFields = fields.map((field) => `select(defined(${field}) => "${field}")`).join(', ');
	return `*[_type == $type && !(_id in path("versions.**"))]{_id, _rev, "setFields": [${setFields}]}`;
}

/**
 * The Sanity side of the page image migration. It reads in the raw perspective, so drafts get the
 * images as well, and leaves release versions to the editors.
 *
 * @param client - The `sanity exec` client, with the user's token and the target dataset.
 * @param imageFolder - The folder that holds the images.
 * @returns The store.
 */
function createSanityPageImageStore(client: SanityClient, imageFolder: string): PageImageStore {
	return {
		fetchDocuments: async (documentType, fields) => {
			const documents = await client.fetch<RawPageImageDocument[]>(
				getDocumentsQuery(fields),
				{ type: documentType },
				RAW,
			);
			return documents.map(({ _id, _rev, setFields }) => ({
				_id,
				_rev,
				setFields: setFields.filter((field): field is string => field !== null),
			}));
		},
		fetchReleaseVersions: async (documentTypes) =>
			client.fetch<string[]>(RELEASE_VERSIONS_QUERY, { types: documentTypes }, RAW),
		hasImage: async (fileName) => {
			const found = await settle(access(path.join(imageFolder, fileName)));
			return found.ok;
		},
		patchDocument: async (id, rev, fields) => {
			await client.patch(id).ifRevisionId(rev).set(fields).commit();
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

/** A page document as the query returns it: unset fields come back as `null`. */
interface RawPageImageDocument {
	_id: string;
	_rev: string;
	setFields: (null | string)[];
}

/** A page document as the migration needs to know it. */
interface PageImageDocument {
	_id: string;
	_rev: string;
	/** The image fields of the migration that the document already has. */
	setFields: string[];
}

interface PageImageStore {
	/** Published document and draft of the type, without release versions. */
	fetchDocuments: (documentType: string, fields: readonly string[]) => Promise<PageImageDocument[]>;
	/** Ids of the release versions (`versions.<release>.<id>`) of the given types. */
	fetchReleaseVersions: (documentTypes: readonly string[]) => Promise<string[]>;
	/** Whether the image folder holds the file. Reads the disk only. */
	hasImage: (fileName: string) => Promise<boolean>;
	/** Sets top-level fields of a document, unless it changed since `rev`. */
	patchDocument: (id: string, rev: string, fields: Record<string, unknown>) => Promise<void>;
	/** Uploads a file of the image folder and returns the asset id. */
	uploadImage: (fileName: string) => Promise<string>;
}

export { createSanityPageImageStore };
export type { PageImageDocument, PageImageStore };
