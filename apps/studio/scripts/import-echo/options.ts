import path from 'node:path';
import { parseArgs } from 'node:util';

import { DEFAULT_RELEASE_ID } from './issue-document';

const SEPARATOR = '--';
/** A release id ends up inside document ids (`versions.<id>.<document>`), so no dots. */
const RELEASE_ID = /^[\w-]+$/u;

const MANIFEST_FILE = 'manifest.json';
const MANIFEST_EXTENSION = '.json';

/**
 * Whether a path lies strictly below a directory.
 *
 * @param child - An absolute path.
 * @param parent - An absolute directory.
 * @returns `true` when `child` is inside `parent`, not `parent` itself.
 */
function isInside(child: string, parent: string): boolean {
	const relative = path.relative(parent, child);
	return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Resolves `--folder` and keeps it in the home directory and out of the repository. The script
 * reads whatever the folder holds, and real issues must never land where git picks them up.
 *
 * @param value - The option's value.
 * @param place - The home directory and the repository root.
 * @returns The absolute folder.
 * @throws {Error} For a folder outside the home directory or inside the repository.
 */
function resolveFolder(value: string, place: ImportPlace): string {
	const folder = path.resolve(place.home, value);
	if (!isInside(folder, place.home)) {
		throw new Error(`--folder muss im Benutzerordner liegen (${place.home}).`);
	}
	const repository = path.resolve(place.repository);
	if (folder === repository || isInside(folder, repository)) {
		throw new Error(
			'--folder darf nicht im Repository liegen: echte Ausgaben gehören nicht ins Git.',
		);
	}
	return folder;
}

/**
 * Resolves `--manifest` inside the folder, so no other file on the machine can be read as one.
 *
 * @param value - The option's value, `manifest.json` when left out.
 * @param folder - The resolved folder.
 * @returns The absolute manifest path.
 * @throws {Error} For a path outside the folder or a file that is not `.json`.
 */
function resolveManifest(value: string | undefined, folder: string): string {
	const manifest = path.resolve(folder, value ?? MANIFEST_FILE);
	if (!isInside(manifest, folder) || path.extname(manifest) !== MANIFEST_EXTENSION) {
		throw new Error('--manifest muss eine .json-Datei im Ordner sein.');
	}
	return manifest;
}

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
 * Checks the id `--release` names.
 *
 * @param value - The option's value.
 * @returns The id.
 * @throws {Error} For an id with a dot or another character a document id cannot carry.
 */
function readReleaseId(value: string): string {
	if (!RELEASE_ID.test(value)) {
		throw new Error('--release darf nur Buchstaben, Ziffern, - und _ enthalten.');
	}
	return value;
}

/**
 * Reads the command line of the import.
 *
 * @param argv - The arguments after the script path.
 * @param env - The shell's environment, for `ANTHROPIC_API_KEY`.
 * @param place - The home directory and the repository root the paths are checked against.
 * @returns The options with absolute paths. The key is only set for a real run with intros.
 * @throws {Error} For a missing dataset or folder, a path outside the allowed places, an unknown
 *   option, or a real run with intros but no key.
 */
function parseImportOptions(
	argv: readonly string[],
	env: { ANTHROPIC_API_KEY?: string },
	place: ImportPlace,
): ImportOptions {
	const { values } = parseArgs({
		allowNegative: true,
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: {
			dataset: { type: 'string' },
			'dry-run': { default: true, type: 'boolean' },
			folder: { type: 'string' },
			intro: { default: true, type: 'boolean' },
			manifest: { type: 'string' },
			release: { default: DEFAULT_RELEASE_ID, type: 'string' },
		},
		strict: true,
	});
	const dataset = required(values.dataset, '--dataset fehlt, z. B. --dataset development.');
	const folder = resolveFolder(
		required(values.folder, '--folder fehlt: der Ordner mit den PDFs und der manifest.json.'),
		place,
	);
	const releaseId = readReleaseId(values.release);
	const withIntro = values.intro && !values['dry-run'];
	if (withIntro && !env.ANTHROPIC_API_KEY) {
		throw new Error('ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.');
	}
	return {
		apiKey: withIntro ? env.ANTHROPIC_API_KEY : undefined,
		dataset,
		dryRun: values['dry-run'],
		folder,
		manifest: resolveManifest(values.manifest, folder),
		releaseId,
	};
}

interface ImportPlace {
	home: string;
	repository: string;
}

interface ImportOptions {
	/** Only set for a real run with intros. */
	apiKey: string | undefined;
	dataset: string;
	dryRun: boolean;
	folder: string;
	manifest: string;
	releaseId: string;
}

export { parseImportOptions };
export type { ImportOptions, ImportPlace };
