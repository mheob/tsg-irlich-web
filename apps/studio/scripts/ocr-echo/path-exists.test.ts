// @vitest-environment node
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { pathExists } from './path-exists';

describe('a path that may exist', () => {
	it('exists when the file is there', async () => {
		await expect(pathExists(import.meta.filename)).resolves.toBe(true);
	});

	it('exists when the folder is there', async () => {
		await expect(pathExists(import.meta.dirname)).resolves.toBe(true);
	});

	it('does not exist when nothing is there', async () => {
		await expect(pathExists(path.join(import.meta.dirname, 'gibt-es-nicht.pdf'))).resolves.toBe(
			false,
		);
	});
});
