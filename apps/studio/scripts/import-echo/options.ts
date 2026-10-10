import path from 'node:path';
import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/**
 * Reads the command line of the import.
 *
 * @param argv - The arguments after the script path.
 * @param env - The shell's environment, for `ANTHROPIC_API_KEY`.
 * @returns The options with absolute paths. The key is only set for a real run with intros.
 * @throws {Error} For a missing dataset or folder, an unknown option, or a real run with intros
 *   but no key.
 */
function parseImportOptions(
	argv: readonly string[],
	env: { ANTHROPIC_API_KEY?: string },
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
		},
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	if (!values.folder) {
		throw new Error('--folder fehlt: der Ordner mit den PDFs und der manifest.json.');
	}
	const withIntro = values.intro && !values['dry-run'];
	if (withIntro && !env.ANTHROPIC_API_KEY) {
		throw new Error('ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.');
	}
	return {
		apiKey: withIntro ? env.ANTHROPIC_API_KEY : undefined,
		dataset: values.dataset,
		dryRun: values['dry-run'],
		folder: path.resolve(values.folder),
		manifest: path.resolve(values.manifest ?? path.join(values.folder, 'manifest.json')),
	};
}

interface ImportOptions {
	/** Only set for a real run with intros. */
	apiKey: string | undefined;
	dataset: string;
	dryRun: boolean;
	folder: string;
	manifest: string;
}

export { parseImportOptions };
export type { ImportOptions };
