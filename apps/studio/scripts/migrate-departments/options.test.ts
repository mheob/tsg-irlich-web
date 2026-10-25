// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { parseMigrationOptions } from './options';

describe('the migration options', () => {
	it('defaults to a dry run', () => {
		expect(parseMigrationOptions(['--dataset', 'development'])).toStrictEqual({
			dataset: 'development',
			dryRun: true,
		});
	});

	it('writes with --no-dry-run', () => {
		expect(parseMigrationOptions(['--dataset', 'production', '--no-dry-run'])).toStrictEqual({
			dataset: 'production',
			dryRun: false,
		});
	});

	// The same-id type swap is gone, and with it the probe that tried it.
	it('knows no --probe any more', () => {
		expect(() => parseMigrationOptions(['--dataset', 'development', '--probe'])).toThrow(
			"Unknown option '--probe'",
		);
	});

	it('requires the dataset', () => {
		expect(() => parseMigrationOptions(['--no-dry-run'])).toThrow(
			'--dataset fehlt, z. B. --dataset development.',
		);
	});

	// pnpm passes a literal `--` on to the script in some versions.
	it('ignores a leading -- separator', () => {
		expect(parseMigrationOptions(['--', '--dataset', 'development']).dataset).toBe('development');
	});

	it('rejects an unknown option', () => {
		expect(() => parseMigrationOptions(['--dataset', 'development', '--force'])).toThrow(
			"Unknown option '--force'",
		);
	});
});
