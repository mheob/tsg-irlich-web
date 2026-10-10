import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

import { getCliClient } from 'sanity/cli';

import { renderPdfPages } from '@tsgi-web/pdf-pages';

import { createArchiveStore } from './import-echo/archive-store';
import { checkIntroAccess, draftIntro } from './import-echo/intro';
import { parseManifest } from './import-echo/manifest';
import { parseImportOptions } from './import-echo/options';
import { isSuccessful, runImport, summarize } from './import-echo/run-import';

// The releases API needs 2025-02-19 or later.
const API_VERSION = '2026-10-01';

const options = parseImportOptions(process.argv.slice(2), process.env);
const { apiKey } = options;
const plans = parseManifest(JSON.parse(await readFile(options.manifest, 'utf8')));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset: options.dataset,
	useCdn: false,
});

console.log(
	`Projekt ${client.config().projectId}, Dataset ${options.dataset}, ${options.dryRun ? 'Probelauf ohne Schreiben' : 'Import'}: ${plans.length} Ausgaben`,
);

const report = await runImport(
	plans,
	{
		checkIntro: apiKey ? async () => checkIntroAccess({ apiKey, fetch }) : undefined,
		draftIntro: apiKey
			? async (input) => draftIntro(input, { apiKey, fetch, wait: async (ms) => delay(ms) })
			: undefined,
		log: (line) => {
			console.log(line);
		},
		now: () => new Date(),
		readPdf: async (file) => new Uint8Array(await readFile(path.join(options.folder, file))),
		renderPages: (bytes) => renderPdfPages(bytes),
		store: createArchiveStore(client, options.releaseId),
	},
	{ dryRun: options.dryRun },
);

for (const line of summarize(report, options.dryRun)) {
	console.log(line);
}
process.exitCode = isSuccessful(report) ? 0 : 1;
