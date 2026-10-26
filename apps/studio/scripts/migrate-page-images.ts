import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { getCliClient } from 'sanity/cli';

import { parseMigrationOptions } from './migrate-page-images/options';
import { runPageImageMigration, summarize } from './migrate-page-images/run';
import { createSanityPageImageStore } from './migrate-page-images/store';

const API_VERSION = '2026-10-01';

const options = parseMigrationOptions(process.argv.slice(2));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset: options.dataset,
	useCdn: false,
});
const store = createSanityPageImageStore(
	client,
	fileURLToPath(new URL('migrate-page-images/images', import.meta.url)),
);

console.log(
	`Projekt ${client.config().projectId}, Dataset ${options.dataset}, ${options.dryRun ? 'Probelauf ohne Schreiben' : 'Migration'}`,
);

const report = await runPageImageMigration(store, { dryRun: options.dryRun });
for (const line of summarize(report, options.dryRun)) {
	console.log(line);
}
process.exitCode = report.problems.length > 0 ? 1 : 0;
