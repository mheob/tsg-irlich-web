// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test';

import { hasFlag, readDataset } from './read-dataset';

describe('the dataset of a script', () => {
	it('reads the dataset after the separator of sanity exec', () => {
		expect(readDataset(['--', '--dataset', 'production'])).toBe('production');
	});

	it('reads the dataset without a separator', () => {
		expect(readDataset(['--dataset', 'development'])).toBe('development');
	});

	it('refuses to guess a dataset', () => {
		expect(() => readDataset([])).toThrow('--dataset fehlt, z. B. --dataset development.');
	});

	it('refuses an option the script does not know', () => {
		expect(() => readDataset(['--dataset', 'development', '--force'])).toThrow();
	});

	it('accepts a flag the script names', () => {
		expect(
			readDataset(
				['--', '--dataset', 'development', '--with-placeholder-positions'],
				['with-placeholder-positions'],
			),
		).toBe('development');
	});
});

describe('a flag of a script', () => {
	it('is set when the arguments name it', () => {
		expect(
			hasFlag(
				['--', '--dataset', 'development', '--with-placeholder-positions'],
				'with-placeholder-positions',
			),
		).toBe(true);
	});

	it('is not set otherwise', () => {
		expect(hasFlag(['--', '--dataset', 'development'], 'with-placeholder-positions')).toBe(false);
	});
});
