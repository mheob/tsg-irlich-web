/**
 * Creates the start content of the partner page (`/verein/partner`, WEB-326) as a draft:
 *
 * ```bash
 * pnpm --filter studio exec sanity exec scripts/create-partner-page.ts --with-user-token -- --dataset <dataset>
 * ```
 *
 * The texts come from the sponsor page prototype, the hero image from `aboutUs`. The script never
 * publishes and never overwrites: it stops without writing when the draft or the published page
 * already exists.
 */
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import {
	buildStartContent,
	PARTNER_PAGE_ID,
	type SanityImageObject,
} from './create-partner-page/start-content';
import { readDataset } from './shared/read-dataset';

const API_VERSION = '2026-10-01';

const dataset = readDataset(process.argv.slice(2));
// `raw` sees drafts; the default perspective since API 2025-02-19 is `published` and hides them.
// The `aboutUs` lookup below names its id, so it still reads the published document.
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset,
	perspective: 'raw',
	useCdn: false,
});

const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {
	ids: ['partnerPage', PARTNER_PAGE_ID],
});

if (existing.length > 0) {
	console.log(`Die Partnerseite existiert schon in ${dataset}, nichts geschrieben.`);
} else {
	const heroImage = await client.fetch<SanityImageObject | null>(
		`*[_id == 'aboutUs'][0].heroImage`,
	);
	const page = await client.create(buildStartContent(heroImage ?? undefined));

	console.log(
		`Projekt ${client.config().projectId}, Dataset ${dataset}: Entwurf ${page._id} angelegt (Revision ${page._rev}).`,
	);
}
