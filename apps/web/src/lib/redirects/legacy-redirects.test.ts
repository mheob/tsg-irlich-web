import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Next.js's own matcher and destination builder, so the table is read exactly as the server reads it.
import { tryToParsePath } from 'next/dist/lib/try-to-parse-path';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { prepareDestination } from 'next/dist/shared/lib/router/utils/prepare-destination';
import { describe, expect, it } from 'vite-plus/test';

import nextConfig from '../../../next.config.ts';
import { LEGACY_ARTICLE_SLUGS } from './legacy-article-slugs.ts';
import { getLegacyRedirects, toAlternations } from './legacy-redirects.ts';

/** Next.js refuses a `source` whose regular expression is longer than this. */
const MAX_SOURCE_REGEX_LENGTH = 4096;

interface Matcher {
	destination: string;
	match: (pathname: string) => false | Record<string, string | string[]>;
}

/** Every redirect of the app, in the order `next.config.ts` lists them, compiled as Next.js does. */
const matchers: Promise<Matcher[]> = (async () => {
	const redirects = (await nextConfig.redirects?.()) ?? [];
	return redirects.map(({ destination, source }) => ({
		destination,
		match: getPathMatch(source, { removeUnnamedParams: true, strict: true }),
	}));
})();

/**
 * Where the app sends a request for the given path, after a single redirect of `next.config.ts`.
 * Next.js first answers a trailing slash with a 308 to the path without it, so that is stripped first.
 *
 * @param address - The requested path.
 * @returns The redirect's target, or `undefined` when no redirect applies.
 */
async function resolve(address: string): Promise<string | undefined> {
	const pathname = address.length > 1 ? address.replace(/\/+$/u, '') : address;
	for (const { destination, match } of await matchers) {
		const params = match(pathname);
		if (params) {
			return prepareDestination({ appendParamsToQuery: false, destination, params, query: {} })
				.newUrl;
		}
	}
	return undefined;
}

/**
 * The directories in a directory.
 *
 * @param directory - An absolute path.
 * @returns The names of the directories in it.
 */
