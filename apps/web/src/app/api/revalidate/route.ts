import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';
import { groupSections } from '@/utils/groups';

interface WebhookBody {
	_type: string;
	slug?: { current: string };
}

type RevalidateHandler = (slug?: string) => void;

/**
 * One handler per group document type, because the department segment of the URL is derived from
 * the type and not from the slug of the group.
 */
const GROUP_REVALIDATION_MAP: Record<string, RevalidateHandler> = Object.fromEntries(
	groupSections.map((section) => [
		section._type,
		(slug?: string) => {
			revalidatePath('/angebot');
			revalidatePath(section.slug);
			if (slug) {
				revalidatePath(`${section.slug}/${slug}`);
			}
		},
	]),
);

const REVALIDATION_MAP: Record<string, RevalidateHandler> = {
	...GROUP_REVALIDATION_MAP,
	aboutUs: () => {
		revalidatePath('/verein');
	},
	contact: () => {
		revalidatePath('/kontakt');
	},
	departmentsPage: () => {
		revalidatePath('/angebot');
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
	navigation: () => {
		revalidatePath('/', 'layout');
	},
	// An article lives below its category, which the webhook payload does not carry, so the whole
	// route has to be revalidated.
	'news.article': () => {
		revalidatePath('/news');
		revalidatePath('/news/[category]/[slug]', 'page');
	},
	'news.category': (slug) => {
		revalidatePath('/news');
		revalidatePath('/news/[category]/[slug]', 'page');
		if (slug) {
			revalidatePath(`/news/${slug}`);
		}
	},
	newsOverview: () => {
		revalidatePath('/news');
	},
	person: () => {
		revalidatePath('/');
		revalidatePath('/angebot', 'layout');
		revalidatePath('/kontakt');
		revalidatePath('/news');
		revalidatePath('/mitgliedschaft');
		revalidatePath('/verein');
	},
	privacy: () => {
		revalidatePath('/datenschutz');
	},
	settings: () => {
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
	revalidateTag(body._type, 'max');
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
