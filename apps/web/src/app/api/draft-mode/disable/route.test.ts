import { draftMode } from 'next/headers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/draft-mode/disable/route';

// `draftMode()` reads the request cookies through Next's async storage, which no test request
// provides; the mock turns the disable call into something observable.
vi.mock(import('next/headers'), () => ({ draftMode: vi.fn() }));

const mockedDraftMode = vi.mocked(draftMode);
const disable = vi.fn();

describe('leaving the draft mode', () => {
	afterEach(() => {
		mockedDraftMode.mockReset();
		disable.mockReset();
	});

	it('turns the draft mode off and returns to the home page', async () => {
		// The real return value carries `isEnabled` and an `enable` binding as well; the route only
		// ever calls `disable`.
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion
		mockedDraftMode.mockResolvedValue({ disable } as unknown as Awaited<
			ReturnType<typeof draftMode>
		>);

		const response = await GET();

		expect(disable).toHaveBeenCalledWith();
		expect(response.status).toBe(307);
		expect(response.headers.get('location')).toBe('http://localhost:3000/');
	});
});
