/**
 * Creates the start content of the volunteer page (`/verein/ehrenamt`, WEB-190) as a draft:
 *
 * ```bash
 * pnpm --filter studio exec sanity exec scripts/create-volunteer-page.ts --with-user-token -- --dataset <dataset> [--with-placeholder-positions]
 * ```
 *
 * The texts come from the volunteer page prototype, the hero image from `aboutUs`, the images of
 * the areas from two groups and the site settings. The script never publishes and never
 * overwrites: it writes no page when the draft or the published page already exists.
 * `--with-placeholder-positions` also writes the four open positions of the prototype as drafts,
 * for `development`, the e2e fixtures and screenshots; `production` refuses it.
 */
import process from 'node:process';

import { getCliClient } from 'sanity/cli';

import {
	AREA_GROUP_SLUGS,
	assertPlaceholdersAllowed,
	buildPlaceholderPositions,
	buildStartContent,
	hasPlaceholderFlag,
	PLACEHOLDER_FLAG,
	START_IMAGES_QUERY,
	type StartImagesResult,
	toStartImages,
	VOLUNTEER_PAGE_ID,
} from './create-volunteer-page/start-content';
import { readDataset } from './shared/read-dataset';

const API_VERSION = '2026-10-01';

const argv = process.argv.slice(2);
const dataset = readDataset(argv, [PLACEHOLDER_FLAG]);
const withPlaceholders = hasPlaceholderFlag(argv);

assertPlaceholdersAllowed(dataset, withPlaceholders);

// `raw` sees drafts; the default perspective since API 2025-02-19 is `published` and hides them.
// The image lookups below name published ids or filter out drafts, so they read published content.
const client = getCliClient({ apiVersion: API_VERSION }).withConfig({
	dataset,
	perspective: 'raw',
	useCdn: false,
});

const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, {
	ids: ['volunteerPage', VOLUNTEER_PAGE_ID],
});

if (existing.length > 0) {
	console.log(`Die Ehrenamtsseite existiert schon in ${dataset}, nichts geschrieben.`);
} else {
	const images = await client.fetch<StartImagesResult>(START_IMAGES_QUERY, {
		slugs: [...AREA_GROUP_SLUGS],
	});
	const page = await client.create(buildStartContent(toStartImages(images)));

	console.log(
		`Projekt ${client.config().projectId}, Dataset ${dataset}: Entwurf ${page._id} angelegt (Revision ${page._rev}).`,
	);
}

if (withPlaceholders) {
	for (const position of buildPlaceholderPositions()) {
		// oxlint-disable-next-line no-await-in-loop -- one position after the other, each reported
		const written = await client.createIfNotExists(position);
		console.log(`Platzhalter-Aufgabe ${written._id}: ${written.title}`);
	}
}
