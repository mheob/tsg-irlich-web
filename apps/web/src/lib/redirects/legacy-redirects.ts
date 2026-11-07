import { LEGACY_ARTICLE_SLUGS } from './legacy-article-slugs.ts';

/**
 * The groups of the old "Breitensport" department, by their WordPress slug, with the page that offers
 * them today. A group without a page of its own goes to its department.
 */
const OLD_BREITENSPORT_GROUPS: Record<string, string> = {
	badminton: '/angebot/weitere-sportarten/badminton',
	'bewegungstraining-nach-pilates': '/angebot/kurse/pilates',
	'faszination-mit-faszientraining': '/angebot/kurse',
	frauengymnastik: '/angebot/weitere-sportarten/frauengymnastik',
	'funky-diamonds': '/angebot/tanzen/funky-diamonds',
	jedermaenner: '/angebot/weitere-sportarten/jedermaenner',
	'kindergeraeteturnen-ab-6-jahren': '/angebot/kinderturnen/kinderturnen-ab-6',
	'kindergeraeteturnen-bis-6-jahren': '/angebot/kinderturnen/kinderturnen-ab-3',
	'little-diamonds': '/angebot/tanzen/little-diamonds',
	'magic-diamonds': '/angebot/tanzen/magic-diamonds',
	'mutter-mit-kind-turnen-bis-3-jahren': '/angebot/kinderturnen/eltern-kind-turnen',
	prellball: '/angebot/weitere-sportarten',
	ropeskipping: '/angebot/weitere-sportarten/rope-skipping',
	taekwondo: '/angebot/taekwondo',
	wandern: '/angebot/weitere-sportarten/wandern',
};

/**
 * The football teams of the old "Aktuelle Saison" menu. Each one is a group of the football
 * department today, under the same slug.
 */
const OLD_TEAMS = [
	'1-mannschaft',
	'a-jugend',
	'b-jugend',
	'c-jugend',
	'd-jugend',
	'e-jugend',
	'f-jugend',
];

/**
 * The sub-categories of the old news, by their path below `/news`, with the category that holds such
 * articles today. Today's categories are flat, so `/news/fussball/1-mannschaft` would otherwise be
 * read as an article with the slug `1-mannschaft`. A sub-category without a counterpart goes to its
 * old parent.
 */
const OLD_NEWS_SUBCATEGORIES: Record<string, string> = {
	'breitensport/jedermaenner': '/news/jedermanner',
	'breitensport/prellball': '/news/breitensport',
	'breitensport/wandern': '/news/wandern',
	'breitensport/yoga': '/news/breitensport',
	'fussball/1-mannschaft': '/news/senioren',
	'fussball/2-mannschaft': '/news/senioren',
	'fussball/alte-herren': '/news/alte-herren',
	'fussball/juniorenfussball': '/news/jugend',
	'turnen/diamonds': '/news/diamonds',
	'turnen/frauen-gymnastik': '/news/frauengymnastik',
	'turnen/kinderturnen': '/news/kinderturnen',
	'turnen/pilates': '/news/pilates',
	'turnen/rope-skipping': '/news/rope-skipping',
	'turnen/taekwondo': '/news/taekwondo',
};

/**
 * The pages below the old `/verein` that have no page of their own today. `/verein/echo` is a real
 * page, so they are listed one by one instead of caught by a wildcard.
 */
const OLD_CLUB_PAGES: Record<string, string> = {
	chronik: '/verein',
	'historische-personen': '/verein',
	pressearchiv: '/news',
	'tsg-goes-app': '/verein',
	'unsere-starken-partner': '/',
	vorstand: '/verein',
	'werde-mitglied': '/mitgliedschaft',
};

/**
 * The longest alternation of article slugs one redirect carries. Next.js refuses a `source` whose
 * regular expression is longer than 4096 characters, and the pattern adds a few dozen around it.
 */
const MAX_ALTERNATION_LENGTH = 3500;

/**
 * Builds a permanent redirect.
 *
 * @param source - The pattern of the old address.
 * @param destination - Where it lives today.
 * @returns The redirect.
 */
