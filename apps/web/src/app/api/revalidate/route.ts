import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { ECHO_OVERVIEW_PATH } from '@/utils/links';

interface WebhookBody {
	_type: string;
	slug?: { current: string };
}

type RevalidateHandler = (slug?: string) => void;

function revalidateNewsRoutes(): void {
	revalidatePath('/news');
	revalidatePath('/news/[category]', 'page');
	revalidatePath('/news/[category]/[slug]', 'page');
	revalidatePath('/angebot/[group]/[singleGroup]', 'page');
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

/**
 * The archive and every issue page. The slug of an earlier version of an issue is not in the
 * payload, so the whole issue route is revalidated.
 */
function revalidateEchoRoutes(): void {
	revalidatePath(ECHO_OVERVIEW_PATH);
	revalidatePath(`${ECHO_OVERVIEW_PATH}/[slug]`, 'page');
}

const REVALIDATION_MAP: Record<string, RevalidateHandler> = {
	aboutUs: () => {
		revalidatePath('/verein');
	},
	contact: () => {
		revalidatePath('/kontakt');
	},
	// The home page links the departments.
	department: () => {
		revalidatePath('/');
		revalidateOfferRoutes();
	},
	departmentsPage: () => {
		revalidatePath('/angebot');
	},
	// An issue appears in the archive and has its own page.
	'echo.issue': revalidateEchoRoutes,
	echoOverview: () => {
		revalidatePath(ECHO_OVERVIEW_PATH);
	},
	// A question can belong to several departments, and the payload carries none it belonged to
	// before, so every department page is revalidated.
	faq: () => {
		revalidatePath('/angebot/[group]', 'page');
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
	// The TSG-Echo pages show the contact persons of the news overview.
	newsOverview: () => {
		revalidatePath('/news');
		revalidateEchoRoutes();
	},
	person: () => {
		revalidatePath('/');
		revalidatePath('/angebot', 'layout');
		revalidatePath('/kontakt');
		revalidatePath('/news');
		revalidatePath('/mitgliedschaft');
		// The about page and the TSG-Echo pages below it.
		revalidatePath('/verein', 'layout');
	},
	privacy: () => {
		revalidatePath('/datenschutz');
	},
	// The menu and the footer data, rendered by the root layout on every page.
	'site-settings': () => {
		revalidatePath('/', 'layout');
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
