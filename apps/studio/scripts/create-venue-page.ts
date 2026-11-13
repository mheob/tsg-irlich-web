/**
 * Creates the start content of the venue page (`/verein/sportstaetten`, WEB-149) as a draft:
 *
 * ```bash
 * pnpm --filter studio exec sanity exec scripts/create-venue-page.ts --with-user-token -- --dataset <dataset>
 * ```
 *
 * The texts come from the venue page prototype, the hero image from the Pappelstadion. The script
 * never publishes, never overwrites and never writes a venue: it writes no page when the draft or
 * the published page already exists, and refuses when Pappelstadion or Pappelstübchen is missing.
 */
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import {
	buildStartContent,
	HOME_VENUE_IDS,
	resolveStartVenues,
	START_QUERY,
	type StartVenue,
	VENUE_PAGE_ID,
} from './create-venue-page/start-content';
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
	ids: ['venuePage', VENUE_PAGE_ID],
});

if (existing.length > 0) {
	console.log(`Die Sportstättenseite existiert schon in ${dataset}, nichts geschrieben.`);
} else {
	const venues = await client.fetch<StartVenue[]>(START_QUERY, { ids: [...HOME_VENUE_IDS] });
	const start = resolveStartVenues(venues);

	if (start) {
		const page = await client.create(buildStartContent(start.heroImage));

		console.log(
			`Projekt ${client.config().projectId}, Dataset ${dataset}: Entwurf ${page._id} angelegt (Revision ${page._rev}).`,
		);
	} else {
		console.error(`Pappelstadion oder Pappelstübchen fehlt in ${dataset}, nichts geschrieben.`);
		process.exitCode = 1;
	}
}
