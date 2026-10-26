// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { runPageImageMigration, summarize } from './run';
import { PAGE_IMAGE_TARGETS } from './targets';
import { createFakePageImageStore } from './test-utils/fake-store';

const PAGE_TYPES = [
	'home',
	'departmentsPage',
	'aboutUs',
	'membership',
	'contact',
	'imprint',
	'privacy',
	'accessibility',
	'newsOverview',
	'site-settings',
];

/**
 * One published document per page type, as the dataset holds them before the migration.
 *
 * @returns The documents.
 */
function publishedPages(): { _id: string; _type: string }[] {
	return PAGE_TYPES.map((type) => ({ _id: type, _type: type }));
}

/**
 * The keys of the items of a list field.
 *
 * @param value - The value of the field.
 * @returns The `_key` of every item, in order.
 */
function keysOf(value: unknown): string[] {
	return (value as { _key: string }[]).map((item) => item._key);
}

describe('the page image migration', () => {
	it('sets the field on the published document and on its draft', async () => {
		const { byId, store } = createFakePageImageStore({
			documents: [...publishedPages(), { _id: 'drafts.contact', _type: 'contact' }],
		});

		await runPageImageMigration(store, { dryRun: false });

		expect(byId.get('contact')?.heroImage).toMatchObject({ _type: 'extendedImage' });
		expect(byId.get('drafts.contact')?.heroImage).toMatchObject({ _type: 'extendedImage' });
	});

	it('writes an extended image with its alt text and a reference to the uploaded file', async () => {
		const { byId, store } = createFakePageImageStore({ documents: publishedPages() });

		await runPageImageMigration(store, { dryRun: false });

		expect(byId.get('membership')?.heroImage).toStrictEqual({
			_type: 'extendedImage',
			alt: 'Zwei Personen geben sich über einem Schreibtisch mit Klemmbrett und Kugelschreiber die Hand',
			asset: { _ref: 'image-mitgliedschaft-hero-webp', _type: 'reference' },
		});
	});

	it('leaves a document whose field the editors already set alone', async () => {
		const ownImage = { _type: 'extendedImage', alt: 'Eigenes Bild' };
		const documents = [
			...publishedPages().filter((page) => page._id !== 'aboutUs'),
			{ _id: 'aboutUs', _type: 'aboutUs', heroImage: ownImage },
		];
		const { byId, store } = createFakePageImageStore({ documents });

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(byId.get('aboutUs')?.heroImage).toBe(ownImage);
		expect(report.skipped).toStrictEqual(['aboutUs.heroImage']);
	});

	it('uploads every file once although several fields use it', async () => {
		const { store, uploads } = createFakePageImageStore({ documents: publishedPages() });

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(uploads).toHaveLength(12);
		expect(new Set(uploads).size).toBe(12);
		expect(report.uploaded).toBe(12);
	});

	it('patches the site settings once with all three central images', async () => {
		const { byId, patches, store } = createFakePageImageStore({ documents: publishedPages() });

		await runPageImageMigration(store, { dryRun: false });

		expect(patches.filter((id) => id === 'site-settings')).toHaveLength(1);
		expect(
			['visionImages', 'contactFormImages', 'fallbackImage'].filter(
				(field) => byId.get('site-settings')?.[field] === undefined,
			),
		).toStrictEqual([]);
	});

	it('gives list items their file name as key and keeps the order', async () => {
		const { byId, store } = createFakePageImageStore({ documents: publishedPages() });

		await runPageImageMigration(store, { dryRun: false });

		expect(keysOf(byId.get('site-settings')?.visionImages)).toStrictEqual([
			'vision-1',
			'vision-2',
			'vision-3',
		]);
		expect(keysOf(byId.get('site-settings')?.contactFormImages)).toStrictEqual([
			'contact-form-1',
			'contact-form-2',
			'contact-form-3',
		]);
	});

	it('writes nothing in a dry run', async () => {
		const { patches, store, uploads } = createFakePageImageStore({ documents: publishedPages() });

		const report = await runPageImageMigration(store, { dryRun: true });

		expect(uploads).toStrictEqual([]);
		expect(patches).toStrictEqual([]);
		expect(report.patched).toHaveLength(PAGE_TYPES.length);
		expect(report.uploaded).toBe(12);
	});

	it('writes nothing at all when an image file is missing', async () => {
		const { patches, store, uploads } = createFakePageImageStore({
			documents: publishedPages(),
			missingFiles: ['vision-2.webp'],
		});

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(uploads).toStrictEqual([]);
		expect(patches).toStrictEqual([]);
		expect(report.problems).toStrictEqual(['Bilddatei fehlt: vision-2.webp']);
	});

	it('reports a document type without any document', async () => {
		const { store } = createFakePageImageStore({
			documents: publishedPages().filter((page) => page._type !== 'privacy'),
		});

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(report.problems).toStrictEqual(['Kein Dokument vom Typ privacy']);
	});

	it('reports release versions and does not patch them', async () => {
		const { patches, store } = createFakePageImageStore({
			documents: publishedPages(),
			releaseVersions: ['versions.sommer.home'],
		});

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(report.problems).toStrictEqual([
			'Version in einem Release bleibt unverändert: versions.sommer.home. Vor dem Veröffentlichen des Releases dort die Bilder setzen oder die Version verwerfen, sonst entfernt das Veröffentlichen die migrierten Bilder.',
		]);
		expect(patches).not.toContain('versions.sommer.home');
	});

	it('changes nothing on a second run', async () => {
		const { patches, store, uploads } = createFakePageImageStore({ documents: publishedPages() });
		await runPageImageMigration(store, { dryRun: false });
		patches.length = 0;
		uploads.length = 0;

		const report = await runPageImageMigration(store, { dryRun: false });

		expect(patches).toStrictEqual([]);
		expect(uploads).toStrictEqual([]);
		expect(report.skipped).toHaveLength(PAGE_IMAGE_TARGETS.length);
	});
});

describe('the page image migration summary', () => {
	const report = {
		patched: ['home: heroImage', 'site-settings: visionImages, contactFormImages, fallbackImage'],
		problems: ['Kein Dokument vom Typ privacy'],
		skipped: ['aboutUs.heroImage'],
		uploaded: 12,
	};

	it('says that a dry run wrote nothing', () => {
		expect(summarize(report, true)).toStrictEqual([
			'Probelauf, geschrieben wurde nichts. Ein echter Lauf würde:',
			'  Bilder hochladen: 12',
			'  Dokumente ändern: 2',
			'    home: heroImage',
			'    site-settings: visionImages, contactFormImages, fallbackImage',
			'  Felder überspringen, weil schon gesetzt: 1',
			'    aboutUs.heroImage',
			'Probleme (1):',
			'  Kein Dokument vom Typ privacy',
		]);
	});

	it('lists what a real run wrote', () => {
		expect(summarize({ ...report, problems: [] }, false)).toStrictEqual([
			'Geschrieben:',
			'  Bilder hochgeladen: 12',
			'  Dokumente geändert: 2',
			'    home: heroImage',
			'    site-settings: visionImages, contactFormImages, fallbackImage',
			'  Felder übersprungen, weil schon gesetzt: 1',
			'    aboutUs.heroImage',
			'Keine Probleme.',
		]);
	});
});
