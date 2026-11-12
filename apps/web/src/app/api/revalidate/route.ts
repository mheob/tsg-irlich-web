import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { ECHO_OVERVIEW_PATH, PARTNER_PAGE_PATH } from '@/utils/links';

interface WebhookBody {
	_type: string;
	slug?: { current: string };
}

type RevalidateHandler = (slug?: string) => void;

/**
 * The pages of every category. `next.config.ts` rewrites a later page (`?seite=N`) to an internal
 * route, and a rewritten page is cached under that route, so it has to be named here as well.
 */
function revalidateNewsCategories(): void {
	revalidatePath('/news/[category]', 'page');
	revalidatePath('/news/[category]/seite/[page]', 'page');
}

/** The news overview and the categories, each with the internal route of its later pages. */
function revalidateNewsOverviews(): void {
	revalidatePath('/news');
	revalidatePath('/news/seite/[page]', 'page');
	revalidateNewsCategories();
}

/** Every article. The payload carries no category, so the whole route is revalidated. */
function revalidateNewsArticles(): void {
	revalidatePath('/news/[category]/[slug]', 'page');
}

/** The news routes, the group pages that show the latest articles, and the sitemap, which lists every article and category. */
function revalidateNewsRoutes(): void {
	revalidateNewsOverviews();
	revalidateNewsArticles();
	revalidatePath('/angebot/[group]/[singleGroup]', 'page');
	revalidatePath('/sitemap.xml');
}

/**
 * The offer pages, the sitemap and `llms.txt`, which list every department and group. The payload
 * only carries the slug of the changed document, not the slug of the department a group belongs to,
 * so the path of a single group cannot be built from it and the whole offer is revalidated.
 */
function revalidateOfferRoutes(): void {
	revalidatePath('/angebot', 'layout');
	revalidatePath('/sitemap.xml');
	revalidatePath('/llms.txt');
}

/** Every page of the archive, the later ones through the internal route the rewrite serves them from. */
function revalidateEchoArchive(): void {
	revalidatePath(ECHO_OVERVIEW_PATH);
	revalidatePath(`${ECHO_OVERVIEW_PATH}/seite/[page]`, 'page');
}

/**
 * The archive and every issue page. The slug of an earlier version of an issue is not in the
 * payload, so the whole issue route is revalidated.
 */
function revalidateEchoRoutes(): void {
	revalidateEchoArchive();
	revalidatePath(`${ECHO_OVERVIEW_PATH}/[slug]`, 'page');
}

const REVALIDATION_MAP: Record<string, RevalidateHandler> = {
	// The TSG-Echo pages below the about page show its hero image.
	aboutUs: () => {
		revalidatePath('/verein', 'layout');
	},
	accessibility: () => {
		revalidatePath('/barrierefreiheit');
	},
	// The feedback page below the contact page shows its hero image.
	contact: () => {
		revalidatePath('/kontakt', 'layout');
	},
	// The home page links the departments.
	department: () => {
		revalidatePath('/');
		revalidateOfferRoutes();
	},
	departmentsPage: () => {
		revalidatePath('/angebot');
	},
	// An issue appears in the archive and has its own page, and the sitemap lists the indexable ones.
	'echo.issue': () => {
		revalidateEchoRoutes();
		revalidatePath('/sitemap.xml');
	},
	echoOverview: revalidateEchoArchive,
	// A question can belong to several departments, and the payload carries none it belonged to
	// before, so every department page is revalidated.
	faq: () => {
		revalidatePath('/angebot/[group]', 'page');
	},
	// The registration pages show the form's texts and its fields.
	form: () => {
		revalidatePath('/anmeldung/[slug]', 'page');
	},
	group: revalidateOfferRoutes,
	// The groups page holds the content of every department page.
	groupsPage: () => {
		revalidatePath('/angebot/[group]', 'page');
	},
	home: () => {
		revalidatePath('/');
	},
	imprint: () => {
		revalidatePath('/impressum');
	},
	membership: () => {
		revalidatePath('/mitgliedschaft');
	},
	// An article lives below its category, which the webhook payload does not carry, so the whole
	// route has to be revalidated. The same goes for the group pages, each of which shows the latest
	// articles of the category assigned to it, and for the category pages, whose combobox lists every
	// category with its article count.
	'news.article': revalidateNewsRoutes,
	'news.category': revalidateNewsRoutes,
	// The hero of every article.
	'news-article-page': revalidateNewsArticles,
	// The category pages show the hero image of the news overview, the TSG-Echo pages its contact
	// persons.
	newsOverview: () => {
		revalidateNewsOverviews();
		revalidateEchoRoutes();
	},
	// The texts and the contact persons of every category page.
	newsOverviewCategory: revalidateNewsCategories,
	// The page of the partners, which shows the sponsors as well.
	partnerPage: () => {
		revalidatePath(PARTNER_PAGE_PATH);
	},
	person: () => {
		revalidatePath('/');
		revalidatePath('/angebot', 'layout');
		revalidatePath('/kontakt');
		// The contact persons of the overviews, and the author of an article.
		revalidateNewsOverviews();
		revalidateNewsArticles();
		revalidatePath('/mitgliedschaft');
		// The about page and the pages below it: the TSG-Echo pages and the partner page.
		revalidatePath('/verein', 'layout');
	},
	privacy: () => {
		revalidatePath('/datenschutz');
	},
	// The placeholder of the search panel in the navigation, which the root layout renders on every
	// page. The `/suche` page itself reads the same document.
	searchPage: () => {
		revalidatePath('/', 'layout');
	},
	// The menu and the footer data, rendered by the root layout on every page.
	'site-settings': () => {
		revalidatePath('/', 'layout');
	},
	// The home page, every article and the partner page show the sponsors.
	sponsors: () => {
		revalidatePath('/');
		revalidateNewsArticles();
		revalidatePath(PARTNER_PAGE_PATH);
	},
	testimonial: () => {
		revalidatePath('/');
	},
	// A venue is referenced by the training times of a group, and its slug is no part of any URL.
	venue: () => {
		revalidatePath('/angebot');
		revalidatePath('/angebot/[group]/[singleGroup]', 'page');
	},
};

async function parseWebhook(request: NextRequest): Promise<ParsedBody<WebhookBody>> {
	return parseBody<WebhookBody>(request, env('SANITY_REVALIDATE_SECRET'));
}

function revalidateByType(body: WebhookBody): void {
	const slug = body.slug?.current;
	const handler =
		REVALIDATION_MAP[body._type] ??
		(() => {
			revalidatePath('/');
		});
	handler(slug);
	// Expire, don't mark stale: with the `max` profile the first render after the webhook is served
	// the old data while it refetches, and Vercel keeps that render as the page until the next
	// revalidation. `updateTag` would do the same, but only works in Server Actions.
	revalidateTag(body._type, { expire: 0 });
}

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
	try {
		const { body, isValidSignature } = await parseWebhook(request);

		if (!isValidSignature) {
			return Response.json(
				{ body, isValidSignature, message: 'Invalid signature' },
				{ status: 401 },
			);
		}

		if (!body?._type) {
			return Response.json({ body, message: 'Bad Request' }, { status: 400 });
		}

		revalidateByType(body);

		return NextResponse.json({ body, now: Date.now(), revalidated: true, status: 200 });
	} catch (error: unknown) {
		console.error(error);
		return Response.json(
			{ message: error instanceof Error ? error.message : 'Internal Server Error' },
			{ status: 500 },
		);
	}
}