function permanent(source: string, destination: string): LegacyRedirect {
	return { destination, permanent: true, source };
}

/**
 * Splits the slugs into alternations (`a|b|c`) that stay below the given length.
 *
 * @param slugs - Slugs that need no escaping in a regular expression.
 * @param maxLength - The longest alternation allowed.
 * @returns The alternations, in the order of the slugs.
 */
export function toAlternations(slugs: readonly string[], maxLength: number): string[] {
	const alternations: string[] = [];
	let current = '';
	for (const slug of slugs) {
		const extended = current ? `${current}|${slug}` : slug;
		if (current && extended.length > maxLength) {
			alternations.push(current);
			current = slug;
		} else {
			current = extended;
		}
	}
	if (current) alternations.push(current);
	return alternations;
}

/**
 * The addresses of the old WordPress site and where their content lives today (WEB-420). They used to
 * end in 404, apart from 23 that were entered as bulk redirects in the Vercel dashboard; those are
 * repeated here so they live in the repository.
 *
 * Every source is written without a trailing slash, which WordPress put on every address: Next.js
 * answers `/foo/` with a 308 to `/foo` before any of these rules, so the old address takes two hops.
 * Next.js tries the rules in order, so a specific address comes before the wildcard of its section,
 * and `/:rest*` also matches the address without anything below it. Parameters a destination does
 * not use are dropped, not appended to the query.
 *
 * @returns The redirects, most specific first.
 */
export function getLegacyRedirects(): LegacyRedirect[] {
	return [
		// The old departments and their groups.
		...Object.entries(OLD_BREITENSPORT_GROUPS).map(([group, destination]) =>
			permanent(`/abteilungen/breitensport/${group}/:rest*`, destination),
		),
		permanent('/abteilungen/fussball/:rest*', '/angebot/fussball'),
		permanent('/abteilungen/:rest*', '/angebot'),
		permanent(`/aktuelle-saison/:team(${OLD_TEAMS.join('|')})/:rest*`, '/angebot/fussball/:team'),
		permanent('/aktuelle-saison/:rest*', '/angebot/fussball'),
		permanent('/aktuelle-trainingszeiten', '/angebot'),

		// The old news: sub-categories, categories without a counterpart, and their pagination,
		// whose page numbers mean nothing today.
		...Object.entries(OLD_NEWS_SUBCATEGORIES).map(([path, destination]) =>
			permanent(`/news/${path}/:rest*`, destination),
		),
		permanent('/news/:category(pappelstuebchen|presse)/:rest*', '/news'),
		permanent(String.raw`/news/:category/page/:page(\d+)`, '/news/:category'),
		permanent(String.raw`/news/page/:page(\d+)`, '/news'),
		permanent(String.raw`/page/:page(\d+)`, '/news'),
		permanent('/tag/:rest*', '/news'),

		// The event calendar, its venues and its categories.
		permanent('/:calendar(events|veranstaltungen|venues)/:rest*', '/news/veranstaltungen'),

		// The club pages.
		...Object.entries(OLD_CLUB_PAGES).map(([page, destination]) =>
			permanent(`/verein/${page}/:rest*`, destination),
		),
		permanent('/datenschutzerklaerung', '/datenschutz'),
		permanent('/wp-content/uploads/2024/10/TSG-Echo_Endfassung_Webversion.pdf', '/verein/echo'),

		// The feeds and the sitemaps of Yoast SEO, which search engines may still have on file.
		permanent('/feed', '/feed.xml'),
		permanent('/comments/feed', '/feed.xml'),
		permanent('/sitemap_index.xml', '/sitemap.xml'),
		permanent(String.raw`/:name([a-z_-]+-sitemap\d*).xml`, '/sitemap.xml'),

		// The old articles: none of them exists any more, so they go to the news overview.
		...toAlternations(LEGACY_ARTICLE_SLUGS, MAX_ALTERNATION_LENGTH).map((alternation) =>
			permanent(`/:article(${alternation})`, '/news'),
		),
	];
}

/**
 * A permanent redirect (308) as `redirects()` in `next.config.ts` returns it.
 */
export interface LegacyRedirect {
	destination: string;
	permanent: true;
	source: string;
}
