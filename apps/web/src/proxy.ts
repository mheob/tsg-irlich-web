import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ARCHIVE_ROBOTS_TAG, toCdnUrl } from '@/lib/echo/archive-url';
import { dataset, projectId } from '@/lib/sanity/api';

/** The answer for a path below the archive that names no single asset. */
const NOT_FOUND = 404;

/**
 * Serves the files of old TSG-Echo issues from the Sanity CDN under the website's own archive path,
 * with `X-Robots-Tag: noindex`. A rewrite in `next.config.ts` cannot do it: Next.js drops the
 * `headers()` of an external rewrite, while it keeps the headers a proxy sets. The rewrite itself is
 * forwarded by the platform, so the file never passes through a function.
 *
 * @param request - A request below the archive path.
 * @returns The rewrite to the CDN, or 404.
 */
export function proxy(request: NextRequest): NextResponse {
	const { pathname, search } = request.nextUrl;
	const target = toCdnUrl(pathname, search, { dataset, projectId });
	const response = target
		? NextResponse.rewrite(target)
		: new NextResponse(null, { status: NOT_FOUND });
	response.headers.set('X-Robots-Tag', ARCHIVE_ROBOTS_TAG);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	return response;
}

// Next.js reads the matcher statically, so it has to be an inline `export const`.
export const config = { matcher: '/echo-archiv/:path*' };
