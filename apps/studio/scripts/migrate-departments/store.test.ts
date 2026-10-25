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
		['fetchPersons', '*[_type == "person"]{_id, _rev, _type, affiliations}'],
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

	// The 2024 groups differ from the current ones in `department` and `isSportGroup`.
	it('reads the groups with their raw department and sport group flag', async () => {
		const { client, fake } = createFakeClient();

		await createSanityMigrationStore(client, IMAGE_FOLDER).fetchGroups();

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "group"]{_id, department, isSportGroup, "slug": slug.current, title}',
			{},
			{ perspective: 'raw' },
		);
	});

	it('finds the release versions of every type the migration touches', async () => {
		const { client, fake } = createFakeClient([{ _id: 'versions.r1.person-a', _type: 'person' }]);

		await expect(
			createSanityMigrationStore(client, IMAGE_FOLDER).fetchReleaseVersions(),
		).resolves.toStrictEqual([{ _id: 'versions.r1.person-a', _type: 'person' }]);
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_id in path("versions.**") && (_type in ["department", "group", "groupsPage", "person"] || string::startsWith(_type, "group."))]{_id, _type}',
			{},
			{ perspective: 'raw' },
		);
	});

	it('tells whether the image folder holds a file', async () => {
		const { client } = createFakeClient();
		const store = createSanityMigrationStore(client, IMAGE_FOLDER);

		await expect(store.hasImage('fussball-card.webp')).resolves.toBe(true);
		await expect(store.hasImage('schwimmen-card.webp')).resolves.toBe(false);
	});

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

	// One patch per document: the references and, for a person, the affiliations together.
	it('sets the changed fields of a document only in the revision it read', async () => {
		const { client, steps } = createFakeClient();
		const affiliations = [{ _key: 'a1', role: { _ref: 'role-1', _type: 'reference' } }];

		await createSanityMigrationStore(client, IMAGE_FOLDER).patchDocument('person-1', 'rev-7', {
			affiliations,
		});

		expect(steps).toStrictEqual([
			['patch', 'person-1'],
			['ifRevisionId', 'rev-7'],
			['set', { affiliations }],
			['patch.commit'],
		]);
	});

	it('reads every document that references a legacy group, in the raw perspective', async () => {
		const { client, fake } = createFakeClient();

		await createSanityMigrationStore(client, IMAGE_FOLDER).fetchReferringDocuments([
			'soccer-1',
			'dance-2',
		]);

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[references($ids)]',
			{ ids: ['soccer-1', 'dance-2'] },
			{ perspective: 'raw' },
		);
	});

	it('removes the stats from the published groups page and its draft in one transaction', async () => {
		const { client, fake, steps } = createFakeClient(['groupsPage', 'drafts.groupsPage']);

		await createSanityMigrationStore(client, IMAGE_FOLDER).unsetGroupsPageStats();

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == "groupsPage" && defined(content.stats) && !(_id in path("versions.**"))]._id',
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
		const document = {
			_id: 'group-soccer-1',
			_type: 'group' as const,
			department: { _ref: 'department-fussball', _type: 'reference' as const },
		};

		await store.createOrReplace(document);
		await store.deleteDocument('soccer-1');

		expect(fake.createOrReplace).toHaveBeenCalledWith(document);
		expect(fake.delete).toHaveBeenCalledWith('soccer-1');
	});
});
