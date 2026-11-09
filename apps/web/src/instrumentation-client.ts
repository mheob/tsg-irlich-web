import { initBotId } from 'botid/client/core';

/**
 * The pages whose forms post to a server action that asks `checkBotId()`. A server action is
 * posted to the page it is called on, so the protected paths are those of the pages, and on Vercel
 * a request without the BotID headers counts as a bot. Home and `/kontakt` carry the contact form,
 * `/kontakt/feedback` the feedback form and its screenshot upload, `/anmeldung/*` the registration
 * forms, and every other entry the newsletter. A `*` also matches slashes.
 *
 * Not `/*`: that would also challenge the posts to `/api/*` and Vercel's beacons below `/_vercel`.
 * `instrumentation-client.test.ts` checks every page of the app against this list, so a new page
 * has to be added here or to the test's pages without a form.
 */
const PROTECTED_PAGES = [
	'/',
	'/angebot',
	'/angebot/*',
	'/anmeldung/*',
	'/kontakt',
	'/kontakt/feedback',
	'/mitgliedschaft',
	'/news',
	'/news/*',
	'/suche',
	'/verein',
	'/verein/*',
];

initBotId({ protect: PROTECTED_PAGES.map((path) => ({ method: 'POST', path })) });
