// oxlint-disable typescript/require-await -- the fake answers at once behind the async store API
import type { ImageField, PageImageDocument, PageImageStore } from '../store';

interface StoredDocument {
	[field: string]: unknown;
	_id: string;
	_rev: string;
	_type: string;
}

interface SeedDocument {
	[field: string]: unknown;
	_id: string;
	_type: string;
}

interface FakePageImageStoreOptions {
	/** The documents of the dataset, published and drafts. */
	documents?: readonly SeedDocument[];
	/** The file names the image folder lacks. */
	missingFiles?: readonly string[];
	/** Ids of release versions (`versions.<release>.<id>`) the dataset holds. */
	releaseVersions?: readonly string[];
}

/**
 * Whether a value is an image with a file.
 *
 * @param image - The value of a field or of a list item.
 * @returns `true` when it carries an asset.
 */
function hasAsset(image: unknown): boolean {
	return typeof image === 'object' && image !== null && 'asset' in image;
}

/**
 * Whether a field holds an image with a file, the way the real store's query decides it.
 *
 * @param value - The value of the field.
 * @param target - The field and whether it holds a list.
 * @param target.isList - Whether the field holds a list of images.
 * @returns `true` for a single image with an asset or a list with at least one.
 */
function holdsImage(value: unknown, { isList }: ImageField): boolean {
	return isList ? Array.isArray(value) && value.some((item) => hasAsset(item)) : hasAsset(value);
}

/** The in-memory dataset and what was done to it. */
interface FakePageImageStore {
	/** The documents by id, with their current revision. */
	byId: Map<string, StoredDocument>;
	/** The ids of the patched documents, in order. */
	patches: string[];
	store: PageImageStore;
	/** The uploaded file names, in order. */
	uploads: string[];
}

/**
 * An in-memory dataset behind the store interface. Every patch is guarded by the revision like
 * the real one and gives the document a new revision.
 *
 * @param options - The documents, the missing files and the release versions.
 * @returns The store, the documents by id, the uploaded file names and the patched ids in order.
 */
function createFakePageImageStore(options: FakePageImageStoreOptions = {}): FakePageImageStore {
	const { documents = [], missingFiles = [], releaseVersions = [] } = options;
	const byId = new Map<string, StoredDocument>();
	for (const document of documents) {
		byId.set(document._id, { ...document, _rev: 'rev-0' });
	}
	const uploads: string[] = [];
	const patches: string[] = [];
	let revision = 0;

	const store: PageImageStore = {
		fetchDocuments: async (documentType, fields) =>
			[...byId.values()]
				.filter((document) => document._type === documentType)
				.map((document): PageImageDocument => ({
					_id: document._id,
					_rev: document._rev,
					setFields: fields
						.filter((target) => holdsImage(document[target.field], target))
						.map((target) => target.field),
				})),
		fetchReleaseVersions: async () => [...releaseVersions],
		hasImage: async (fileName) => !missingFiles.includes(fileName),
		patchDocument: async (id, rev, fields) => {
			const document = byId.get(id);
			if (document?._rev !== rev) {
				throw new Error(`Revision mismatch for ${id}`);
			}
			revision += 1;
			byId.set(id, { ...document, ...fields, _rev: `rev-${revision}` });
			patches.push(id);
		},
		uploadImage: async (fileName) => {
			uploads.push(fileName);
			return `image-${fileName.replace('.', '-')}`;
		},
	};

	return { byId, patches, store, uploads };
}

export { createFakePageImageStore };
