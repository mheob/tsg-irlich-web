import process from 'node:process';

import { parseBody } from 'next-sanity/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
	try {
		const { body, isValidSignature } = await parseBody<{
			_type: string;
			slug?: { current: string };
		}>(request, process.env.SANITY_REVALIDATE_SECRET);

		// Validate webhook signature
		if (!isValidSignature) {
			const message = 'Invalid signature';
			return Response.json({ body, isValidSignature, message }, { status: 401 });
		}

		if (!body?._type) {
			const message = 'Bad Request';
			return Response.json({ body, message }, { status: 400 });
		}

		console.log(body);

		// Revalidate specific paths based on content type
		switch (body._type) {
			// Single Pages
			case 'home':
			case 'testimonial': {
				revalidatePath('/');
				break;
			}
			case 'aboutUs': {
				revalidatePath('/verein');
				break;
			}
			case 'contact': {
				revalidatePath('/kontakt');
				break;
			}
			case 'departmentsPage': {
				revalidatePath('/angebot');
				break;
			}
			case 'membership': {
				revalidatePath('/mitgliedschaft');
				break;
			}
			case 'newsOverview': {
				revalidatePath('/news');
				break;
			}
			case 'privacy': {
				revalidatePath('/datenschutz');
				break;
			}
			case 'imprint': {
				revalidatePath('/impressum');
				break;
			}

			// News
			case 'news.article':
			case 'news.category': {
				// Revalidate news list and detail page if slug exists
				revalidatePath('/aktuelles');
				if (body.slug?.current) revalidatePath(`/aktuelles/${body.slug.current}`);
				break;
			}
			case 'group':
			case 'venue': {
				// Revalidate groups/sports pages
				revalidatePath('/angebot');
				if (body.slug?.current) revalidatePath(`/angebot/${body.slug.current}`);
				break;
			}
			case 'person': {
				// Revalidate verein/about pages that might display people
				revalidatePath('/');
				revalidatePath('/angebot', 'layout');
				revalidatePath('/kontakt');
				revalidatePath('/news');
				revalidatePath('/mitgliedschaft');
				revalidatePath('/verein');
				break;
			}
			case 'settings':
			case 'navigation': {
				// Revalidate all pages when global settings change
				revalidatePath('/', 'layout');
				break;
			}
			default: {
				// For unknown types, revalidate home page
				revalidatePath('/');
			}
		}

		// Also revalidate by tag if you're using tag-based caching
		revalidateTag(body._type, 'layout');

		return NextResponse.json({
			body,
			now: Date.now(),
			revalidated: true,
			status: 200,
		});
	} catch (error: unknown) {
		console.error(error);
		return Response.json(
			{ message: error instanceof Error ? error.message : 'Internal Server Error' },
			{ status: 500 },
		);
	}
}
