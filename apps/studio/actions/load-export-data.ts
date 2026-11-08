import type { SanityClient } from 'sanity';

import type { ExportSubmission, FormFieldShape } from '@tsgi-web/shared';

/** Used for the file name when a form somehow has no slug. */
const FALLBACK_SLUG = 'formular';

const EXPORT_DATA_QUERY = /* groq */ `{
	"form": *[_id == $id][0]{ "slug": slug.current, fields[]{ _key, _type, label, fields[]{ _key, _type, label } } },
	"submissions": *[_type == "form.submission" && form._ref == $id && !(_id in path("drafts.**"))]{ _id, answers, label, status, submittedAt }
}`;

interface ExportData {
	fields: FormFieldShape[];
	slug: string;
	submissions: ExportSubmission[];
}

interface ExportDataResult {
	form: { fields?: FormFieldShape[] | null; slug?: string | null } | null;
	submissions: ExportSubmission[] | null;
}

/**
 * Loads what the export of a form needs: its fields, its slug and all of its submissions, in a
 * single request.
 *
 * @param client - The studio client.
 * @param formId - The published id of the form.
 * @returns The fields, the slug for the file name and the submissions.
 */
async function loadExportData(
	client: Pick<SanityClient, 'fetch'>,
	formId: string,
): Promise<ExportData> {
	const result = await client.fetch<ExportDataResult>(EXPORT_DATA_QUERY, { id: formId });

	return {
		fields: result.form?.fields ?? [],
		slug: result.form?.slug ?? FALLBACK_SLUG,
		submissions: result.submissions ?? [],
	};
}

export type { ExportData };
export { loadExportData };
