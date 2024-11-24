import { defineLive } from 'next-sanity';

import { client } from './client';
import { token } from './server-token';

/**
 * Use defineLive to enable automatic revalidation and refreshing of your fetched content
 *
 * @see https://github.com/sanity-io/next-sanity?tab=readme-ov-file#1-configure-definelive
 */
export const { sanityFetch, SanityLive } = defineLive({
	// Required for stand-alone live previews, the token is only shared to the browser
	// if it's a valid Next.js Draft Mode session
	browserToken: token,
	client,
	// Required for showing draft content when the Sanity Presentation Tool is used,
	// or to enable the Vercel Toolbar Edit Mode
	serverToken: token,
});
