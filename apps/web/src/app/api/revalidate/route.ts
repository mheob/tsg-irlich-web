import { parseBody } from 'next-sanity/webhook';
import type { ParsedBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { env } from '@/lib/env';

interface WebhookBody {
	_type: string;
	slug?: { current: string };
}

type RevalidateHandler = (slug?: string) => void;

const REVALIDATION_MAP: Record<string, RevalidateHandler> = {
	aboutUs: () => {
		revalidatePath('/verein');
	},
	contact: () => {
		revalidatePath('/kontakt');
	},
	departmentsPage: () => {
		revalidatePath('/angebot');
	},
	group: (slug) => {
		revalidatePath('/angebot');
		if (slug) {
			revalidatePath(`/angebot/${slug}`);
		}
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
	'news.article': (slug) => {
		revalidatePath('/news');
		if (slug) {
			revalidatePath(`/news/${slug}`);
		}
	},
	'news.category': (slug) => {
		revalidatePath('/news');
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
	venue: (slug) => {
		revalidatePath('/angebot');
		if (slug) {
			revalidatePath(`/angebot/${slug}`);
		}
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
