// @vitest-environment node
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { PAGE_IMAGE_TARGETS } from './targets';

const IMAGE_FOLDER = path.join(import.meta.dirname, 'images');

function targetOf(documentType: string, field: string) {
	return PAGE_IMAGE_TARGETS.find(
		(target) => target.documentType === documentType && target.field === field,
	);
}

describe('the page image targets', () => {
	it('fills the hero image of the nine single pages and the three central images', () => {
		expect(
			PAGE_IMAGE_TARGETS.map(({ documentType, field }) => `${documentType}.${field}`),
		).toStrictEqual([
			'home.heroImage',
			'departmentsPage.heroImage',
			'aboutUs.heroImage',
			'membership.heroImage',
			'contact.heroImage',
			'imprint.heroImage',
			'privacy.heroImage',
			'accessibility.heroImage',
			'newsOverview.heroImage',
			'site-settings.visionImages',
			'site-settings.contactFormImages',
			'site-settings.fallbackImage',
		]);
	});

	it.each(['visionImages', 'contactFormImages'])('fills %s with a list of three', (field) => {
		expect(targetOf('site-settings', field)).toMatchObject({ isList: true });
		expect(targetOf('site-settings', field)?.images).toHaveLength(3);
	});

	it('fills every other field with a single image', () => {
		const singles = PAGE_IMAGE_TARGETS.filter((target) => !target.isList);

		expect(singles.map((target) => target.images.length)).toStrictEqual(singles.map(() => 1));
	});

	it('describes every image', () => {
		const alts = PAGE_IMAGE_TARGETS.flatMap((target) => target.images.map((image) => image.alt));

		expect(alts.filter((alt) => alt.trim() === '')).toStrictEqual([]);
	});

	it('finds every file in the image folder', async () => {
		const folder = await readdir(IMAGE_FOLDER);
		const files = PAGE_IMAGE_TARGETS.flatMap((target) =>
			target.images.map((image) => image.fileName),
		);

		expect(files.filter((file) => !folder.includes(file))).toStrictEqual([]);
	});

	// The legal pages show the photo of the contact page; their file was the same byte for byte.
	it('gives the contact page and the legal pages the same photo', () => {
		const files = ['contact', 'imprint', 'privacy', 'accessibility'].map(
			(type) => targetOf(type, 'heroImage')?.images[0]?.fileName,
		);

		expect(new Set(files)).toStrictEqual(new Set(['kontakt-hero.webp']));
	});

	it('uses the offer photo as the fallback image', () => {
		expect(targetOf('site-settings', 'fallbackImage')?.images).toStrictEqual(
			targetOf('departmentsPage', 'heroImage')?.images,
		);
	});
});
