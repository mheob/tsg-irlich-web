// oxlint-disable-next-line import/no-unassigned-import -- fails the build if a client component imports this file
import 'server-only';
import { createClient } from 'next-sanity';
import type { SanityClient } from 'next-sanity';

import { env } from '@/lib/env';
import { apiVersion, dataset, projectId } from '@/lib/sanity/api';

/**
 * A client that writes with the robot token. It is created on demand rather than at import, so
 * a build without the token still succeeds (unlike `live.ts`, which reads its token at import).
 *
 * `perspective: 'raw'` lets it see drafts and release versions: the webhook fires for drafts, and
 * the published-only default would answer "missing" for every one of them.
 *
 * @returns The write client.
 */
function getWriteClient(): SanityClient {
	return createClient({
		apiVersion,
		dataset,
		perspective: 'raw',
		projectId,
		token: env('SANITY_API_WRITE_TOKEN'),
		useCdn: false,
	});
}

export { getWriteClient };
