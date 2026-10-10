// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseImportOptions } from './options';

// Made up per run, so no key-shaped literal sits in the repository.
const API_KEY = randomUUID();

const BASE = ['--dataset', 'development', '--folder', '/tmp/echo'];

describe('the import options', () => {
	it('defaults to a dry run without a key and finds the manifest in the folder', () => {
		expect(parseImportOptions(BASE, {})).toStrictEqual({
			apiKey: undefined,
			dataset: 'development',
			dryRun: true,
			folder: path.resolve('/tmp/echo'),
			manifest: path.resolve('/tmp/echo/manifest.json'),
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('writes with --no-dry-run and takes the key from the shell', () => {
		expect(
			parseImportOptions([...BASE, '--no-dry-run'], { ANTHROPIC_API_KEY: API_KEY }),
		).toMatchObject({
			apiKey: API_KEY,
			dryRun: false,
		});
	});

	it('takes another manifest', () => {
		expect(parseImportOptions([...BASE, '--manifest', '/tmp/liste.json'], {}).manifest).toBe(
			path.resolve('/tmp/liste.json'),
		);
	});

	it('imports without intros and without a key on --no-intro', () => {
		expect(parseImportOptions([...BASE, '--no-dry-run', '--no-intro'], {}).apiKey).toBeUndefined();
	});

	// A dry run drafts nothing, so it never needs the key, even when the shell has one.
	it('leaves the key out of a dry run', () => {
		expect(parseImportOptions(BASE, { ANTHROPIC_API_KEY: API_KEY }).apiKey).toBeUndefined();
	});

	// pnpm passes a literal `--` on to the script in some versions.
	it('ignores a leading -- separator', () => {
		expect(parseImportOptions(['--', ...BASE], {}).dataset).toBe('development');
	});

	it.each([
		['the dataset', ['--folder', '/tmp/echo'], '--dataset fehlt'],
		['the folder', ['--dataset', 'development'], '--folder fehlt'],
	])('requires %s', (_label, argv, message) => {
		expect(() => parseImportOptions(argv, {})).toThrow(message);
	});

	it('requires a key for a real run with intros', () => {
		expect(() => parseImportOptions([...BASE, '--no-dry-run'], {})).toThrow(
			'ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.',
		);
	});

	// Final review I3: a later run needs its own release once the first one is published or archived.
	it('takes another release id', () => {
		expect(parseImportOptions([...BASE, '--release', 'tsg-echo-archiv-2'], {}).releaseId).toBe(
			'tsg-echo-archiv-2',
		);
	});

	it('rejects a release id a document id cannot carry', () => {
		expect(() => parseImportOptions([...BASE, '--release', 'echo.archiv'], {})).toThrow(
			'--release darf nur Buchstaben, Ziffern, - und _ enthalten.',
		);
	});

	it('rejects an unknown option', () => {
		expect(() => parseImportOptions([...BASE, '--force'], {})).toThrow("Unknown option '--force'");
	});
});
