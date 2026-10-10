import type { SanityClient } from 'next-sanity';

import { settle } from '@tsgi-web/shared';

import { echoRenderStateQuery } from '@/lib/sanity/queries/echo';
import type { EchoRenderStateQueryResult } from '@/types/sanity.types.generated';

const HTTP_CONFLICT = 409;

/**
 * Whether a Sanity client error is a failed `ifRevisionId` check.
 *
 * @param error - The rejection reason of a commit.
 * @returns `true` for an HTTP 409.
 */
function isConflict(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'statusCode' in error &&
		error.statusCode === HTTP_CONFLICT
	);
}

/**
 * Commits a patch and turns a revision mismatch into an outcome instead of an error.
 *
 * @param commit - The pending commit.
 * @returns `written`, or `conflict` when the document changed in between.
 * @throws {unknown} Every error other than a conflict.
 */
async function commitGuarded(commit: Promise<unknown>): Promise<WriteOutcome> {
	const outcome = await settle(commit);
	if (outcome.ok) {
		return 'written';
	}
	if (isConflict(outcome.error)) {
		return 'conflict';
	}
	throw outcome.error;
}

/**
 * The Sanity side of the render pipeline. Every write is guarded by the revision it read, so a
 * document an editor changed in the meantime is never overwritten.
 *
 * @param client - A client with write access that sees drafts (`getWriteClient`).
 * @returns The store.
 */
function createRenderStore(client: SanityClient): EchoRenderStore {
	/**
	 * Sets values on the document, guarded by the revision the state was read at.
	 *
	 * @param state - The state the write is based on.
	 * @param values - The fields to set.
	 * @returns `written` or `conflict`.
	 */
	const setGuarded = async (
		state: EchoRenderState,
		values: Record<string, unknown>,
	): Promise<WriteOutcome> =>
		commitGuarded(client.patch(state.id).ifRevisionId(state.rev).set(values).commit());

	return {
		claim: async (state, startedAt) =>
			setGuarded(state, { render: { source: state.pdfRef, startedAt, status: 'pending' } }),
		fail: async (state, failure) =>
			setGuarded(state, {
				render: {
					error: failure.error,
					finishedAt: failure.finishedAt,
					source: state.pdfRef,
					startedAt: failure.startedAt,
					status: 'failed',
				},
			}),
		finish: async (state, result) =>
			setGuarded(state, {
				extractedText: result.extractedText,
				pages: result.pages,
				render: {
					finishedAt: result.finishedAt,
					pageCount: result.pageCount,
					source: state.pdfRef,
					startedAt: result.startedAt,
					status: 'done',
				},
			}),
		read: async (id) => {
			const result: EchoRenderStateQueryResult = await client.fetch(echoRenderStateQuery, { id });
			return result
				? {
						id: result._id,
						pdfRef: result.pdfRef,
						renderSource: result.renderSource,
						renderStartedAt: result.renderStartedAt,
						rev: result._rev,
					}
				: null;
		},
		uploadPage: async (jpeg, filename) => {
			const asset = await client.assets.upload('image', Buffer.from(jpeg), {
				contentType: 'image/jpeg',
				filename,
			});
			return asset._id;
		},
	};
}

type WriteOutcome = 'conflict' | 'written';

interface EchoRenderState {
	id: string;
	pdfRef: string | null;
	renderSource: string | null;
	/** The claim token: the `startedAt` of the run that claimed the document last. */
	renderStartedAt: string | null;
	rev: string;
}

interface EchoPage {
	_key: string;
	_type: 'image';
	asset: { _ref: string; _type: 'reference' };
}

interface EchoRenderResult {
	extractedText: string;
	finishedAt: string;
	pageCount: number;
	pages: EchoPage[];
	startedAt: string;
}

interface EchoRenderFailure {
	error: string;
	finishedAt: string;
	startedAt: string;
}

interface EchoRenderStore {
	claim: (state: EchoRenderState, startedAt: string) => Promise<WriteOutcome>;
	fail: (state: EchoRenderState, failure: EchoRenderFailure) => Promise<WriteOutcome>;
	finish: (state: EchoRenderState, result: EchoRenderResult) => Promise<WriteOutcome>;
	read: (id: string) => Promise<EchoRenderState | null>;
	uploadPage: (jpeg: Uint8Array, filename: string) => Promise<string>;
}

export { createRenderStore };
export type {
	EchoPage,
	EchoRenderFailure,
	EchoRenderResult,
	EchoRenderState,
	EchoRenderStore,
	WriteOutcome,
};
