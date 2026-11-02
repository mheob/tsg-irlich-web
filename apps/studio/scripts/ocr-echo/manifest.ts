import { z } from 'zod';

import { isPdfInFolder } from '../shared/archive-folder';

/** A published id: no `drafts.` or `versions.<release>.` prefix, so no dots. */
const DOCUMENT_ID = /^[\w-]+$/u;

const KEY_LABELS: Record<UniqueKey, string> = {
	documentId: 'Dokumente',
	file: 'Dateien',
};

const manifestSchema = z
	.array(
		z.object({
			datei: z.string().refine(isPdfInFolder, 'muss eine PDF innerhalb des Ordners sein'),
			dokument: z
				.string()
				.regex(
					DOCUMENT_ID,
					'muss eine veröffentlichte Dokument-ID sein, ohne drafts. oder versions.',
				),
		}),
	)
	.min(1);

/**
 * Throws when two entries share a value that has to be unique.
 *
 * @param entries - The entries of the list.
 * @param key - The property to check.
 * @throws {Error} Naming every duplicate value.
 */
function assertUnique(entries: readonly OcrEntry[], key: UniqueKey): void {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const entry of entries) {
		if (seen.has(entry[key])) {
			duplicates.add(entry[key]);
		}
		seen.add(entry[key]);
	}
	if (duplicates.size > 0) {
		throw new Error(
			`Doppelte ${KEY_LABELS[key]} in der ocr-manifest.json: ${[...duplicates].join(', ')}`,
		);
	}
}

/**
 * Parses JSON without quoting it. `JSON.parse` puts the start of the text into its error, which for
 * a wrongly named file could be anything, so the message says only that it is no JSON.
 *
 * @param text - The file's content.
 * @returns The parsed value.
 * @throws {Error} For text that is no JSON.
 */
function readJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error('Die ocr-manifest.json ist kein gültiges JSON.');
	}
}

/**
 * Reads `ocr-manifest.json`: which PDF of the folder replaces the PDF of which issue.
 *
 * @param text - The file's content.
 * @returns The entries, in the order of the list.
 * @throws {Error} For text that is no JSON, an invalid entry, or a file or document listed twice,
 *   before anything is touched.
 */
function parseOcrManifestText(text: string): OcrEntry[] {
	const parsed = manifestSchema.safeParse(readJson(text));
	if (!parsed.success) {
		throw new Error(`Die ocr-manifest.json ist ungültig:\n${z.prettifyError(parsed.error)}`);
	}
	const entries = parsed.data.map((entry) => ({ documentId: entry.dokument, file: entry.datei }));
	assertUnique(entries, 'file');
	assertUnique(entries, 'documentId');
	return entries;
}

type UniqueKey = keyof OcrEntry;

interface OcrEntry {
	/** The published id of the issue, e.g. `echo-2024`. */
	documentId: string;
	/** The path of the PDF, relative to the folder. */
	file: string;
}

export { parseOcrManifestText };
export type { OcrEntry };
