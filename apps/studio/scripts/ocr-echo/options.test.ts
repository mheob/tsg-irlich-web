// @vitest-environment node
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseOcrOptions } from './options';

const PLACE = { home: '/home/test', repository: '/home/test/dev/customer/tsg/tsg-irlich-web' };
const BASE = ['--dataset', 'development', '--folder', 'dev/customer/tsg/echo-archiv'];

describe('the text layer options', () => {
	it('defaults to a dry run and finds ocr-manifest.json in the folder', () => {
		expect(parseOcrOptions(BASE, PLACE)).toStrictEqual({
			dataset: 'development',
			dryRun: true,
			folder: path.resolve('/home/test/dev/customer/tsg/echo-archiv'),
			manifest: path.resolve('/home/test/dev/customer/tsg/echo-archiv/ocr-manifest.json'),
		});
	});

	it('ignores the separator pnpm passes on and writes with --no-dry-run', () => {
		expect(parseOcrOptions(['--', ...BASE, '--no-dry-run'], PLACE).dryRun).toBe(false);
	});

	it('takes another list in the folder', () => {
		expect(parseOcrOptions([...BASE, '--manifest', 'nur-2024.json'], PLACE).manifest).toBe(
			path.resolve('/home/test/dev/customer/tsg/echo-archiv/nur-2024.json'),
		);
	});

	it('needs a dataset', () => {
		expect(() => parseOcrOptions(['--folder', 'echo'], PLACE)).toThrow(
			'--dataset fehlt, z. B. --dataset development.',
		);
	});

	it('needs a folder', () => {
		expect(() => parseOcrOptions(['--dataset', 'development'], PLACE)).toThrow(
			'--folder fehlt: der Ordner mit den PDFs und der ocr-manifest.json.',
		);
	});

	it('refuses a folder inside the repository', () => {
		expect(() =>
			parseOcrOptions(
				['--dataset', 'development', '--folder', 'dev/customer/tsg/tsg-irlich-web/tmp'],
				PLACE,
			),
		).toThrow('--folder darf nicht im Repository liegen: echte Ausgaben gehören nicht ins Git.');
	});

	it('refuses a list outside the folder', () => {
		expect(() => parseOcrOptions([...BASE, '--manifest', '../x.json'], PLACE)).toThrow(
			'--manifest muss eine .json-Datei im Ordner sein.',
		);
	});

	it('refuses an unknown option', () => {
		expect(() => parseOcrOptions([...BASE, '--intro'], PLACE)).toThrow(/--intro/u);
	});
});
