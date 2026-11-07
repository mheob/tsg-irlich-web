import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { client } from '@/lib/sanity/client';
import { organizationQuery } from '@/lib/sanity/queries/shared/organization';

import { clientFetchMock } from '../../../test-utils/sanity-client-mock';
import { getOrganization } from './organization';

vi.mock(import('@/lib/sanity/client'), () => ({
	client: { fetch: vi.fn() } as unknown as typeof client,
}));

const mockedFetch = clientFetchMock();

describe('the organization of the site settings', () => {
	afterEach(() => {
		mockedFetch.mockReset();
	});

	// WEB-415: the footer read it without any cache option, so every render of a dynamic page asked
	// Sanity again, and the layout only with a tag.
	it('caches it for twelve hours under the type of the site settings', async () => {
		mockedFetch.mockResolvedValue({ contact: { email: 'info@tsg-irlich.de' } });

		await expect(getOrganization()).resolves.toStrictEqual({
			contact: { email: 'info@tsg-irlich.de' },
		});
		expect(mockedFetch).toHaveBeenCalledWith(
			organizationQuery,
			{},
			{ next: { revalidate: 43_200, tags: ['site-settings'] } },
		);
	});

	it('passes a failure on to the caller, which decides how to degrade', async () => {
		mockedFetch.mockRejectedValue(new Error('content lake unreachable'));

		await expect(getOrganization()).rejects.toThrow('content lake unreachable');
	});
});
