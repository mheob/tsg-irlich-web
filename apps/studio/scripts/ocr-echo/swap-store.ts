import type { SanityClient } from 'sanity';

import { settle } from '@tsgi-web/shared';

const DRAFTS_PREFIX = 'drafts.';
const VERSIONS_PREFIX = 'versions.';
const HTTP_CONFLICT = 409;
const CONFLICT_MESSAGE = 'Die Ausgabe wurde inzwischen geändert; das Skript erneut starten.';

const ISSUE_QUERY = /* groq */ `*[_id in [$id, $draftId] || _id in path($versions)]{
	_id,
	_rev,
	"pdf": pdf.asset->{ _id, originalFilename, sha1hash },
	"pdfRef": pdf.asset._ref,
	"render": render{ error, source, status },
	"textLength": coalesce(length(extractedText), 0)
}`;

/**
 * The render state of a row, with `null` turned into `undefined`.
 *
 * @param row - The row of the query.
 * @returns The render state.
 */
function toRenderState(row: IssueRow): RenderState {
	return {
		error: row.render?.error ?? undefined,
		pdfRef: row.pdfRef ?? undefined,
		source: row.render?.source ?? undefined,
		status: row.render?.status ?? undefined,
		textLength: row.textLength,
	};
}

/**
 * The release a version id belongs to.
 *
 * @param id - `versions.<release>.<document>`.
 * @returns The release id.
 */
function toReleaseId(id: string): string {
	return id.slice(VERSIONS_PREFIX.length, id.lastIndexOf('.'));
}

/**
 * Turns a revision conflict into a message an editor can act on; passes everything else on.
 *
 * @param write - The write to await.
 * @throws {Error} The German conflict message for a 409, the original error otherwise.
 */
async function guardConflict(write: Promise<unknown>): Promise<void> {
	const written = await settle(write);
	if (written.ok) {
		return;
	}
	const { error } = written;
	if (error instanceof Error && 'statusCode' in error && error.statusCode === HTTP_CONFLICT) {
		throw new Error(CONFLICT_MESSAGE);
	}
	throw error;
}

/**
 * The draft of an issue among the rows, else its published document.
 *
 * @param rows - The rows of the query.
 * @param documentId - The published id.
 * @returns The row, or `undefined` when neither exists.
 */
function pickDraftOrPublished(rows: readonly IssueRow[], documentId: string): IssueRow | undefined {
	return (
		rows.find((row) => row._id === `${DRAFTS_PREFIX}${documentId}`) ??
		rows.find((row) => row._id === documentId)
	);
}

/**
 * A reference to an uploaded PDF.
 *
 * @param assetId - The asset id.
 * @returns The reference for `pdf.asset`.
 */
function toAssetReference(assetId: string): { _ref: string; _type: 'reference' } {
	return { _ref: assetId, _type: 'reference' };
}

/**
 * The Sanity side of the text layer script. Reads go through the raw perspective, so drafts and
 * release versions count. It only ever writes a draft: a published issue drops off the website
 * while its pages are rendered again, and stays off when that fails.
 *
 * @param client - The `sanity exec` client, with the user's token and the target dataset.
 * @returns The store.
 */
function createSwapStore(client: SanityClient): SwapStore {
	const fetchRows = async (documentId: string): Promise<IssueRow[]> =>
		client.fetch<IssueRow[]>(
			ISSUE_QUERY,
			{
				draftId: `${DRAFTS_PREFIX}${documentId}`,
				id: documentId,
				versions: `${VERSIONS_PREFIX}*.${documentId}`,
			},
			{ perspective: 'raw' },
		);

	return {
		findTarget: async (documentId) => {
			const rows = await fetchRows(documentId);
			const version = rows.find((row) => row._id.startsWith(VERSIONS_PREFIX));
			if (version) {
				throw new Error(
					`Die Ausgabe liegt als Version im Release „${toReleaseId(version._id)}“; dort tauscht das Skript nicht.`,
				);
			}
			const row = pickDraftOrPublished(rows, documentId);
			if (!row) {
				throw new Error(`Die Ausgabe ${documentId} gibt es nicht.`);
			}
			if (!row.pdfRef) {
				throw new Error(`Die Ausgabe ${documentId} hat keine PDF.`);
			}
			return {
				documentId,
				id: row._id,
				kind: row._id === documentId ? 'published' : 'draft',
				pdf: {
					assetId: row.pdfRef,
					originalFilename: row.pdf?.originalFilename ?? undefined,
					sha1hash: row.pdf?.sha1hash ?? undefined,
				},
				render: toRenderState(row),
				rev: row._rev,
			};
		},
		readRender: async (target) => {
			const row = pickDraftOrPublished(await fetchRows(target.documentId), target.documentId);
			return row ? toRenderState(row) : undefined;
		},
		swapPdf: async (target, assetId) => {
			if (target.kind === 'draft') {
				await guardConflict(
					client
						.patch(target.id)
						.ifRevisionId(target.rev)
						.set({ 'pdf.asset': toAssetReference(assetId) })
						.commit(),
				);
				return;
			}
			const published = await client.getDocument<PublishedIssue>(target.id);
			if (published?._rev !== target.rev) {
				throw new Error(CONFLICT_MESSAGE);
			}
			const { _createdAt, _rev, _updatedAt, ...copy } = published;
			await guardConflict(
				client.create({
					...copy,
					_id: `${DRAFTS_PREFIX}${target.documentId}`,
					pdf: { ...copy.pdf, asset: toAssetReference(assetId) },
				}),
			);
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

interface IssueRow {
	_id: string;
	_rev: string;
	pdf: { _id: string; originalFilename?: string | null; sha1hash?: string | null } | null;
	pdfRef: string | null;
	render: { error?: string | null; source?: string | null; status?: RenderStatus | null } | null;
	textLength: number;
}

/** The published document as `getDocument` returns it, copied field by field into the draft. */
interface PublishedIssue {
	[field: string]: unknown;
	_createdAt?: string;
	_id: string;
	_rev: string;
	_type: string;
	_updatedAt?: string;
	pdf?: Record<string, unknown>;
}

type RenderStatus = 'done' | 'failed' | 'pending';

interface RenderState {
	error?: string;
	/** The PDF the document references now. */
	pdfRef?: string;
	/** The PDF the last render claimed. */
	source?: string;
	status?: RenderStatus;
	/** The length of `extractedText`, `0` without one. */
	textLength: number;
}

interface SwapTarget {
	/** The published id, e.g. `echo-2024`. */
	documentId: string;
	/** The raw id the swap writes to. */
	id: string;
	kind: 'draft' | 'published';
	pdf: { assetId: string; originalFilename: string | undefined; sha1hash: string | undefined };
	render: RenderState;
	rev: string;
}

interface SwapStore {
	/**
	 * The draft of an issue, else its published document.
	 *
	 * @throws {Error} For an issue in a release, a missing issue, or one without a PDF.
	 */
	findTarget: (documentId: string) => Promise<SwapTarget>;
	/** The render state of the draft, else of the published document; `undefined` when both are gone. */
	readRender: (target: SwapTarget) => Promise<RenderState | undefined>;
	/** Points the draft at the new PDF, or creates the draft from the published document. */
	swapPdf: (target: SwapTarget, assetId: string) => Promise<void>;
	uploadPdf: (bytes: Uint8Array, filename: string) => Promise<string>;
}

export { createSwapStore };
export type { RenderState, SwapStore, SwapTarget };
