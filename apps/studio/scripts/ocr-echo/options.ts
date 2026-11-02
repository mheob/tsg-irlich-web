import { parseArgs } from 'node:util';

import { resolveFolder, resolveListFile } from '../shared/archive-folder';
import type { ArchivePlace } from '../shared/archive-folder';

const SEPARATOR = '--';
const MANIFEST_FILE = 'ocr-manifest.json';

/**
 * Returns an option that has to be given.
 *
 * @param value - The option's value.
 * @param message - The German message when it is missing.
 * @returns The value.
 * @throws {Error} When the value is missing or empty.
 */
function required(value: string | undefined, message: string): string {
	if (!value) {
		throw new Error(message);
	}
	return value;
}

/**
 * Reads the command line of the text layer script.
 *
 * @param argv - The arguments after the script path.
 * @param place - The home directory and the repository root the paths are checked against.
 * @returns The options with absolute paths.
 * @throws {Error} For a missing dataset or folder, a path outside the allowed places, or an unknown
 *   option.
 */
function parseOcrOptions(argv: readonly string[], place: ArchivePlace): OcrOptions {
	const { values } = parseArgs({
		allowNegative: true,
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: {
			dataset: { type: 'string' },
			'dry-run': { default: true, type: 'boolean' },
			folder: { type: 'string' },
			manifest: { type: 'string' },
		},
		strict: true,
	});
	const dataset = required(values.dataset, '--dataset fehlt, z. B. --dataset development.');
	const folder = resolveFolder(
		required(values.folder, '--folder fehlt: der Ordner mit den PDFs und der ocr-manifest.json.'),
		place,
	);
	return {
		dataset,
		dryRun: values['dry-run'],
		folder,
		manifest: resolveListFile(values.manifest, folder, MANIFEST_FILE),
	};
}

interface OcrOptions {
	dataset: string;
	dryRun: boolean;
	folder: string;
	manifest: string;
}

export { parseOcrOptions };
export type { OcrOptions };
