import path from 'node:path';

const LIST_EXTENSION = '.json';
const PDF_EXTENSION = /\.pdf$/iu;

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
 * Resolves `--folder` and keeps it in the home directory and out of the repository. The scripts
 * read whatever the folder holds, and real issues must never land where git picks them up.
 *
 * @param value - The option's value.
 * @param place - The home directory and the repository root.
 * @returns The absolute folder.
 * @throws {Error} For a folder outside the home directory or inside the repository.
 */
function resolveFolder(value: string, place: ArchivePlace): string {
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
 * Resolves `--manifest` inside the folder, so no other file on the machine can be read as a list.
 *
 * @param value - The option's value, `defaultName` when left out.
 * @param folder - The resolved folder.
 * @param defaultName - The list's file name when the option is left out.
 * @returns The absolute path of the list.
 * @throws {Error} For a path outside the folder or a file that is not `.json`.
 */
function resolveListFile(value: string | undefined, folder: string, defaultName: string): string {
	const list = path.resolve(folder, value ?? defaultName);
	if (!isInside(list, folder) || path.extname(list) !== LIST_EXTENSION) {
		throw new Error('--manifest muss eine .json-Datei im Ordner sein.');
	}
	return list;
}

/**
 * Whether a path from a list names a PDF inside the folder.
 *
 * @param file - The path, relative to the folder.
 * @returns `false` for an absolute path, a `..` segment or another extension.
 */
function isPdfInFolder(file: string): boolean {
	return !path.isAbsolute(file) && !file.split(/[/\\]/u).includes('..') && PDF_EXTENSION.test(file);
}

interface ArchivePlace {
	home: string;
	repository: string;
}

export { isPdfInFolder, resolveFolder, resolveListFile };
export type { ArchivePlace };
