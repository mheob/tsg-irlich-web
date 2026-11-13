import { parseArgs } from 'node:util';

const SEPARATOR = '--';

/**
 * Drops the separator `sanity exec` leaves in front of the script's own arguments.
 *
 * @param argv - The arguments after the script path.
 * @returns The arguments without the leading `--`.
 */
function withoutSeparator(argv: readonly string[]): string[] {
	return argv[0] === SEPARATOR ? argv.slice(1) : [...argv];
}

/**
 * Reads the dataset a script writes to. It has to be named, since the studio's `.env` points the
 * CLI at `production`.
 *
 * @param argv - The arguments after the script path, with or without the leading `--`.
 * @param flags - The boolean flags the script accepts besides `--dataset`, without their dashes.
 * @returns The dataset.
 * @throws {Error} For a missing dataset or an unknown option.
 */
function readDataset(argv: readonly string[], flags: readonly string[] = []): string {
	const { values } = parseArgs({
		args: withoutSeparator(argv),
		options: {
			dataset: { type: 'string' },
			...Object.fromEntries(flags.map((flag) => [flag, { type: 'boolean' as const }])),
		},
		strict: true,
	});
	if (typeof values.dataset !== 'string' || values.dataset === '') {
		throw new Error('--dataset fehlt, z. B. --dataset development.');
	}
	return values.dataset;
}

/**
 * Tells whether the arguments of a script set a boolean flag.
 *
 * @param argv - The arguments after the script path, with or without the leading `--`.
 * @param flag - The flag without its dashes.
 * @returns `true` if the flag is given.
 */
function hasFlag(argv: readonly string[], flag: string): boolean {
	return withoutSeparator(argv).includes(`${SEPARATOR}${flag}`);
}

export { hasFlag, readDataset };
