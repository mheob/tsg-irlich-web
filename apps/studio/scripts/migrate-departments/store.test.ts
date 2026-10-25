// @vitest-environment node
// oxlint-disable typescript/require-await -- the fake client answers at once behind the async client API
import type { ReadStream } from 'node:fs';

import path from 'node:path';

import type { SanityClient } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createSanityMigrationStore } from './store';

const IMAGE_FOLDER = path.join(import.meta.dirname, 'images');

/**
 * A client with spies for exactly the calls the store makes. A transaction and a patch record
 * every step in `steps`, in order.
 *
 * @param fetchResult - What `fetch` resolves to.
 * @returns The client, its spies and the recorded steps.
 */
function createFakeClient(fetchResult: unknown = []) {
	const steps: unknown[][] = [];
	/**
	 * Records a step and hands back what the client method returns, for chaining.
	 *
	 * @param step - The method and its arguments.
	 * @param result - What the method returns.
	 * @returns The result.
	 */
	const record = <Result>(step: unknown[], result: Result): Result => {
		steps.push(step);
		return result;
	};
	const patch = {
		commit: vi.fn(async () => record(['patch.commit'], {})),
		ifRevisionId: vi.fn((rev: string): unknown => record(['ifRevisionId', rev], patch)),
		set: vi.fn((value: unknown): unknown => record(['set', value], patch)),
		unset: vi.fn((paths: string[]): unknown => record(['unset', paths], patch)),
	};
	const transaction = {
		commit: vi.fn(async () => record(['commit'], {})),
		create: vi.fn((document: unknown): unknown => record(['create', document], transaction)),
		delete: vi.fn((id: string): unknown => record(['delete', id], transaction)),
		patch: vi.fn((id: string, build: (value: typeof patch) => unknown): unknown => {
			steps.push(['patch', id]);
			build(patch);
			return transaction;
		}),
	};
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: 'image-abc-480x480-webp' }) },
		createOrReplace: vi.fn().mockResolvedValue({}),
		delete: vi.fn().mockResolvedValue({}),
		fetch: vi.fn().mockResolvedValue(fetchResult),
		patch: vi.fn((id: string) => record(['patch', id], patch)),
		transaction: vi.fn(() => transaction),
	};
	return { client: fake as unknown as SanityClient, fake, steps };
}

describe('the migration store', () => {
	it.each([
		['fetchLegacyGroups', '*[string::startsWith(_type, "group.")]'],
		['fetchPersons', '*[_type == "person"]{_id, _rev, affiliations}'],
	] as const)('reads %s in the raw perspective, drafts included', async (method, query) => {
		const { client, fake } = createFakeClient();

		await createSanityMigrationStore(client, IMAGE_FOLDER)[method]();

		expect(fake.fetch).toHaveBeenCalledWith(query, {}, { perspective: 'raw' });
	});

	it.each(['fetchDepartments', 'fetchGroups'] as const)(
		'reads %s in the raw perspective',
		async (method) => {
			const { client, fake } = createFakeClient();

			await createSanityMigrationStore(client, IMAGE_FOLDER)[method]();

			expect(fake.fetch).toHaveBeenCalledWith(expect.any(String), {}, { perspective: 'raw' });
		},
	);

	it('finds every referrer of a document in the raw perspective', async () => {
		const { client, fake } = createFakeClient();

		await createSanityMigrationStore(client, IMAGE_FOLDER).fetchReferrers('admin-vorstand');

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[references($id)]{_id, _type}',
			{ id: 'admin-vorstand' },
			{ perspective: 'raw' },
		);
	});

	// The department page lists them exactly so today, published.
	it('reads the contact persons with the filter and order of the department page', async () => {
		const { client, fake } = createFakeClient(['person-a']);

		await expect(
			createSanityMigrationStore(client, IMAGE_FOLDER).fetchContactPersonIds(
				'fussball@tsg-irlich.de',
			),
		).resolves.toStrictEqual(['person-a']);
		expect(fake.fetch).toHaveBeenCalledWith(
			"*[_type == 'person'][affiliations[0].role->email == $email]._id",
			{ email: 'fussball@tsg-irlich.de' },
			{ perspective: 'published' },
		);
	});

	it('reads the published stats of the groups page', async () => {
		const { client, fake } = createFakeClient(null);

		await expect(
			createSanityMigrationStore(client, IMAGE_FOLDER).fetchGroupsPageStats(),
		).resolves.toBeNull();
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "groupsPage"][0].content.stats',
			{},
			{ perspective: 'published' },
		);
	});

	it('uploads an image of the folder under its file name', async () => {
		const { client, fake } = createFakeClient();

		await expect(
			createSanityMigrationStore(client, IMAGE_FOLDER).uploadImage('fussball-card.webp'),
		).resolves.toBe('image-abc-480x480-webp');
		const [type, stream, options] = fake.assets.upload.mock.calls[0] as [
			string,
			ReadStream,
			object,
		];
		stream.destroy();
		expect(type).toBe('image');
		expect(stream.path).toBe(path.join(IMAGE_FOLDER, 'fussball-card.webp'));
		expect(options).toStrictEqual({ filename: 'fussball-card.webp' });
	});

	it('swaps the type in one transaction: delete, then create', async () => {
		const { client, steps } = createFakeClient();
		const next = { _id: 'group-1', _type: 'group' };

		await createSanityMigrationStore(client, IMAGE_FOLDER).swapType('group-1', next);

		expect(steps).toStrictEqual([['delete', 'group-1'], ['create', next], ['commit']]);
	});

	it('patches the affiliations only in the revision it read', async () => {
		const { client, steps } = createFakeClient();
		const affiliations = [{ _key: 'a1', role: { _ref: 'role-1', _type: 'reference' } }];

		await createSanityMigrationStore(client, IMAGE_FOLDER).patchAffiliations(
			'person-1',
			'rev-7',
			affiliations,
		);

		expect(steps).toStrictEqual([
			['patch', 'person-1'],
			['ifRevisionId', 'rev-7'],
			['set', { affiliations }],
			['patch.commit'],
		]);
	});

	it('removes the stats from every version of the groups page in one transaction', async () => {
		const { client, fake, steps } = createFakeClient(['groupsPage', 'drafts.groupsPage']);

		await createSanityMigrationStore(client, IMAGE_FOLDER).unsetGroupsPageStats();

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "groupsPage" && defined(content.stats)]._id',
			{},
			{ perspective: 'raw' },
		);
		expect(steps).toStrictEqual([
			['patch', 'groupsPage'],
			['unset', ['content.stats']],
			['patch', 'drafts.groupsPage'],
			['unset', ['content.stats']],
			['commit'],
		]);
	});

	it('creates or replaces a document and deletes one by id', async () => {
		const { client, fake } = createFakeClient();
		const store = createSanityMigrationStore(client, IMAGE_FOLDER);
		const document = { _id: 'migration-probe-target', _type: 'group.soccer' };

		await store.createOrReplace(document);
		await store.deleteDocument('migration-probe-target');

		expect(fake.createOrReplace).toHaveBeenCalledWith(document);
		expect(fake.delete).toHaveBeenCalledWith('migration-probe-target');
	});
});
