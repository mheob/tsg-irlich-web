// @vitest-environment node
// oxlint-disable typescript/require-await -- the fake client answers at once behind the async client API
import path from 'node:path';

import type { SanityClient } from 'sanity';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createSanityPageImageStore } from './store';

const IMAGE_FOLDER = path.join(import.meta.dirname, 'images');

/**
 * A client with spies for exactly the calls the store makes. A patch records every step in
 * `steps`, in order.
 *
 * @param fetchResult - What `fetch` resolves to.
 * @returns The client, its spies and the recorded steps.
 */
function createFakeClient(fetchResult: unknown = []) {
	const steps: unknown[][] = [];
	const patch = {
		commit: vi.fn(async () => {
			steps.push(['commit']);
			return {};
		}),
		ifRevisionId: vi.fn((rev: string): unknown => {
			steps.push(['ifRevisionId', rev]);
			return patch;
		}),
		set: vi.fn((value: unknown): unknown => {
			steps.push(['set', value]);
			return patch;
		}),
	};
	const fake = {
		assets: { upload: vi.fn().mockResolvedValue({ _id: 'image-abc-480x480-webp' }) },
		fetch: vi.fn().mockResolvedValue(fetchResult),
		patch: vi.fn((id: string) => {
			steps.push(['patch', id]);
			return patch;
		}),
	};
	return { client: fake as unknown as SanityClient, fake, steps };
}

describe('the page image store', () => {
	it('reads the documents of a type in the raw perspective without release versions', async () => {
		const { client, fake } = createFakeClient([
			{ _id: 'home', _rev: 'r1', setFields: ['heroImage', null] },
		]);

		await expect(
			createSanityPageImageStore(client, IMAGE_FOLDER).fetchDocuments('home', ['heroImage']),
		).resolves.toStrictEqual([{ _id: 'home', _rev: 'r1', setFields: ['heroImage'] }]);
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == $type && !(_id in path("versions.**"))]{_id, _rev, "setFields": [select(defined(heroImage) => "heroImage")]}',
			{ type: 'home' },
			{ perspective: 'raw' },
		);
	});

	it('asks for every field of the type at once', async () => {
		const { client, fake } = createFakeClient();

		await createSanityPageImageStore(client, IMAGE_FOLDER).fetchDocuments('site-settings', [
			'visionImages',
			'fallbackImage',
		]);

		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_type == $type && !(_id in path("versions.**"))]{_id, _rev, "setFields": [select(defined(visionImages) => "visionImages"), select(defined(fallbackImage) => "fallbackImage")]}',
			{ type: 'site-settings' },
			{ perspective: 'raw' },
		);
	});

	it('finds the release versions of the page types', async () => {
		const { client, fake } = createFakeClient(['versions.r1.home']);

		await expect(
			createSanityPageImageStore(client, IMAGE_FOLDER).fetchReleaseVersions(['home', 'contact']),
		).resolves.toStrictEqual(['versions.r1.home']);
		expect(fake.fetch).toHaveBeenCalledWith(
			'*[_id in path("versions.**") && _type in $types]._id',
			{ types: ['home', 'contact'] },
			{ perspective: 'raw' },
		);
	});

	it('tells whether the image folder holds a file', async () => {
		const { client } = createFakeClient();
		const store = createSanityPageImageStore(client, IMAGE_FOLDER);

		await expect(store.hasImage('home-hero.webp')).resolves.toBe(true);
		await expect(store.hasImage('schwimmen-hero.webp')).resolves.toBe(false);
	});

	it('uploads a file of the image folder under its name and returns the asset id', async () => {
		const { client, fake } = createFakeClient();

		await expect(
			createSanityPageImageStore(client, IMAGE_FOLDER).uploadImage('home-hero.webp'),
		).resolves.toBe('image-abc-480x480-webp');
		expect(fake.assets.upload).toHaveBeenCalledWith('image', expect.anything(), {
			filename: 'home-hero.webp',
		});
	});

	it('sets the fields only on the revision it read', async () => {
		const { client, steps } = createFakeClient();

		await createSanityPageImageStore(client, IMAGE_FOLDER).patchDocument('home', 'r1', {
			heroImage: { _type: 'extendedImage' },
		});

		expect(steps).toStrictEqual([
			['patch', 'home'],
			['ifRevisionId', 'r1'],
			['set', { heroImage: { _type: 'extendedImage' } }],
			['commit'],
		]);
	});
});
