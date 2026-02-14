import { defineLive } from 'next-sanity/live';

import { client } from './client';

// Access token directly - Next.js will handle server/client bundling correctly
// eslint-disable-next-line node/prefer-global/process -- Server-only env var, no build-time inlining needed
const token = process.env.SANITY_API_READ_TOKEN;

/**
 * Live Content API configuration for real-time content updates.
 *
 * This provides:
 * - `sanityFetch`: A fetch function that automatically handles draft mode
 * - `SanityLive`: A component that enables live content updates
 *
 * @see https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
 */
export const { sanityFetch, SanityLive } = defineLive({
	browserToken: token,
	client,
	fetchOptions: {
		revalidate: 60,
	},
	serverToken: token,
});
