import { timingSafeEqual } from 'node:crypto';

import { cleanAnswers } from '@tsgi-web/shared';
import type { FormAnswer } from '@tsgi-web/shared';

import { env } from '@/lib/env';
import { dueSubmissionsQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';

// The generated result type adds a `_key` to every array member, which the shared `FormAnswer`
// (what `cleanAnswers` takes and gives back) does not model, so the rows are typed by hand.
interface DueSubmission {
	_id: string;
	_rev: string;
	answers: FormAnswer[] | null;
}

/**
 * Compares the `authorization` header with the cron secret without leaking, through timing, how
 * much of it matched. `timingSafeEqual` needs buffers of one length, so a different length is
 * rejected up front.
 *
 * @param header - The `authorization` header of the request.
 * @returns Whether the header carries the cron secret.
 */
function isAuthorized(header: string | null): boolean {
	if (header === null) {
		return false;
	}

	const given = Buffer.from(header);
	const expected = Buffer.from(`Bearer ${env('CRON_SECRET')}`);

	return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Cleans every due submission in one transaction, each patch guarded by the revision it read, so a
 * submission that changed in between fails the run and the next one picks everything up again.
 *
 * @param cleanedAt - The time to record as `cleanedAt`.
 * @returns How many submissions were cleaned; without any, nothing is committed.
 */
async function cleanDueSubmissions(cleanedAt: string): Promise<number> {
	const client = getWriteClient();
	const due = await client.fetch<DueSubmission[]>(dueSubmissionsQuery);
	if (due.length === 0) {
		return 0;
	}

	let transaction = client.transaction();
	for (const { _id, _rev, answers } of due) {
		transaction = transaction.patch(_id, (patch) =>
			patch.ifRevisionId(_rev).set({ answers: cleanAnswers(answers ?? []), cleanedAt }),
		);
	}
	await transaction.commit();

	return due.length;
}

/**
 * The daily Vercel cron job: applies the retention of every answer to the submissions whose form
 * reached its clean-up date and marks them as cleaned.
 *
 * @param request - The cron request; Vercel sends the secret as a bearer token.
 * @returns How many submissions were cleaned.
 */
export async function GET(request: Request): Promise<Response> {
	if (!isAuthorized(request.headers.get('authorization'))) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		return Response.json({ cleaned: await cleanDueSubmissions(new Date().toISOString()) });
	} catch (error: unknown) {
		console.error(error);
		return Response.json({ error: 'Cleanup failed' }, { status: 500 });
	}
}
