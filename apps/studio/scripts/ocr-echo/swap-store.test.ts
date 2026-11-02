// @vitest-environment node
import type { SanityClient } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createSwapStore } from './swap-store';
import type { SwapTarget } from './swap-store';

const OLD_PDF = 'file-1111111111111111111111111111111111111111-pdf';
const NEW_PDF = 'file-2222222222222222222222222222222222222222-pdf';
const CONFLICT = 'Die Ausgabe wurde inzwischen geändert; das Skript erneut starten.';

/**
 * A row as the store's query projects it.
 *
 * @param id - The raw id.
 * @param overrides - Fields to replace.
 * @returns The row.
 */
function row(id: string, overrides: Record<string, unknown> = {}) {
	return {
		_id: id,
		_rev: `rev-${id}`,
		pdf: { _id: OLD_PDF, originalFilename: 'tsg-echo-2024.pdf', sha1hash: 'abc' },
		pdfRef: OLD_PDF,
		render: { source: OLD_PDF, status: 'done' },
		textLength: 2812,
		...overrides,
	};
}

/**
 * A client with spies for exactly the calls the store makes.
 *
 * @param rows - What `fetch` resolves to.
 * @returns The client and its spies.
 */
function createFakeClient(rows: unknown[] = []) {
	const transaction = {
		commit: vi.fn().mockResolvedValue({ _id: 'drafts.echo-2024' }),
		ifRevisionId: vi.fn(),
		set: vi.fn(),
	};
	transaction.ifRevisionId.mockReturnValue(transaction);
	transaction.set.mockReturnValue(transaction);
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: NEW_PDF }) },
		create: vi.fn().mockResolvedValue({ _id: 'drafts.echo-2024' }),
		fetch: vi.fn().mockResolvedValue(rows),
		getDocument: vi.fn(),
		patch: vi.fn().mockReturnValue(transaction),
	};
	return { client: fake as unknown as SanityClient, fake, transaction };
}

/**
 * A target as `findTarget` returns it.
 *
 * @param kind - Draft or published.
 * @returns The target.
 */
function target(kind: SwapTarget['kind']): SwapTarget {
	return {
		documentId: 'echo-2024',
		id: kind === 'draft' ? 'drafts.echo-2024' : 'echo-2024',
		kind,
		pdf: { assetId: OLD_PDF, originalFilename: 'tsg-echo-2024.pdf', sha1hash: 'abc' },
		render: { pdfRef: OLD_PDF, source: OLD_PDF, status: 'done', textLength: 2812 },
		rev: 'rev-1',
	};
}

