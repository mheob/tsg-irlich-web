import type { PageImageDocument, PageImageStore } from './store';
import type { ImageFile, PageImageTarget } from './targets';
import { PAGE_IMAGE_TARGETS } from './targets';

/** What a run did, or in a dry run would do. */
interface PageImageReport {
	/** Every document the run changes, with the fields it sets (`home: heroImage`). */
	patched: string[];
	problems: string[];
	/** Every field the editors already set (`aboutUs.heroImage`), left alone. */
	skipped: string[];
	/** The number of distinct files the run uploads. */
	uploaded: number;
}

/**
 * The value of an image field: an extended image that references the uploaded file, as an item of
 * a list with the file name as key.
 *
 * @param image - The file and its alt text.
 * @param assetId - The id of the uploaded asset.
 * @param isListItem - Whether the image is an item of a list field.
 * @returns The image object.
 */
function buildImage(
	image: ImageFile,
	assetId: string,
	isListItem: boolean,
): Record<string, unknown> {
	return {
		...(isListItem && { _key: image.fileName.replace(/\.[^.]+$/u, '') }),
		_type: 'extendedImage',
		alt: image.alt,
		asset: { _ref: assetId, _type: 'reference' },
	};
}

/**
 * Groups the targets by document type, keeping their order.
 *
 * @param targets - The fields the migration fills.
 * @returns The targets per document type.
 */
function groupByType(targets: readonly PageImageTarget[]): Map<string, PageImageTarget[]> {
	const byType = new Map<string, PageImageTarget[]>();
	for (const target of targets) {
		byType.set(target.documentType, [...(byType.get(target.documentType) ?? []), target]);
	}
	return byType;
}

/**
 * The values of the fields a document still lacks, keyed by field name.
 *
 * @param targets - The fields to fill.
 * @param resolveAsset - Hands out the asset id of a file, uploading it on first use.
 * @returns The field values, in the order of the targets.
 */
async function buildFields(
	targets: readonly PageImageTarget[],
	resolveAsset: (fileName: string) => Promise<string>,
): Promise<Record<string, unknown>> {
	const fields: Record<string, unknown> = {};
	for (const target of targets) {
		// oxlint-disable-next-line no-await-in-loop -- the fields of one document, one after the other
		const images = await Promise.all(
			target.images.map(async (image) =>
				buildImage(image, await resolveAsset(image.fileName), target.isList),
			),
		);
		fields[target.field] = target.isList ? images : images[0];
	}
	return fields;
}

/** Hands out the asset id of a file and counts the files a run needs. */
interface AssetResolver {
	/** The number of distinct files handed out so far. */
	count: () => number;
	/** The asset id of the file, uploaded on first use; in a dry run a placeholder. */
	resolve: (fileName: string) => Promise<string>;
}

/**
 * Uploads each file once, on first use. A dry run uploads nothing and only counts the files.
 *
 * @param store - The dataset.
 * @param dryRun - Whether the run only reads.
 * @returns The resolver.
 */
function createAssetResolver(store: PageImageStore, dryRun: boolean): AssetResolver {
	const assetIds = new Map<string, Promise<string>>();
	return {
		count: () => assetIds.size,
		resolve: async (fileName) => {
			const known = assetIds.get(fileName);
			if (known) {
				return known;
			}
			const assetId = dryRun ? Promise.resolve(fileName) : store.uploadImage(fileName);
			assetIds.set(fileName, assetId);
			return assetId;
		},
	};
}

/**
 * The files of the targets the image folder lacks.
 *
 * @param store - The dataset and the image folder.
 * @returns The missing file names.
 */
async function findMissingFiles(store: PageImageStore): Promise<string[]> {
	const fileNames = [
		...new Set(
			PAGE_IMAGE_TARGETS.flatMap((target) => target.images.map((image) => image.fileName)),
		),
	];
	const checks = await Promise.all(
		fileNames.map(async (name) => ({ found: await store.hasImage(name), name })),
	);
	return checks.filter((check) => !check.found).map((check) => check.name);
}

/**
 * Fills the empty image fields of one document with a single patch, guarded by the revision it was
 * read at.
 *
 * @param document - The published document or the draft.
 * @param targets - The image fields of its type.
 * @param context - The dataset, the resolver, the report and whether to write.
 * @param context.assets - Hands out the asset ids.
 * @param context.dryRun - Read only.
 * @param context.report - Collects what the run does.
 * @param context.store - The dataset.
 */
