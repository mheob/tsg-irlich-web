import { access } from 'node:fs/promises';

/**
 * Tells whether a file or folder exists, without throwing for one that does not.
 *
 * @param file - The path to check.
 * @returns `true` if the path can be reached.
 */
async function pathExists(file: string): Promise<boolean> {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}

export { pathExists };
