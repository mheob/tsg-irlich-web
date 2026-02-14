import { defineEnableDraftMode } from 'next-sanity/draft-mode';

import { env } from '@/lib/env';
import { client } from '@/lib/sanity/client';

/**
 * API route to enable Draft Mode for Sanity content preview.
 *
 * This route is called by the Sanity Presentation Tool to enable
 * draft mode in the Next.js application, allowing editors to preview
 * unpublished content changes.
 *
 * @see https://nextjs.org/docs/app/guides/draft-mode
 * @see https://www.sanity.io/docs/visual-editing/visual-editing-with-next-js-app-router
 */
export const { GET } = defineEnableDraftMode({
	client: client.withConfig({
		token: env('SANITY_API_READ_TOKEN'),
	}),
});
