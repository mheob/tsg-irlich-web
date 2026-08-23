import { draftMode } from 'next/headers';
import { NextResponse } from 'next/server';

import { getBaseUrl } from '@/utils/url';

/**
 * Disables the Next.js draft mode and returns to the published home page.
 *
 * The Presentation tool never calls this route on its own, it is only reached
 * through the "Vorschau beenden" link that is rendered while draft mode is on.
 *
 * @returns A redirect to the home page.
 */
export async function GET(): Promise<NextResponse> {
	const draft = await draftMode();
	draft.disable();

	return NextResponse.redirect(new URL('/', getBaseUrl()));
}
