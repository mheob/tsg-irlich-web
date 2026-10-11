import { describe, expect, it } from 'vite-plus/test';

import type * as clientModule from '@/lib/sanity/client';

import { loadWithEnv } from '../../../test-utils/env';

type ClientModule = typeof clientModule;

const ENV = {
	NEXT_PUBLIC_SANITY_DATASET: 'development',
	NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
};

describe('sanity client', () => {
	// WEB-373: the API CDN kept answering with the old content for up to a minute after a change,
	// longer than the revalidation webhook waits. The render the webhook triggers fetched that old
	// content and Next.js cached it for 12 hours, so a menu change showed up one change late.
	it('reads from the API, not the API CDN', async () => {
		const { client } = await loadWithEnv<ClientModule>('@/lib/sanity/client', ENV);

		expect(client.config().useCdn).toBe(false);
	});
});
