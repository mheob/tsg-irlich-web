import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { getCliClient } from 'sanity/cli';

import { parseMigrationOptions } from './migrate-departments/options';
import { runMigration, summarize } from './migrate-departments/run';
import { createSanityMigrationStore } from './migrate-departments/store';
import { verifyMigration } from './migrate-departments/verify';

const API_VERSION = '2026-10-01';

const options = parseMigrationOptions(process.argv.slice(2));
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset: options.dataset,
	useCdn: false,
});
const store = createSanityMigrationStore(
	client,
	fileURLToPath(new URL('migrate-departments/images', import.meta.url)),
);

console.log(
	`Projekt ${client.config().projectId}, Dataset ${options.dataset}, ${options.dryRun ? 'Probelauf ohne Schreiben' : 'Migration'}`,
);

const report = await runMigration(store, { dryRun: options.dryRun });
// A dry run changed nothing, so checking the dataset would only list what it left to do.
const verified = options.dryRun ? [] : await verifyMigration(store);
const problems = [...new Set([...report.problems, ...verified])];
for (const line of summarize(report, problems, options.dryRun)) {
	console.log(line);
}
process.exitCode = problems.length > 0 ? 1 : 0;