describe('the swap store', () => {
	it('looks for the draft, the published document and every release version', async () => {
		const { client, fake } = createFakeClient([row('drafts.echo-2024')]);

		await createSwapStore(client).findTarget('echo-2024');

		expect(fake.fetch).toHaveBeenCalledWith(
			expect.any(String),
			{ draftId: 'drafts.echo-2024', id: 'echo-2024', versions: 'versions.*.echo-2024' },
			{ perspective: 'raw' },
		);
	});

	it('prefers the draft over the published document', async () => {
		const { client } = createFakeClient([row('echo-2024'), row('drafts.echo-2024')]);

		await expect(createSwapStore(client).findTarget('echo-2024')).resolves.toStrictEqual({
			documentId: 'echo-2024',
			id: 'drafts.echo-2024',
			kind: 'draft',
			pdf: { assetId: OLD_PDF, originalFilename: 'tsg-echo-2024.pdf', sha1hash: 'abc' },
			render: {
				error: undefined,
				pdfRef: OLD_PDF,
				source: OLD_PDF,
				status: 'done',
				textLength: 2812,
			},
			rev: 'rev-drafts.echo-2024',
		});
	});

	it('targets the published document when there is no draft', async () => {
		const { client } = createFakeClient([row('echo-2024')]);

		await expect(createSwapStore(client).findTarget('echo-2024')).resolves.toMatchObject({
			id: 'echo-2024',
			kind: 'published',
		});
	});

	it('refuses an issue that lies in a release, also next to a draft', async () => {
		const { client } = createFakeClient([
			row('drafts.echo-2024'),
			row('versions.tsg-echo-archiv.echo-2024'),
		]);

		await expect(createSwapStore(client).findTarget('echo-2024')).rejects.toThrow(
			'Die Ausgabe liegt als Version im Release „tsg-echo-archiv“; dort tauscht das Skript nicht.',
		);
	});

	it('refuses an issue that does not exist', async () => {
		const { client } = createFakeClient([]);

		await expect(createSwapStore(client).findTarget('echo-2024')).rejects.toThrow(
			'Die Ausgabe echo-2024 gibt es nicht.',
		);
	});

	it('refuses an issue without a PDF', async () => {
		const { client } = createFakeClient([row('echo-2024', { pdf: null, pdfRef: null })]);

		await expect(createSwapStore(client).findTarget('echo-2024')).rejects.toThrow(
			'Die Ausgabe echo-2024 hat keine PDF.',
		);
	});

	it('reads an issue that was never rendered as an empty render state', async () => {
		const { client } = createFakeClient([
			row('drafts.echo-2024', { pdf: { _id: OLD_PDF }, render: null, textLength: 0 }),
		]);

		await expect(createSwapStore(client).findTarget('echo-2024')).resolves.toMatchObject({
			pdf: { assetId: OLD_PDF, originalFilename: undefined, sha1hash: undefined },
			render: { pdfRef: OLD_PDF, source: undefined, status: undefined, textLength: 0 },
		});
	});

	it('swaps only the PDF reference of a draft, against the revision it read', async () => {
		const { client, fake, transaction } = createFakeClient();

		await createSwapStore(client).swapPdf(target('draft'), NEW_PDF);

		expect(fake.patch).toHaveBeenCalledWith('drafts.echo-2024');
		expect(transaction.ifRevisionId).toHaveBeenCalledWith('rev-1');
		expect(transaction.set).toHaveBeenCalledWith({
			'pdf.asset': { _ref: NEW_PDF, _type: 'reference' },
		});
		expect(transaction.commit).toHaveBeenCalledOnce();
		expect(fake.create).not.toHaveBeenCalled();
	});

	it('creates a draft with the new PDF for a published issue and leaves the published one alone', async () => {
		const { client, fake } = createFakeClient();
		fake.getDocument.mockResolvedValue({
			_createdAt: '2026-10-12T08:07:03Z',
			_id: 'echo-2024',
			_rev: 'rev-1',
			_type: 'echo.issue',
			_updatedAt: '2026-11-01T11:00:00Z',
			pdf: { _type: 'file', asset: { _ref: OLD_PDF, _type: 'reference' } },
			title: 'TSG ECHO 2024',
		});

		await createSwapStore(client).swapPdf(target('published'), NEW_PDF);

		expect(fake.getDocument).toHaveBeenCalledWith('echo-2024');
		expect(fake.create).toHaveBeenCalledWith({
			_id: 'drafts.echo-2024',
			_type: 'echo.issue',
			pdf: { _type: 'file', asset: { _ref: NEW_PDF, _type: 'reference' } },
			title: 'TSG ECHO 2024',
		});
		expect(fake.patch).not.toHaveBeenCalled();
	});

	it('refuses to copy a published issue that changed since it was read', async () => {
		const { client, fake } = createFakeClient();
		fake.getDocument.mockResolvedValue({ _id: 'echo-2024', _rev: 'rev-2', _type: 'echo.issue' });

		await expect(createSwapStore(client).swapPdf(target('published'), NEW_PDF)).rejects.toThrow(
			CONFLICT,
		);
		expect(fake.create).not.toHaveBeenCalled();
	});

	it('turns a revision conflict into a German error', async () => {
		const { client, transaction } = createFakeClient();
		transaction.commit.mockRejectedValue(Object.assign(new Error('Conflict'), { statusCode: 409 }));

		await expect(createSwapStore(client).swapPdf(target('draft'), NEW_PDF)).rejects.toThrow(
			CONFLICT,
		);
	});

	it('also when a draft appeared before it could be created', async () => {
		const { client, fake } = createFakeClient();
		fake.getDocument.mockResolvedValue({ _id: 'echo-2024', _rev: 'rev-1', _type: 'echo.issue' });
		fake.create.mockRejectedValue(Object.assign(new Error('exists'), { statusCode: 409 }));

		await expect(createSwapStore(client).swapPdf(target('published'), NEW_PDF)).rejects.toThrow(
			CONFLICT,
		);
	});

	it('passes other errors on unchanged', async () => {
		const { client, transaction } = createFakeClient();
		transaction.commit.mockRejectedValue(new Error('Netzwerk weg'));

		await expect(createSwapStore(client).swapPdf(target('draft'), NEW_PDF)).rejects.toThrow(
			'Netzwerk weg',
		);
	});

	it('reads the render state of the draft, and of the published issue once it is gone', async () => {
		const withDraft = createFakeClient([
			row('echo-2024'),
			row('drafts.echo-2024', { pdfRef: NEW_PDF, render: { source: NEW_PDF, status: 'pending' } }),
		]);
		const published = createFakeClient([row('echo-2024', { textLength: 41_181 })]);

		await expect(
			createSwapStore(withDraft.client).readRender(target('draft')),
		).resolves.toStrictEqual({
			error: undefined,
			pdfRef: NEW_PDF,
			source: NEW_PDF,
			status: 'pending',
			textLength: 2812,
		});
		await expect(
			createSwapStore(published.client).readRender(target('draft')),
		).resolves.toMatchObject({ textLength: 41_181 });
	});

	it('reads no render state for an issue that is gone', async () => {
		const { client } = createFakeClient([]);

		await expect(createSwapStore(client).readRender(target('draft'))).resolves.toBeUndefined();
	});

	it('uploads the PDF under the given name', async () => {
		const { client, fake } = createFakeClient();

		await expect(
			createSwapStore(client).uploadPdf(new Uint8Array([1]), 'tsg-echo-2024.pdf'),
		).resolves.toBe(NEW_PDF);
		expect(fake.assets.upload).toHaveBeenCalledWith('file', Buffer.from([1]), {
			contentType: 'application/pdf',
			filename: 'tsg-echo-2024.pdf',
		});
	});
});
