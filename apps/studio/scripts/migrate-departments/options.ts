import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/**
 * Reads the command line of the department migration.
 *
 * @param argv - The arguments after the script path.
 * @returns The dataset, whether to only read, and whether to only run the type swap probe.
 * @throws {Error} For a missing dataset, `--probe` without `--no-dry-run`, or an unknown option.
 */
function parseMigrationOptions(argv: readonly string[]): MigrationOptions {
	const { values } = parseArgs({
		allowNegative: true,
		args: argv[0] === SEPARATOR ? argv.slice(1) : [...argv],
		options: {
			dataset: { type: 'string' },
			'dry-run': { default: true, type: 'boolean' },
			probe: { default: false, type: 'boolean' },
		},
		strict: true,
	});
	if (!values.dataset) {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	if (values.probe && values['dry-run']) {
		throw new Error(
			'--probe legt zwei Testdokumente an und löscht sie wieder, braucht also --no-dry-run.',
		);
	}
	return { dataset: values.dataset, dryRun: values['dry-run'], probe: values.probe };
}

interface MigrationOptions {
	dataset: string;
	/** `true` unless `--no-dry-run` is given. */
	dryRun: boolean;
	/** Only runs the type swap probe, which writes and deletes two documents of its own, so it needs `--no-dry-run`. */
	probe: boolean;
}

export { parseMigrationOptions };
export type { MigrationOptions };
