import path from 'node:path';

import { z } from 'zod';

import { slugify } from '@/utils/strings';

const ID_PREFIX = 'echo-archiv-';
const PDF_EXTENSION = /\.pdf$/iu;
const NON_ID_CHARACTERS = /[^a-z0-9]+/gu;
const EDGE_DASHES = /^-+|-+$/gu;

const KEY_LABELS: Record<UniqueKey, string> = {
	documentId: 'Dokument-IDs (aus dem Dateinamen)',
	slug: 'Slugs (aus dem Titel)',
};

/**
 * The id part a file name gives: lowercased, every other run of characters a dash.
 *
 * @param file - The path of the PDF, relative to the folder.
 * @returns The name without `.pdf`, empty when it has no letters or digits.
 */
function toIdPart(file: string): string {
	return path.posix
		.basename(file)
		.replace(PDF_EXTENSION, '')
		.toLowerCase()
		.replaceAll(NON_ID_CHARACTERS, '-')
		.replaceAll(EDGE_DASHES, '');
}

/**
 * The document id of an issue. It comes from the file name, so a rerun finds the same document and
 * a corrected title in the manifest does not create a second one.
 *
 * @param file - The path of the PDF, relative to the folder.
 * @returns The id, e.g. `echo-archiv-1979-01`.
 */
function toDocumentId(file: string): string {
	return `${ID_PREFIX}${toIdPart(file)}`;
}

/**
 * Whether a manifest path names a PDF inside the folder.
 *
 * @param file - The `datei` of an entry.
 * @returns `false` for an absolute path, a `..` segment, another extension or a name without
 *   letters or digits.
 */
function isImportablePdf(file: string): boolean {
	return (
		!path.isAbsolute(file) &&
		!file.split(/[/\\]/u).includes('..') &&
		PDF_EXTENSION.test(file) &&
		toIdPart(file) !== ''
	);
}

const manifestSchema = z
	.array(
		z.object({
			datei: z.string().refine(isImportablePdf, 'muss eine PDF innerhalb des Ordners sein'),
			erscheinungsdatum: z.iso.date(),
			titel: z.string().trim().min(1),
		}),
	)
	.min(1);

/**
 * Throws when two plans share a value that has to be unique.
 *
 * @param plans - The plans of the manifest.
 * @param key - The property to check.
 * @throws {Error} Naming every duplicate value.
 */
function assertUnique(plans: readonly IssuePlan[], key: UniqueKey): void {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const plan of plans) {
		if (seen.has(plan[key])) {
			duplicates.add(plan[key]);
		}
		seen.add(plan[key]);
	}
	if (duplicates.size > 0) {
		throw new Error(
			`Doppelte ${KEY_LABELS[key]} in der manifest.json: ${[...duplicates].join(', ')}`,
		);
	}
}

/**
 * Validates `manifest.json` and plans one document per entry.
 *
 * @param json - The parsed content of `manifest.json`.
 * @returns The plans, in the order of the manifest.
 * @throws {Error} For an invalid entry or a duplicate id or slug, before anything is written.
 */
function parseManifest(json: unknown): IssuePlan[] {
	const parsed = manifestSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(`Die manifest.json ist ungültig:\n${z.prettifyError(parsed.error)}`);
	}
	const plans = parsed.data.map((entry) => ({
		documentId: toDocumentId(entry.datei),
		file: entry.datei,
		releaseDate: entry.erscheinungsdatum,
		slug: slugify(entry.titel),
		title: entry.titel,
	}));
	assertUnique(plans, 'documentId');
	assertUnique(plans, 'slug');
	return plans;
}

type UniqueKey = 'documentId' | 'slug';

interface IssuePlan {
	documentId: string;
	/** The path of the PDF, relative to the folder. */
	file: string;
	/** `YYYY-MM-DD`. */
	releaseDate: string;
	slug: string;
	title: string;
}

export { parseManifest, toDocumentId };
export type { IssuePlan };
