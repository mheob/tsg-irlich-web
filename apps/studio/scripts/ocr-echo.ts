import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm } from 'node:fs/promises';
import os from 'node:os';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { getCliClient } from 'sanity/cli';

import { readPageTexts } from '@tsgi-web/pdf-pages';

import { parseOcrManifestText } from './ocr-echo/manifest';
import { createOcrTools } from './ocr-echo/ocrmypdf';
import { parseOcrOptions } from './ocr-echo/options';
import { isSuccessful, runOcrSwap, summarize } from './ocr-echo/run-ocr';
import { createSwapStore } from './ocr-echo/swap-store';

const API_VERSION = '2026-10-01';
/** 64 MiB: OCRmyPDF logs every page, and the default buffer of 1 MiB is not enough for 52 pages. */
const MAX_OUTPUT_BYTES = 67_108_864;

// The promise form of execFile attaches `stdout` and `stderr` to its rejection, which is where the
// OCRmyPDF tools look for the reason of a failure.
// oxlint-disable-next-line typescript/strict-void-return -- promisify drops the ChildProcess execFile returns
const runProgram = promisify(execFile);

const options = parseOcrOptions(process.argv.slice(2), {
	home: os.homedir(),
	repository: fileURLToPath(new URL('../../..', import.meta.url)),
});
const entries = parseOcrManifestText(await readFile(options.manifest, 'utf8'));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset: options.dataset,
	useCdn: false,
});
const tools = createOcrTools({
	execFile: async (file, args) => runProgram(file, [...args], { maxBuffer: MAX_OUTPUT_BYTES }),
	remove: async (file) => rm(file, { force: true }),
	rename,
});

console.log(
	`Projekt ${client.config().projectId}, Dataset ${options.dataset}, ${options.dryRun ? 'Probelauf ohne Schreiben' : 'Austausch'}: ${entries.length} Ausgaben`,
);

const report = await runOcrSwap(
	entries,
	{
		log: (line) => {
			console.log(line);
		},
		now: () => Date.now(),
		sha1: (bytes) => createHash('sha1').update(bytes).digest('hex'),
		store: createSwapStore(client),
		textLayer: {
			exists: async (file) =>
				access(file)
					.then(() => true)
					.catch(() => false),
			folder: options.folder,
			makeDirectory: async (directory) => {
				await mkdir(directory, { recursive: true });
			},
			readFile: async (file) => new Uint8Array(await readFile(file)),
			readPageTexts: async (bytes) => readPageTexts(bytes),
			recognize: tools.recognize,
		},
		tools,
		wait: async (ms) => delay(ms),
	},
	{ dryRun: options.dryRun },
);

for (const line of summarize(report, options.dryRun)) {
	console.log(line);
}
process.exitCode = isSuccessful(report) ? 0 : 1;
