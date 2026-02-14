import { draftMode } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * API route to disable Draft Mode.
 *
 * This route is called when the user clicks the "Disable Draft Mode" button
 * to exit preview mode and return to viewing published content.
 *
 * @see https://nextjs.org/docs/app/guides/draft-mode
 *
 * @param request - The NextRequest object
 * @returns A NextResponse object or a Response object
 */
export async function GET(request: NextRequest): Promise<NextResponse | Response> {
	const draft = await draftMode();
	draft.disable();

	const redirectUrl = request.nextUrl.searchParams.get('redirect') ?? '/';
	return NextResponse.redirect(new URL(redirectUrl, request.url));
}
