import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GET } from '@/app/api/forms/cleanup/route';
import { dueSubmissionsQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';

vi.mock(import('@/lib/sanity/write-client'), () => ({ getWriteClient: vi.fn() }));
// `api.ts` reads the project and the dataset at import time, before any `beforeAll` could stub them.
vi.mock(import('@/lib/sanity/api'), () => ({
	apiVersion: '2025-12-15',
	dataset: 'development',
	projectId: 'j4rxwl5m',
	studioUrl: undefined,
}));

const NOW = new Date('2026-11-08T03:00:00.000Z');
const SECRET = 'cron-secret';

const mockedFetch = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const mockedCommit = vi.fn<() => Promise<unknown>>();
const patches: { id: string; revision?: string; values?: unknown }[] = [];

interface FakePatch {
	ifRevisionId: (rev: string) => FakePatch;
	set: (values: unknown) => FakePatch;
}

function request(authorization?: string): Request {
	return new Request('https://example.com/api/forms/cleanup', {
		headers: authorization === undefined ? {} : { authorization },
	});
}

describe('form submission clean-up cron', () => {
	beforeAll(() => {
		vi.stubEnv('CRON_SECRET', SECRET);
	});

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		const transaction = {
			commit: mockedCommit,
			patch: (id: string, build: (patch: FakePatch) => unknown) => {
				const recorded: (typeof patches)[number] = { id };
				patches.push(recorded);
				const patch: FakePatch = {
					ifRevisionId: (rev) => {
						recorded.revision = rev;
						return patch;
					},
					set: (values) => {
						recorded.values = values;
						return patch;
					},
				};
				build(patch);
				return transaction;
			},
		};
		vi.mocked(getWriteClient).mockReturnValue({
			fetch: mockedFetch,
			transaction: () => transaction,
		} as unknown as ReturnType<typeof getWriteClient>);
		mockedCommit.mockResolvedValue({});
	});

	afterEach(() => {
		vi.useRealTimers();
		mockedFetch.mockReset();
		mockedCommit.mockReset();
		patches.length = 0;
	});

	it('rejects a missing secret', async () => {
		const response = await GET(request());

		expect(response.status).toBe(401);
		expect(mockedFetch).not.toHaveBeenCalled();
	});

	it('rejects a wrong secret', async () => {
		const response = await GET(request('Bearer wrong-secret'));

		expect(response.status).toBe(401);
		expect(mockedFetch).not.toHaveBeenCalled();
	});

	it('rejects a secret of a different length', async () => {
		const response = await GET(request('Bearer x'));

		expect(response.status).toBe(401);
	});

	it('cleans every due submission in one transaction', async () => {
		mockedFetch.mockResolvedValue([
			{
				_id: 'sub-1',
				_rev: 'rev-1',
				answers: [{ _key: 'a1', fieldKey: 'street', type: 'address', value: 'Hauptstr. 1' }],
			},
			{ _id: 'sub-2', _rev: 'rev-2', answers: null },
		]);

		const response = await GET(request(`Bearer ${SECRET}`));

		await expect(response.json()).resolves.toStrictEqual({ cleaned: 2 });
		expect(mockedFetch).toHaveBeenCalledExactlyOnceWith(dueSubmissionsQuery);
		expect(mockedCommit).toHaveBeenCalledOnce();
		expect(patches).toMatchObject([
			{ id: 'sub-1', revision: 'rev-1', values: { cleanedAt: NOW.toISOString() } },
			{ id: 'sub-2', revision: 'rev-2', values: { answers: [], cleanedAt: NOW.toISOString() } },
		]);
	});

	it('returns 0 without committing when nothing is due', async () => {
		mockedFetch.mockResolvedValue([]);

		const response = await GET(request(`Bearer ${SECRET}`));

		await expect(response.json()).resolves.toStrictEqual({ cleaned: 0 });
		expect(mockedCommit).not.toHaveBeenCalled();
	});

	it('answers 500 without details when the commit fails', async () => {
		const consoleError = vi.spyOn(console, 'error').mockReturnValue();
		mockedFetch.mockResolvedValue([{ _id: 'sub-1', _rev: 'rev-1', answers: [] }]);
		mockedCommit.mockRejectedValue(new Error('revision mismatch'));

		const response = await GET(request(`Bearer ${SECRET}`));

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toStrictEqual({ error: 'Cleanup failed' });
		expect(consoleError).toHaveBeenCalledWith(expect.any(Error));
		consoleError.mockRestore();
	});
});
