import type { SanityClient } from 'next-sanity';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { Mock } from 'vite-plus/test';

import { createRenderStore } from './render-store';
import type { EchoRenderState } from './render-store';

const STATE: EchoRenderState = {
	id: 'drafts.echo-2025',
	pdfRef: 'file-8c3211369d3d2da0c150d50d7cb5bca911b15f5e-pdf',
	renderSource: null,
	renderStartedAt: null,
	rev: 'rev-1',
};

interface PatchEntry {
	id: string;
	rev?: string;
	set?: unknown;
}

interface FakeClient {
	client: SanityClient;
	fake: { assets: { upload: Mock }; fetch: Mock };
	patches: PatchEntry[];
}

/**
 * A client that records the patch chain: `patch(id).ifRevisionId(rev).set(values).commit()`.
 * `commit` resolves unless `commitError` is set.
 *
 * @param options - What `commit` rejects with and what `fetch` resolves to.
 * @returns The client, its spies and the recorded patches.
 */
function createFakeClient(
	options: { commitError?: Error; fetchResult?: unknown } = {},
): FakeClient {
	const patches: PatchEntry[] = [];
	const commit = options.commitError
		? vi.fn().mockRejectedValue(options.commitError)
		: vi.fn().mockResolvedValue({});
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: 'image-abc-2000x1414-jpg' }) },
		fetch: vi.fn().mockResolvedValue(options.fetchResult ?? null),
		patch: (id: string) => {
			const entry: PatchEntry = { id };
			patches.push(entry);
			const chain = {
				commit,
				ifRevisionId: (rev: string) => {
					entry.rev = rev;
					return chain;
				},
				set: (values: unknown) => {
					entry.set = values;
					return chain;
				},
			};
			return chain;
		},
	};
	return { client: fake as unknown as SanityClient, fake, patches };
}

describe('echo render store', () => {
	it('reads the render state of a document', async () => {
		const { client, fake } = createFakeClient({
			fetchResult: {
				_id: STATE.id,
				_rev: 'rev-1',
				pdfRef: STATE.pdfRef,
				renderSource: null,
				renderStartedAt: null,
			},
		});

		const state = await createRenderStore(client).read(STATE.id);

		expect(state).toStrictEqual(STATE);
		expect(fake.fetch).toHaveBeenCalledWith(expect.any(String), { id: STATE.id });
	});

	it('reads a missing document as null', async () => {
		const { client } = createFakeClient({ fetchResult: null });

		await expect(createRenderStore(client).read('gone')).resolves.toBeNull();
	});

	it('claims a document against its revision with a pending render', async () => {
		const { client, patches } = createFakeClient();

		const outcome = await createRenderStore(client).claim(STATE, '2026-10-10T10:00:00.000Z');

		expect(outcome).toBe('written');
		expect(patches).toStrictEqual([
			{
				id: STATE.id,
				rev: 'rev-1',
				set: {
					render: {
						source: STATE.pdfRef,
						startedAt: '2026-10-10T10:00:00.000Z',
						status: 'pending',
					},
				},
			},
		]);
	});

	it('reports a revision mismatch as a conflict', async () => {
		const { client } = createFakeClient({
			commitError: Object.assign(new Error('Conflict'), { statusCode: 409 }),
		});

		await expect(createRenderStore(client).claim(STATE, 'now')).resolves.toBe('conflict');
	});

	it('rethrows any other write error', async () => {
		const { client } = createFakeClient({ commitError: new Error('network down') });

		await expect(createRenderStore(client).claim(STATE, 'now')).rejects.toThrow('network down');
	});

	it('uploads a page as a jpeg image asset and returns its id', async () => {
		const { client, fake } = createFakeClient();

		const assetId = await createRenderStore(client).uploadPage(
			new Uint8Array([1, 2, 3]),
			'echo-8c321136-seite-001.jpg',
		);

		expect(assetId).toBe('image-abc-2000x1414-jpg');
		expect(fake.assets.upload).toHaveBeenCalledWith('image', Buffer.from([1, 2, 3]), {
			contentType: 'image/jpeg',
			filename: 'echo-8c321136-seite-001.jpg',
		});
	});

	it('writes the finished pages, text and render state', async () => {
		const { client, patches } = createFakeClient();
		const page = {
			_key: 'seite-1',
			_type: 'image' as const,
			asset: { _ref: 'image-a', _type: 'reference' as const },
		};

		await createRenderStore(client).finish(STATE, {
			extractedText: 'Text',
			finishedAt: 'end',
			pageCount: 1,
			pages: [page],
			startedAt: 'start',
		});

		expect(patches[0]?.set).toStrictEqual({
			extractedText: 'Text',
			pages: [page],
			render: {
				finishedAt: 'end',
				pageCount: 1,
				source: STATE.pdfRef,
				startedAt: 'start',
				status: 'done',
			},
		});
	});

	it('writes a failed render with its message', async () => {
		const { client, patches } = createFakeClient();

		await createRenderStore(client).fail(STATE, {
			error: 'kaputt',
			finishedAt: 'end',
			startedAt: 'start',
		});

		expect(patches[0]?.set).toStrictEqual({
			render: {
				error: 'kaputt',
				finishedAt: 'end',
				source: STATE.pdfRef,
				startedAt: 'start',
				status: 'failed',
			},
		});
	});
});
