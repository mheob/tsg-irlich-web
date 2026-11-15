/**
 * Creates the start content of the values page (`/verein/werte`, WEB-150) as a draft:
 *
 * ```bash
 * pnpm --filter studio exec sanity exec scripts/create-values-page.ts --with-user-token -- --dataset <dataset>
 * ```
 *
 * The text comes from the long vision of the club page, which the dialog on `/verein` showed until
 * then. Run the script before the migration `about-us-drop-long-vision` removes it. It never
 * publishes and never overwrites: it writes nothing when the draft or the published page already
 * exists, and refuses when the club page holds no long vision.
 */
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import {
	buildStartContent,
	JOIN_TARGETS,
	START_QUERY,
	type StartSource,
	VALUES_PAGE_ID,
} from './create-values-page/start-content';
import { readDataset } from './shared/read-dataset';

const API_VERSION = '2026-10-01';

const dataset = readDataset(process.argv.slice(2));

// `raw` sees drafts; the default perspective since API 2025-02-19 is `published` and hides them.
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset,
	perspective: 'raw',
	useCdn: false,
});

const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {
	ids: ['valuesPage', VALUES_PAGE_ID],
});

if (existing.length > 0) {
	console.log(`Die Werte-Seite existiert schon in ${dataset}, nichts geschrieben.`);
} else {
	const source = await client.fetch<StartSource>(START_QUERY, {
		targets: JOIN_TARGETS.map(({ id }) => id),
	});
	const draft = buildStartContent(source);

	if (draft) {
		const page = await client.create(draft);

		console.log(
			`Projekt ${client.config().projectId}, Dataset ${dataset}: Entwurf ${page._id} angelegt (Revision ${page._rev}).`,
		);
	} else {
		console.error(
			`Die Vereinsseite in ${dataset} hat keine lange Vision mehr, nichts geschrieben.`,
		);
		process.exitCode = 1;
	}
}
