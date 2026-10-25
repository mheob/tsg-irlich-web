// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { parseMigrationOptions } from './options';

describe('the migration options', () => {
	it('defaults to a dry run without the probe', () => {
		expect(parseMigrationOptions(['--dataset', 'development'])).toStrictEqual({
			dataset: 'development',
			dryRun: true,
			probe: false,
		});
	});

	it('writes with --no-dry-run', () => {
		expect(parseMigrationOptions(['--dataset', 'production', '--no-dry-run'])).toStrictEqual({
			dataset: 'production',
			dryRun: false,
			probe: false,
		});
	});

	it('runs only the probe with --probe --no-dry-run', () => {
		expect(
			parseMigrationOptions(['--dataset', 'development', '--probe', '--no-dry-run']),
		).toStrictEqual({ dataset: 'development', dryRun: false, probe: true });
	});

	// The probe writes, so it must never pass for a dry run.
	it('requires --no-dry-run for the probe', () => {
		expect(() => parseMigrationOptions(['--dataset', 'development', '--probe'])).toThrow(
			'--probe legt zwei Testdokumente an und löscht sie wieder, braucht also --no-dry-run.',
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
