import { stegaClean } from 'next-sanity';

/** What the website reads of a FAQ to decide whether, and where, to show and mark it up. */
interface FaqEntry {
	/** The answer as plain text, from `pt::text()`. */
	answerText?: string | null;
	/** Whether the page shows the department the FAQ is assigned to first. */
	isMarkedUp?: boolean | null;
	question?: string | null;
}

/**
 * Checks that a FAQ has a question and an answer. Both fields are required in the studio, so only a
 * draft lacks one; such a FAQ is neither shown nor marked up, which keeps the `FAQPage` from naming
 * a question the page does not show.
 *
 * @param faq - The FAQ to check.
 * @param faq.answerText - The answer as plain text.
 * @param faq.question - The question.
 * @returns `true` when neither the question nor the answer text is missing or blank.
 */
function isCompleteFaq({ answerText, question }: FaqEntry): boolean {
	// In draft mode both strings carry stega characters, which are no whitespace to `trim()`.
	return Boolean(stegaClean(question)?.trim() && stegaClean(answerText)?.trim());
}

export { type FaqEntry, isCompleteFaq };
