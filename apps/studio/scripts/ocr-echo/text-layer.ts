import path from 'node:path';

import type { OcrEntry } from './manifest';
import type { OcrTools } from './ocrmypdf';

/** Where the recognized PDFs go, next to the originals, with the same relative paths. */
const OUTPUT_FOLDER = 'mit-textebene';
const WHITESPACE = /\s/gu;

/**
 * Where an entry's PDF lies, and where its recognized version goes.
 *
 * @param entry - The entry of the list.
 * @param folder - The archive folder.
 * @returns The two absolute paths.
 */
function toPaths(entry: OcrEntry, folder: string): { input: string; output: string } {
	return {
		input: path.join(folder, entry.file),
		output: path.join(folder, OUTPUT_FOLDER, entry.file),
	};
}

/**
 * Whether every page has a text layer.
 *
 * @param texts - The text of each page.
 * @returns `false` when a page is only an image.
 */
function hasTextEverywhere(texts: readonly string[]): boolean {
	return texts.every((text) => text.trim() !== '');
}

/**
 * Reads a PDF and the text of its pages.
 *
 * @param file - The absolute path.
 * @param deps - The file reader and the text reader.
 * @returns The bytes and one text per page.
 */
async function readPdf(file: string, deps: TextLayerDeps): Promise<ReadPdf> {
	const bytes = await deps.readFile(file);
	return { bytes, texts: await deps.readPageTexts(bytes) };
}

/**
 * What the run uploads, and what it logs about it.
 *
 * @param pdf - The PDF and its texts.
 * @param source - Where it came from.
 * @returns The prepared PDF.
 */
function toPrepared(pdf: ReadPdf, source: PreparedPdf['source']): PreparedPdf {
	const characters = pdf.texts.join('').replaceAll(WHITESPACE, '').length;
	return { bytes: pdf.bytes, characters, pageCount: pdf.texts.length, source };
}

/**
 * Whether an entry still needs OCR, so the run can check the tools before it touches anything.
 *
 * @param entry - The entry of the list.
 * @param deps - The file system and the text reader.
 * @returns `false` when an earlier result exists or every page has text.
 */
async function needsRecognition(entry: OcrEntry, deps: TextLayerDeps): Promise<boolean> {
	const { input, output } = toPaths(entry, deps.folder);
	if (await deps.exists(output)) {
		return false;
	}
	const { texts } = await readPdf(input, deps);
	return !hasTextEverywhere(texts);
}

/**
 * Runs OCR into `mit-textebene` and reads the result.
 *
 * @param paths - The original and where its recognized version goes.
 * @param deps - The file system, the text reader and OCR.
 * @returns The recognized PDF.
 */
async function recognize(
	paths: { input: string; output: string },
	deps: TextLayerDeps,
): Promise<PreparedPdf> {
	await deps.makeDirectory(path.dirname(paths.output));
	await deps.recognize(paths.input, paths.output);
	return toPrepared(await readPdf(paths.output, deps), 'recognized');
}

/**
 * Gives an entry's PDF a text layer: an earlier result from `mit-textebene` as it is, a PDF with
 * text on every page unchanged, anything else through OCR into `mit-textebene`.
 *
 * @param entry - The entry of the list.
 * @param deps - The file system, the text reader and OCR.
 * @returns The PDF to upload.
 * @throws {Error} For a PDF without pages, or when reading or OCR fails.
 */
async function prepareTextLayer(entry: OcrEntry, deps: TextLayerDeps): Promise<PreparedPdf> {
	const paths = toPaths(entry, deps.folder);
	if (await deps.exists(paths.output)) {
		return toPrepared(await readPdf(paths.output, deps), 'cached');
	}
	const original = await readPdf(paths.input, deps);
	if (original.texts.length === 0) {
		throw new Error('Die PDF enthält keine Seiten.');
	}
	return hasTextEverywhere(original.texts)
		? toPrepared(original, 'original')
		: recognize(paths, deps);
}

interface ReadPdf {
	bytes: Uint8Array;
	texts: string[];
}

interface TextLayerDeps {
	exists: (file: string) => Promise<boolean>;
	/** The archive folder the list's paths are relative to. */
	folder: string;
	/** Creates a directory and its parents. */
	makeDirectory: (directory: string) => Promise<void>;
	readFile: (file: string) => Promise<Uint8Array>;
	readPageTexts: (bytes: Uint8Array) => Promise<string[]>;
	recognize: OcrTools['recognize'];
}

interface PreparedPdf {
	bytes: Uint8Array;
	/** The non-whitespace characters of every page's text. */
	characters: number;
	pageCount: number;
	/** `cached`: an earlier OCR result, `original`: had text everywhere, `recognized`: OCR'd now. */
	source: 'cached' | 'original' | 'recognized';
}

export { OUTPUT_FOLDER, needsRecognition, prepareTextLayer };
export type { PreparedPdf, TextLayerDeps };
