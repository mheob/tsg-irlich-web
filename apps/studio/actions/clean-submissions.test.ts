import type { SanityClient } from 'sanity';
import type { Mock } from 'vite-plus/test';
import { describe, expect, it, vi } from 'vite-plus/test';

import { cleanSubmissions } from './clean-submissions';

function createClient(rows: unknown[]): {
	client: Pick<SanityClient, 'fetch' | 'transaction'> & { fetch: Mock; transaction: Mock };
	commit: Mock;
	patch: Mock;
} {
	const patch = vi.fn();
	const commit = vi.fn().mockResolvedValue({});
	const transaction = {
		commit,
		patch: patch.mockReturnThis(),
	};
	return {
		client: {
			fetch: vi.fn().mockResolvedValue(rows),
			transaction: vi.fn(() => transaction),
		} as never as Pick<SanityClient, 'fetch' | 'transaction'> & {
			fetch: Mock;
			transaction: Mock;
		},
		commit,
		patch,
	};
}

const dirty = (id: string, rev: string): Record<string, unknown> => ({
	_id: id,
	_rev: rev,
	answers: [
		{
			_key: 'a1',
			_type: 'formAnswer',
			fieldType: 'formFieldDate',
			key: 'birth',
			label: 'Geburtsdatum',
			retention: 'year',
			value: '2008-03-17',
		},
	],
});

describe('clean submissions', () => {
	it('cleans every uncleaned submission in one transaction', async () => {
		const { client, commit, patch } = createClient([
			dirty('form.submission.1', 'r1'),
			dirty('form.submission.2', 'r2'),
			{ ...dirty('drafts.form.submission.3', 'r3') },
		]);

		const count = await cleanSubmissions(client, 'form-1', new Date('2027-05-20T10:00:00Z'));

		expect(count).toBe(2);
		expect(client.transaction).toHaveBeenCalledOnce();
		expect(patch).toHaveBeenCalledTimes(2);
		expect(patch).toHaveBeenNthCalledWith(1, 'form.submission.1', {
			ifRevisionID: 'r1',
			set: {
				answers: [expect.objectContaining({ value: '2008' })],
				cleanedAt: '2027-05-20T10:00:00.000Z',
			},
		});
		expect(commit).toHaveBeenCalledOnce();
	});

	it('queries only submissions of the form that are not cleaned yet', async () => {
		const { client } = createClient([]);

		await cleanSubmissions(client, 'form-1');

		expect(client.fetch).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining('!defined(cleanedAt)'),
			{ id: 'form-1' },
		);
	});

	it('returns 0 and commits nothing when all are clean', async () => {
		const { client, commit } = createClient([]);

		const count = await cleanSubmissions(client, 'form-1');

		expect(count).toBe(0);
		expect(client.transaction).not.toHaveBeenCalled();
		expect(commit).not.toHaveBeenCalled();
	});
});
