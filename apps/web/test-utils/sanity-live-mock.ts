import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';

import { sanityFetch } from '@/lib/sanity/live';

/** A `sanityFetch` call as the previewable routes make it. */
type SanityFetch = (options: {
	params?: Record<string, unknown>;
	query: string;
	stega?: boolean;
}) => Promise<{ data: unknown }>;

/**
 * The mocked `sanityFetch`, typed by the shape the previewable routes actually call.
 *
 * Its real return type carries the live-query envelope, which a fixture would have to restate at
 * every `mockImplementation`. The module must already be replaced with
 * `vi.mock(import('@/lib/sanity/live'), …)` in the test file — importing the real one would read
 * `SANITY_API_READ_TOKEN` and open a live connection.
 *
 * @returns The mock behind `sanityFetch`.
 */
function sanityFetchMock(): MockedFunction<SanityFetch> {
	return vi.mocked(sanityFetch);
}

export { sanityFetchMock };
