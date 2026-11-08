import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { formRegisteredCountQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';

import { getRegisteredCount, submissionsTag } from './registered-count';

const mockedFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>();

vi.mock(import('@/lib/sanity/write-client'), () => ({
	getWriteClient: vi.fn(),
}));

describe('registered count', () => {
	afterEach(() => {
		mockedFetch.mockReset();
		vi.mocked(getWriteClient).mockReset();
	});

	it('names the tag after the form', () => {
		expect(submissionsTag('form-1')).toBe('form-submissions:form-1');
	});

	it('queries with the form id and the submissions tag', async () => {
		mockedFetch.mockResolvedValue(7);
		vi.mocked(getWriteClient).mockReturnValue({ fetch: mockedFetch } as unknown as ReturnType<
			typeof getWriteClient
		>);

		await expect(getRegisteredCount('form-1')).resolves.toBe(7);

		expect(mockedFetch).toHaveBeenCalledExactlyOnceWith(
			formRegisteredCountQuery,
			{ formId: 'form-1' },
			{ next: { revalidate: 60, tags: ['form-submissions:form-1'] } },
		);
	});
});
