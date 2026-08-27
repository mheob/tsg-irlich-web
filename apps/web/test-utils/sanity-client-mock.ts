import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';

import { client } from '@/lib/sanity/client';

/** A `client.fetch` call as the routes make it: a query, optional parameters and options. */
type ClientFetch = (
	query: string,
	params?: Record<string, unknown>,
	options?: Record<string, unknown>,
) => Promise<unknown>;

/**
 * The mocked `client.fetch`, typed by the shape the routes actually call.
 *
 * The real signature is a set of overloads whose return type carries the raw response envelope, so
 * a fixture would have to be cast at every `mockResolvedValue`. The module must already be
 * replaced with `vi.mock(import('@/lib/sanity/client'), …)` in the test file.
 *
 * @returns The mock behind `client.fetch`.
 */
function clientFetchMock(): MockedFunction<ClientFetch> {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion, typescript/unbound-method
	return vi.mocked(client.fetch) as unknown as MockedFunction<ClientFetch>;
}

export { clientFetchMock };
