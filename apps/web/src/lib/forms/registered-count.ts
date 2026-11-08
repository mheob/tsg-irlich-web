import { formRegisteredCountQuery } from '@/lib/sanity/queries/forms';
import { getWriteClient } from '@/lib/sanity/write-client';

const COUNT_REVALIDATE_SECONDS = 60;

/**
 * The cache tag of the registered count of one form. The submit action expires it, so the next
 * visitor sees the new count instead of the one up to a minute old.
 *
 * @param formId - The `_id` of the form.
 * @returns The tag.
 */
function submissionsTag(formId: string): string {
	return `form-submissions:${formId}`;
}

/**
 * How many submissions of a form are registered. The visitor's client has no access to
 * submissions, so it reads with the write client.
 *
 * @param formId - The `_id` of the form.
 * @returns The count; the waitlist and cancellations do not count.
 */
async function getRegisteredCount(formId: string): Promise<number> {
	return getWriteClient().fetch<number>(
		formRegisteredCountQuery,
		{ formId },
		{ next: { revalidate: COUNT_REVALIDATE_SECONDS, tags: [submissionsTag(formId)] } },
	);
}

export { getRegisteredCount, submissionsTag };
