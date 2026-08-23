import { defineLive } from 'next-sanity/live';

import { env } from '@/lib/env';
import { client } from '@/lib/sanity/client';

const readToken = env('SANITY_API_READ_TOKEN');

/**
 * The Live Content API bindings for the app.
 *
 * - `sanityFetch` replaces `client.fetch` on pages that need to be previewable.
 *   It serves published content by default and switches to draft content with
 *   stega encoding as soon as Next.js draft mode is enabled.
 * - `SanityLive` subscribes to content changes and revalidates the affected
 *   pages. It has to be rendered once in the root layout.
 *
 * Without a read token the site only serves published content — the draft mode then cannot be
 * enabled, which keeps builds without the secret (for example in CI) working.
 *
 * @see https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
 */
export const { sanityFetch, SanityLive } = defineLive({
	browserToken: readToken,
	client,
	serverToken: readToken,
});
