import { defineEnableDraftMode } from 'next-sanity/draft-mode';

import { env } from '@/lib/env';
import { client } from '@/lib/sanity/client';

/**
 * Enables the Next.js draft mode for a preview session.
 *
 * The Sanity Presentation tool calls this route with a signed secret when it
 * opens the preview. The handler validates that secret against the Content Lake
 * before the draft mode cookie is set.
 */
export const { GET } = defineEnableDraftMode({
	client: client.withConfig({ token: env('SANITY_API_READ_TOKEN') }),
});
