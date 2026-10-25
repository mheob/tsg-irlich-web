import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/**
 * Reads the command line of the department migration.
 *
 * @param argv - The arguments after the script path.
 * @returns The dataset and whether to only read.
 * @throws {Error} For a missing dataset or an unknown option.
 */
function parseMigrationOptions(argv: readonly string[]): MigrationOptions {
	const { values } = parseArgs({
		allowNegative: true,
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: {
			dataset: { type: 'string' },
			'dry-run': { default: true, type: 'boolean' },
		},
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	return { dataset: values.dataset, dryRun: values['dry-run'] };
}

interface MigrationOptions {
	dataset: string;
	/** `true` unless `--no-dry-run` is given. */
	dryRun: boolean;
}

export { parseMigrationOptions };
export type { MigrationOptions };
