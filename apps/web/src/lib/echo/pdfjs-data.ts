import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { PDFJS_VERSION, renderPdfPages } from '@tsgi-web/pdf-pages';
import type { RenderedPage } from '@tsgi-web/pdf-pages';

/**
 * Finds the pdfjs-dist package whose data files pdf.js reads at runtime. A Next.js bundle cannot
 * resolve the package by name, so the path is built from the working directory, which is the app
 * directory both locally and on Vercel: the pnpm store of the monorepo sits two levels above it,
 * and `outputFileTracingIncludes` in `next.config.ts` ships the files from exactly there.
 *
 * @param appDir - The app directory, `apps/web`.
 * @returns The pdfjs-dist directory. `renderPdfPages` fails with this path when it is wrong.
 */
async function findPdfjsDataDir(appDir: string = process.cwd()): Promise<string> {
	const store = path.join(appDir, '..', '..', 'node_modules', '.pnpm');
	const name = `pdfjs-dist@${PDFJS_VERSION}`;
	const entries = await readdir(store).catch((): string[] => []);
	const entry = entries.find((candidate) => candidate === name || candidate.startsWith(`${name}_`));
	return path.join(store, entry ?? name, 'node_modules', 'pdfjs-dist');
}

/**
 * Renders the pages of a PDF with the data files of the deployed pdfjs-dist.
 *
 * @param bytes - The PDF.
 * @yields {RenderedPage} One rendered page after the other.
 */
async function* renderPdfPagesWithData(bytes: Uint8Array): AsyncGenerator<RenderedPage> {
	yield* renderPdfPages(bytes, { dataDir: await findPdfjsDataDir() });
}

export { findPdfjsDataDir, renderPdfPagesWithData };
