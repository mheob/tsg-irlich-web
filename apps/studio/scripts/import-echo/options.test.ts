// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseImportOptions } from './options';

// Made up per run, so no key-shaped literal sits in the repository.
const API_KEY = randomUUID();

const BASE = ['--dataset', 'development', '--folder', '/home/test/echo'];
const PLACE = { home: '/home/test', repository: '/home/test/dev/web' };

describe('the import options', () => {
	it('defaults to a dry run without a key and finds the manifest in the folder', () => {
		expect(parseImportOptions(BASE, {}, PLACE)).toStrictEqual({
			apiKey: undefined,
			dataset: 'development',
			dryRun: true,
			folder: path.resolve('/home/test/echo'),
			manifest: path.resolve('/home/test/echo/manifest.json'),
			releaseId: 'tsg-echo-archiv',
		});
	});

	it('writes with --no-dry-run and takes the key from the shell', () => {
		expect(
			parseImportOptions([...BASE, '--no-dry-run'], { ANTHROPIC_API_KEY: API_KEY }, PLACE),
		).toMatchObject({
			apiKey: API_KEY,
			dryRun: false,
		});
	});

	it('takes another manifest in the folder', () => {
		expect(parseImportOptions([...BASE, '--manifest', 'liste.json'], {}, PLACE).manifest).toBe(
			path.resolve('/home/test/echo/liste.json'),
		);
	});

	// Sonar S8707: an agent could pass any path, and a file that is no manifest must not be read.
	it.each([
		['a file outside the folder', '../secrets.json'],
		['an absolute path elsewhere', '/etc/hosts.json'],
		['a file that is not json', 'notes.txt'],
	])('rejects %s as manifest', (_label, manifest) => {
		expect(() => parseImportOptions([...BASE, '--manifest', manifest], {}, PLACE)).toThrow(
			'--manifest muss eine .json-Datei im Ordner sein.',
		);
	});

	it('requires the folder to lie in the home directory', () => {
		expect(() =>
			parseImportOptions(['--dataset', 'development', '--folder', '/tmp/echo'], {}, PLACE),
		).toThrow('--folder muss im Benutzerordner liegen (/home/test).');
	});

	// Real issues must never end up where git could pick them up.
	it.each(['/home/test/dev/web', '/home/test/dev/web/scratch'])(
		'rejects %s inside the repository',
		(folder) => {
			expect(() =>
				parseImportOptions(['--dataset', 'development', '--folder', folder], {}, PLACE),
			).toThrow('--folder darf nicht im Repository liegen: echte Ausgaben gehören nicht ins Git.');
		},
	);

	it('imports without intros and without a key on --no-intro', () => {
		expect(
			parseImportOptions([...BASE, '--no-dry-run', '--no-intro'], {}, PLACE).apiKey,
		).toBeUndefined();
	});

	// A dry run drafts nothing, so it never needs the key, even when the shell has one.
	it('leaves the key out of a dry run', () => {
		expect(parseImportOptions(BASE, { ANTHROPIC_API_KEY: API_KEY }, PLACE).apiKey).toBeUndefined();
	});

	// pnpm passes a literal `--` on to the script in some versions.
	it('ignores a leading -- separator', () => {
		expect(parseImportOptions(['--', ...BASE], {}, PLACE).dataset).toBe('development');
	});

	it.each([
		['the dataset', ['--folder', '/home/test/echo'], '--dataset fehlt'],
		['the folder', ['--dataset', 'development'], '--folder fehlt'],
	])('requires %s', (_label, argv, message) => {
		expect(() => parseImportOptions(argv, {}, PLACE)).toThrow(message);
	});

	it('requires a key for a real run with intros', () => {
		expect(() => parseImportOptions([...BASE, '--no-dry-run'], {}, PLACE)).toThrow(
			'ANTHROPIC_API_KEY fehlt. Ohne Intros importieren: --no-intro.',
		);
	});

	// Final review I3: a later run needs its own release once the first one is published or archived.
	it('takes another release id', () => {
		expect(
			parseImportOptions([...BASE, '--release', 'tsg-echo-archiv-2'], {}, PLACE).releaseId,
		).toBe('tsg-echo-archiv-2');
	});

	it('rejects a release id a document id cannot carry', () => {
		expect(() => parseImportOptions([...BASE, '--release', 'echo.archiv'], {}, PLACE)).toThrow(
			'--release darf nur Buchstaben, Ziffern, - und _ enthalten.',
		);
	});

	it('rejects an unknown option', () => {
		expect(() => parseImportOptions([...BASE, '--force'], {}, PLACE)).toThrow(
			"Unknown option '--force'",
		);
	});

	// The entry script derives the repository root from a URL, which ends in a slash.
	it('rejects the repository root given with a trailing slash', () => {
		expect(() =>
			parseImportOptions(
				['--dataset', 'development', '--folder', '/home/test/dev/web'],
				{},
				{
					...PLACE,
					repository: '/home/test/dev/web/',
				},
			),
		).toThrow('--folder darf nicht im Repository liegen');
	});
});
