// @vitest-environment node
import type { SanityClient } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createArchiveStore } from './archive-store';
import type { EchoIssueDocument } from './issue-document';

/**
 * A client with spies for exactly the calls the store makes.
 *
 * @param fetchResult - What `fetch` resolves to.
 * @returns The client and its spies.
 */
function createFakeClient(fetchResult: unknown = []) {
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: 'asset-id' }) },
		createVersion: vi.fn().mockResolvedValue({ transactionId: 't' }),
		fetch: vi.fn().mockResolvedValue(fetchResult),
		releases: {
			create: vi.fn().mockResolvedValue({ releaseId: 'tsg-echo-archiv' }),
			get: vi.fn(),
		},
	};
	return { client: fake as unknown as SanityClient, fake };
}

describe('the archive store', () => {
	it('creates the release with its fixed id, title and description', async () => {
		const { client, fake } = createFakeClient();

		await createArchiveStore(client, 'tsg-echo-archiv').createRelease();

		expect(fake.releases.create).toHaveBeenCalledWith({
			metadata: {
				description:
					'Die alten Ausgaben 1979–2012 aus dem Import (WEB-354). Intros prüfen, dann den Release veröffentlichen.',
				releaseType: 'undecided',
				title: 'TSG-Echo-Archiv',
			},
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('reads the release state, and nothing for a missing release', async () => {
		const { client, fake } = createFakeClient();
		const store = createArchiveStore(client, 'tsg-echo-archiv');

		await expect(store.getReleaseState()).resolves.toBeUndefined();
		fake.releases.get.mockResolvedValue({ state: 'published' });
		await expect(store.getReleaseState()).resolves.toBe('published');
		expect(fake.releases.get).toHaveBeenCalledWith({ releaseId: 'tsg-echo-archiv' });
	});

	// Review focus 1: a rerun must find a document in any form.
	it('looks for the published, draft and release version of every id', async () => {
		const { client, fake } = createFakeClient([
			'drafts.echo-archiv-1979-01',
			'versions.tsg-echo-archiv.echo-archiv-1979-02',
		]);

		const existing = await createArchiveStore(client, 'tsg-echo-archiv').findExisting([
			'echo-archiv-1979-01',
			'echo-archiv-1979-02',
			'echo-archiv-1979-03',
		]);

		expect(existing).toStrictEqual(new Set(['echo-archiv-1979-01', 'echo-archiv-1979-02']));
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_id in $ids]._id',
			{
				ids: [
					'echo-archiv-1979-01',
					'drafts.echo-archiv-1979-01',
					'versions.tsg-echo-archiv.echo-archiv-1979-01',
					'echo-archiv-1979-02',
					'drafts.echo-archiv-1979-02',
					'versions.tsg-echo-archiv.echo-archiv-1979-02',
					'echo-archiv-1979-03',
					'drafts.echo-archiv-1979-03',
					'versions.tsg-echo-archiv.echo-archiv-1979-03',
				],
			},
			{ perspective: 'raw' },
		);
	});

	it('finds every indexable issue before the cutoff in every version', async () => {
		const { client, fake } = createFakeClient(['echo-1984']);

		await expect(
			createArchiveStore(client, 'tsg-echo-archiv').findIndexableBefore('2013-01-01'),
		).resolves.toStrictEqual(['echo-1984']);
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "echo.issue" && releaseDate < $cutoff && indexable != false]._id',
			{ cutoff: '2013-01-01' },
			{ perspective: 'raw' },
		);
	});

	it('puts a document into the release under its published id', async () => {
		const { client, fake } = createFakeClient();
		const document = { _type: 'echo.issue', title: 'X' } as EchoIssueDocument;

		await createArchiveStore(client, 'tsg-echo-archiv').createVersion(
			'echo-archiv-1979-01',
			document,
		);

		expect(fake.createVersion).toHaveBeenCalledWith({
			document,
			publishedId: 'echo-archiv-1979-01',
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('uploads a pdf and a page with their content types and names', async () => {
		const { client, fake } = createFakeClient();
		const store = createArchiveStore(client, 'tsg-echo-archiv');

		await expect(store.uploadPdf(new Uint8Array([1]), 'tsg-echo-1979-nr-1.pdf')).resolves.toBe(
			'asset-id',
		);
		await expect(
			store.uploadPage(new Uint8Array([2]), 'echo-8c321136-seite-001.jpg'),
		).resolves.toBe('asset-id');
		expect(fake.assets.upload).toHaveBeenNthCalledWith(1, 'file', Buffer.from([1]), {
			contentType: 'application/pdf',
			filename: 'tsg-echo-1979-nr-1.pdf',
		});
		expect(fake.assets.upload).toHaveBeenNthCalledWith(2, 'image', Buffer.from([2]), {
			contentType: 'image/jpeg',
			filename: 'echo-8c321136-seite-001.jpg',
		});
	});

	// Final review I3: a published or archived release needs a second one for a later run.
	it('works against another release id', async () => {
		const { client, fake } = createFakeClient(['versions.tsg-echo-archiv-2.echo-archiv-1979-01']);
		const store = createArchiveStore(client, 'tsg-echo-archiv-2');

		await expect(store.findExisting(['echo-archiv-1979-01'])).resolves.toStrictEqual(
			new Set(['echo-archiv-1979-01']),
		);
		await store.createRelease();
		await store.createVersion('echo-archiv-1979-01', { _type: 'echo.issue' } as EchoIssueDocument);
		await store.getReleaseState();
		expect(fake.fetch.mock.calls[0]?.[1]).toStrictEqual({
			ids: [
				'echo-archiv-1979-01',
				'drafts.echo-archiv-1979-01',
				'versions.tsg-echo-archiv-2.echo-archiv-1979-01',
			],
		});
		expect(fake.releases.create).toHaveBeenCalledWith(
			expect.objectContaining({ releaseId: 'tsg-echo-archiv-2' }),
		);
		expect(fake.createVersion).toHaveBeenCalledWith(
			expect.objectContaining({ releaseId: 'tsg-echo-archiv-2' }),
		);
		expect(fake.releases.get).toHaveBeenCalledWith({ releaseId: 'tsg-echo-archiv-2' });
	});
});
