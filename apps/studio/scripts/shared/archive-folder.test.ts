// @vitest-environment node
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { isPdfInFolder, resolveFolder, resolveListFile } from './archive-folder';

const PLACE = { home: '/home/test', repository: '/home/test/dev/web' };

describe('the archive folder rules', () => {
	it('accepts a PDF path inside the folder, spaces and parentheses included', () => {
		expect(isPdfInFolder('1980-1989/1984 - TSG Irlich - 1.Echo.pdf')).toBe(true);
		expect(isPdfInFolder('ab 2024 (neues ECHO)/2025_TSG_ECHO_Web_Text.PDF')).toBe(true);
	});

	it('rejects an absolute path, a parent segment and another extension', () => {
		expect(isPdfInFolder('/etc/echo.pdf')).toBe(false);
		expect(isPdfInFolder('../echo.pdf')).toBe(false);
		expect(isPdfInFolder(String.raw`ordner\..\echo.pdf`)).toBe(false);
		expect(isPdfInFolder('echo.txt')).toBe(false);
	});

	it('keeps the folder in the home directory and out of the repository', () => {
		expect(resolveFolder('echo', PLACE)).toBe(path.resolve('/home/test/echo'));
		expect(() => resolveFolder('/tmp/echo', PLACE)).toThrow(
			'--folder muss im Benutzerordner liegen (/home/test).',
		);
		expect(() => resolveFolder('dev/web/echo', PLACE)).toThrow(
			'--folder darf nicht im Repository liegen: echte Ausgaben gehören nicht ins Git.',
		);
	});

	it('finds the list under its default name and refuses one outside the folder', () => {
		expect(resolveListFile(undefined, '/home/test/echo', 'ocr-manifest.json')).toBe(
			path.resolve('/home/test/echo/ocr-manifest.json'),
		);
		expect(() => resolveListFile('../liste.json', '/home/test/echo', 'ocr-manifest.json')).toThrow(
			'--manifest muss eine .json-Datei im Ordner sein.',
		);
	});
});
