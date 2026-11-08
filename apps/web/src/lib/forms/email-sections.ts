import type { EmailAnswerSection } from '@tsgi-web/email';
import type { FormAnswer, FormGroupAnswer } from '@tsgi-web/shared';
import { GROUP_FIELD_TYPE } from '@tsgi-web/shared';

const EMPTY_VALUE = '–';

function toRow(answer: FormGroupAnswer | FormAnswer): { label: string; value: string } {
	const joined = answer.values && answer.values.length > 0 ? answer.values.join(', ') : null;
	return { label: answer.label, value: answer.value ?? joined ?? EMPTY_VALUE };
}

function isShown(answer: FormGroupAnswer | FormAnswer): boolean {
	return answer.retention === undefined;
}

function toSection(
	answers: readonly (FormGroupAnswer | FormAnswer)[],
	heading: string | undefined,
): EmailAnswerSection {
	const rows = answers.filter((answer) => isShown(answer)).map((answer) => toRow(answer));
	return heading ? { heading, rows } : { rows };
}

/**
 * Turns the stored answers into the sections the mails list. Answers with a `retention` (the
 * ones the clean-up deletes or anonymises: addresses, birth dates) stay out, because a mail
 * cannot be cleaned up.
 *
 * @param answers - The answers of one submission.
 * @returns The sections, the first one without a heading for the top-level answers and one per
 * group entry headed with the group's label and the number of the entry, and whether any answer
 * was left out.
 */
function toEmailSections(answers: readonly FormAnswer[]): {
	hasHiddenFields: boolean;
	sections: EmailAnswerSection[];
} {
	const topLevel = answers.filter((answer) => answer.fieldType !== GROUP_FIELD_TYPE);
	const entries = answers
		.filter((answer) => answer.fieldType === GROUP_FIELD_TYPE)
		.flatMap((group) =>
			(group.entries ?? []).map((entry, index) => ({
				answers: entry.answers,
				heading: `${group.label} ${index + 1}`,
			})),
		);
	const parts = [{ answers: topLevel, heading: undefined }, ...entries];

	return {
		hasHiddenFields: parts.some((part) => part.answers.some((answer) => !isShown(answer))),
		sections: parts.map(({ answers: partAnswers, heading }) => toSection(partAnswers, heading)),
	};
}

export { toEmailSections };