async function getDirectories(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

/**
 * The top-level segments of the app's routes, with the route groups resolved.
 *
 * @returns The segments, without the private folders and the dynamic ones.
 */
async function getTopLevelSegments(): Promise<string[]> {
	const appDirectory = fileURLToPath(new URL('../../app', import.meta.url));
	const topLevel = await getDirectories(appDirectory);
	const segments = await Promise.all(
		topLevel.map(async (name) =>
			name.startsWith('(') ? getDirectories(path.join(appDirectory, name)) : [name],
		),
	);
	return segments.flat().filter((name) => !name.startsWith('_') && !name.startsWith('['));
}

/**
 * Whether Next.js accepts a redirect source: it parses, and its regular expression stays within the
 * length Next.js allows.
 *
 * @param source - A `source` of `redirects()`.
 * @returns `true` when the build would take it.
 */
function isAcceptedSource(source: string): boolean {
	const parsed = tryToParsePath(source);
	return parsed.error === undefined && (parsed.regexStr?.length ?? 0) <= MAX_SOURCE_REGEX_LENGTH;
}

describe('legacy redirects', () => {
	// Addresses of the WordPress site as it wrote them, with the trailing slash.
	it.each([
		['/abteilungen/breitensport/badminton/', '/angebot/weitere-sportarten/badminton'],
		[
			'/abteilungen/breitensport/kindergeraeteturnen-ab-6-jahren/unternehmungen-ausserhalb-der-sporthalle/',
			'/angebot/kinderturnen/kinderturnen-ab-6',
		],
		['/abteilungen/breitensport/faszination-mit-faszientraining/', '/angebot/kurse'],
		['/abteilungen/breitensport/prellball/', '/angebot/weitere-sportarten'],
		['/abteilungen/breitensport/', '/angebot'],
		['/abteilungen/fussball/trainingszeiten-ansprechpartner-fussball/', '/angebot/fussball'],
		['/aktuelle-saison/1-mannschaft/', '/angebot/fussball/1-mannschaft'],
		['/aktuelle-saison/f-jugend/', '/angebot/fussball/f-jugend'],
		['/aktuelle-saison/2-mannschaft/', '/angebot/fussball'],
		['/aktuelle-saison/', '/angebot/fussball'],
		['/aktuelle-trainingszeiten/', '/angebot'],
		['/news/fussball/1-mannschaft/', '/news/senioren'],
		['/news/fussball/1-mannschaft/page/2/', '/news/senioren'],
		['/news/breitensport/jedermaenner/', '/news/jedermanner'],
		['/news/turnen/frauen-gymnastik/', '/news/frauengymnastik'],
		['/news/presse/page/3/', '/news'],
		['/news/pappelstuebchen/', '/news'],
		['/news/fussball/page/2/', '/news/fussball'],
		['/news/page/2/', '/news'],
		['/page/3/', '/news'],
		['/tag/b-jugend/', '/news'],
		['/veranstaltungen/', '/news/veranstaltungen'],
		['/veranstaltungen/2020-02-08/', '/news/veranstaltungen'],
		['/veranstaltungen/event/vaddertach-2016/', '/news/veranstaltungen'],
		['/events/tsg-vaddertach-2024/ical/', '/news/veranstaltungen'],
		['/venues/pappelstadion/', '/news/veranstaltungen'],
		['/verein/chronik/', '/verein'],
		['/verein/chronik/tv-irlich/', '/verein'],
		['/verein/vorstand', '/verein'],
		['/verein/pressearchiv/', '/news'],
		['/verein/tsg-goes-app/', '/verein'],
		['/feed/', '/feed.xml'],
		['/comments/feed/', '/feed.xml'],
		['/sitemap_index.xml', '/sitemap.xml'],
		['/post-sitemap.xml', '/sitemap.xml'],
		['/post_tag-sitemap.xml', '/sitemap.xml'],
		['/derbysieg/', '/news'],
		['/wanderung-1-mai-vorderer-westerwald/', '/news'],
		['/wp-content/uploads/2024/10/TSG-Echo_Endfassung_Webversion.pdf', '/verein/echo'],
	])('sends %s to %s', async (address, target) => {
		await expect(resolve(address)).resolves.toBe(target);
		// One step: the target is never redirected again.
		await expect(resolve(target)).resolves.toBeUndefined();
	});

	// The 23 bulk redirects the Vercel dashboard held until 2026-11-09 (version of 2026-01-03), exactly
	// as entered there, which this table took over. Only `/veranstaltungen` changes its target: the
	// news category of the events fits better than the home page.
	it.each([
		['/abteilungen/breitensport/badminton', '/angebot/weitere-sportarten/badminton'],
		['/abteilungen/breitensport/bewegungstraining-nach-pilates', '/angebot/kurse/pilates'],
		['/abteilungen/breitensport/frauengymnastik', '/angebot/weitere-sportarten/frauengymnastik'],
		['/abteilungen/breitensport/funky-diamonds', '/angebot/tanzen/funky-diamonds'],
		['/abteilungen/breitensport/jedermaenner', '/angebot/weitere-sportarten/jedermaenner'],
		[
			'/abteilungen/breitensport/kindergeraeteturnen-ab-6-jahren',
			'/angebot/kinderturnen/kinderturnen-ab-6',
		],
		[
			'/abteilungen/breitensport/kindergeraeteturnen-bis-6-jahren',
			'/angebot/kinderturnen/kinderturnen-ab-3',
		],
		['/abteilungen/breitensport/little-diamonds', '/angebot/tanzen/little-diamonds'],
		['/abteilungen/breitensport/magic-diamonds', '/angebot/tanzen/magic-diamonds'],
		[
			'/abteilungen/breitensport/mutter-mit-kind-turnen-bis-3-jahren',
			'/angebot/kinderturnen/eltern-kind-turnen',
		],
		['/abteilungen/breitensport/ropeskipping', '/angebot/weitere-sportarten/rope-skipping'],
		['/abteilungen/breitensport/taekwondo', '/angebot/taekwondo'],
		['/abteilungen/breitensport/trainingszeiten-ansprechpartner-breitensport/', '/angebot'],
		['/abteilungen/breitensport/wandern', '/angebot/weitere-sportarten/wandern'],
		['/abteilungen/fussball/', '/angebot/fussball'],
		['/abteilungen/fussball/ansprechpartner-fussball/', '/angebot/fussball'],
		['/datenschutzerklaerung', '/datenschutz'],
		['/veranstaltungen', '/news/veranstaltungen'],
		['/verein/chronik/spiel-und-sportverein-irlich/', '/verein'],
		['/verein/historische-personen/', '/verein'],
		['/verein/unsere-starken-partner/', '/'],
		['/verein/vorstand/', '/verein'],
		['/verein/werde-mitglied/', '/mitgliedschaft'],
	])('takes over the dashboard redirect from %s to %s', async (address, target) => {
		await expect(resolve(address)).resolves.toBe(target);
	});

	it.each([
		'/',
		'/angebot',
		'/angebot/fussball',
		'/angebot/fussball/1-mannschaft',
		'/angebot/weitere-sportarten/badminton',
		'/news',
		'/news/fussball',
		'/news/senioren/heimsieg-engers',
		'/news/veranstaltungen',
		'/verein',
		'/verein/echo',
		'/verein/echo/2024',
		'/kontakt',
		'/kontakt/feedback',
		'/mitgliedschaft',
		'/datenschutz',
		'/impressum',
		'/barrierefreiheit',
		'/suche',
		'/feed.xml',
		'/llms.txt',
		'/sitemap.xml',
		'/robots.txt',
		'/echo-archiv/files/issue.pdf',
		'/api/search',
	])('leaves %s alone', async (address) => {
		await expect(resolve(address)).resolves.toBeUndefined();
	});

	it('sends every old article to the news', async () => {
		const targets = await Promise.all(
			LEGACY_ARTICLE_SLUGS.map(async (slug) => [slug, await resolve(`/${slug}/`)] as const),
		);

		expect(targets.filter(([, target]) => target !== '/news')).toStrictEqual([]);
	});

	it('keeps the old articles clear of the routes of the app', async () => {
		const segments = new Set(await getTopLevelSegments());

		expect(segments.has('news')).toBe(true);
		expect(LEGACY_ARTICLE_SLUGS.filter((slug) => segments.has(slug))).toStrictEqual([]);
	});

	it('lists every old article once, as a slug that needs no escaping', () => {
		expect(new Set(LEGACY_ARTICLE_SLUGS).size).toBe(LEGACY_ARTICLE_SLUGS.length);
		for (const slug of LEGACY_ARTICLE_SLUGS) {
			expect(slug).toMatch(/^[\da-z]+(?:-[\da-z]+)*$/u);
		}
	});

	it('keeps every source within what Next.js accepts', () => {
		const sources = getLegacyRedirects().map(({ source }) => source);

		expect(sources.filter((source) => !isAcceptedSource(source))).toStrictEqual([]);
	});
});

describe(toAlternations, () => {
	it('joins the slugs as long as they fit', () => {
		expect(toAlternations(['ab', 'cd', 'ef'], 5)).toStrictEqual(['ab|cd', 'ef']);
	});

	it('keeps a slug longer than the limit on its own', () => {
		expect(toAlternations(['abcdef', 'gh'], 4)).toStrictEqual(['abcdef', 'gh']);
	});

	it('returns nothing for no slugs', () => {
		expect(toAlternations([], 10)).toStrictEqual([]);
	});
});
