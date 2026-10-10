import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { PDFJS_VERSION, renderPdfPages } from '@tsgi-web/pdf-pages';

import { findPdfjsDataDir, renderPdfPagesWithData } from './pdfjs-data';

// The renderer has its own tests; here it only matters which data directory it is handed.
vi.mock(import('@tsgi-web/pdf-pages'), async (importOriginal) => ({
	...(await importOriginal()),
	// oxlint-disable-next-line typescript/require-await -- stands in for the async renderer
	renderPdfPages: vi.fn(async function* renderOnePage() {
		yield { height: 1, index: 1, jpeg: new Uint8Array(), text: '', width: 1 };
	}),
}));

describe('pdf.js data directory', () => {
	let root: string | undefined;

	afterEach(async () => {
		if (root) {
			await rm(root, { force: true, recursive: true });
		}
		root = undefined;
	});

	it('finds the pdfjs-dist package in the pnpm store of the monorepo', async () => {
		const dataDir = await findPdfjsDataDir();

		await expect(access(path.join(dataDir, 'wasm', 'openjpeg.wasm'))).resolves.toBeUndefined();
	});

	it('finds a store entry that carries a peer dependency suffix', async () => {
		root = await mkdtemp(path.join(os.tmpdir(), 'pdfjs-data-'));
		const entry = `pdfjs-dist@${PDFJS_VERSION}_abc123`;
		await mkdir(path.join(root, 'node_modules', '.pnpm', entry), { recursive: true });
		const app = path.join(root, 'apps', 'web');

		await expect(findPdfjsDataDir(app)).resolves.toBe(
			path.join(root, 'node_modules', '.pnpm', entry, 'node_modules', 'pdfjs-dist'),
		);
	});

	// The renderer checks the directory and fails the run with this path in its message.
	it('names the expected directory when the store is missing', async () => {
		root = await mkdtemp(path.join(os.tmpdir(), 'pdfjs-data-'));
		const app = path.join(root, 'apps', 'web');

		await expect(findPdfjsDataDir(app)).resolves.toBe(
			path.join(
				root,
				'node_modules',
				'.pnpm',
				`pdfjs-dist@${PDFJS_VERSION}`,
				'node_modules',
				'pdfjs-dist',
			),
		);
	});
});

describe('rendering with the pdf.js data', () => {
	it('hands the renderer the data directory it found', async () => {
		const bytes = new Uint8Array([0x25]);

		for await (const _page of renderPdfPagesWithData(bytes)) {
			// drain
		}

		expect(vi.mocked(renderPdfPages)).toHaveBeenCalledWith(bytes, {
			dataDir: await findPdfjsDataDir(),
		});
	});
});
