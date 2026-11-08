import type { SanityClient } from 'sanity';

import { cleanAnswers } from '@tsgi-web/shared';
import type { FormAnswer } from '@tsgi-web/shared';

const UNCLEANED_SUBMISSIONS_QUERY = /* groq */ `*[_type == "form.submission" && form._ref == $id && !defined(cleanedAt) && !(_id in path("drafts.**"))]{ _id, _rev, answers }`;

const DRAFT_PREFIX = 'drafts.';

interface UncleanedSubmission {
	_id: string;
	_rev: string;
	answers?: FormAnswer[] | null;
}

/**
 * Applies the retention of every answer to all submissions of a form that were not cleaned yet and
 * marks them as cleaned. All patches go into one transaction, each guarded by the revision it
 * read, so a submission that changed in between makes the whole run fail instead of losing data.
 *
 * @param client - The studio client.
 * @param formId - The published id of the form.
 * @param now - The time to record as `cleanedAt`.
 * @returns How many submissions were cleaned.
 */
async function cleanSubmissions(
	client: Pick<SanityClient, 'fetch' | 'transaction'>,
	formId: string,
	now: Date = new Date(),
): Promise<number> {
	const rows = await client.fetch<UncleanedSubmission[]>(UNCLEANED_SUBMISSIONS_QUERY, {
		id: formId,
	});
	const due = rows.filter((row) => !row._id.startsWith(DRAFT_PREFIX));
	if (due.length === 0) {
		return 0;
	}

	const cleanedAt = now.toISOString();
	let transaction = client.transaction();
	for (const row of due) {
		transaction = transaction.patch(row._id, {
			ifRevisionID: row._rev,
			set: { answers: cleanAnswers(row.answers ?? []), cleanedAt },
		});
	}
	await transaction.commit();

	return due.length;
}

export { cleanSubmissions };