async function migrateDocument(
	document: PageImageDocument,
	targets: readonly PageImageTarget[],
	{ assets, dryRun, report, store }: MigrationContext,
): Promise<void> {
	report.skipped.push(...document.setFields.map((field) => `${document._id}.${field}`));
	const missingTargets = targets.filter((target) => !document.setFields.includes(target.field));
	if (missingTargets.length === 0) {
		return;
	}

	const fields = await buildFields(missingTargets, assets.resolve);
	if (!dryRun) {
		await store.patchDocument(document._id, document._rev, fields);
	}
	report.patched.push(`${document._id}: ${Object.keys(fields).join(', ')}`);
}

/**
 * Fills the empty image fields of every document of one type, published and draft.
 *
 * @param documentType - The page type.
 * @param targets - Its image fields.
 * @param context - The dataset, the resolver, the report and whether to write.
 */
async function migrateType(
	documentType: string,
	targets: readonly PageImageTarget[],
	context: MigrationContext,
): Promise<void> {
	const documents = await context.store.fetchDocuments(
		documentType,
		targets.map((target) => target.field),
	);
	if (documents.length === 0) {
		context.report.problems.push(`Kein Dokument vom Typ ${documentType}`);
	}
	for (const document of documents) {
		// oxlint-disable-next-line no-await-in-loop -- one patch after the other, each guarded by its revision
		await migrateDocument(document, targets, context);
	}
}

interface MigrationContext {
	assets: AssetResolver;
	dryRun: boolean;
	report: PageImageReport;
	store: PageImageStore;
}

/**
 * The problems the release versions of the page types make: the run leaves them alone.
 *
 * @param store - The dataset.
 * @param documentTypes - The page types.
 * @returns One problem per release version.
 */
async function describeReleaseVersions(
	store: PageImageStore,
	documentTypes: readonly string[],
): Promise<string[]> {
	const versions = await store.fetchReleaseVersions(documentTypes);
	return versions.map((id) => `Version in einem Release bleibt unverändert: ${id}`);
}

/**
 * Puts the images that lived in the web app into the empty image fields of the page documents and
 * the site settings. A field the editors already set is left alone, so a second run writes nothing.
 * A missing file stops the run before anything is written.
 *
 * @param store - The dataset.
 * @param options - The run options.
 * @param options.dryRun - Read only and report what a real run would write.
 * @returns What the run did.
 */
async function runPageImageMigration(
	store: PageImageStore,
	{ dryRun }: { dryRun: boolean },
): Promise<PageImageReport> {
	const report: PageImageReport = { patched: [], problems: [], skipped: [], uploaded: 0 };
	const missing = await findMissingFiles(store);
	if (missing.length > 0) {
		return { ...report, problems: missing.map((name) => `Bilddatei fehlt: ${name}`) };
	}

	const byType = groupByType(PAGE_IMAGE_TARGETS);
	report.problems.push(...(await describeReleaseVersions(store, [...byType.keys()])));
	const context: MigrationContext = {
		assets: createAssetResolver(store, dryRun),
		dryRun,
		report,
		store,
	};
	for (const [documentType, targets] of byType) {
		// oxlint-disable-next-line no-await-in-loop -- one document type after the other
		await migrateType(documentType, targets, context);
	}
	return { ...report, uploaded: context.assets.count() };
}

/**
 * The lines the script prints after a run.
 *
 * @param report - What the run did.
 * @param dryRun - Whether the run only read.
 * @returns The lines, in German like everything the editors and the maintainers read.
 */
function summarize(report: PageImageReport, dryRun: boolean): string[] {
	return [
		dryRun ? 'Probelauf, geschrieben wurde nichts. Ein echter Lauf würde:' : 'Geschrieben:',
		`  Bilder ${dryRun ? 'hochladen' : 'hochgeladen'}: ${report.uploaded}`,
		`  Dokumente ${dryRun ? 'ändern' : 'geändert'}: ${report.patched.length}`,
		...report.patched.map((line) => `    ${line}`),
		`  Felder ${dryRun ? 'überspringen' : 'übersprungen'}, weil schon gesetzt: ${report.skipped.length}`,
		...report.skipped.map((line) => `    ${line}`),
		report.problems.length > 0 ? `Probleme (${report.problems.length}):` : 'Keine Probleme.',
		...report.problems.map((problem) => `  ${problem}`),
	];
}

export { runPageImageMigration, summarize };
export type { PageImageReport };
