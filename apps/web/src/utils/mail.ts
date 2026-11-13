/** Where the buttons of a page send an inquiry, as the editors set it in the studio. */
interface Inquiry {
	email: string;
	subject: string;
}

/**
 * Builds the `mailto:` link of an inquiry, with the subject encoded for the URL.
 *
 * @param inquiry - The address and the subject.
 * @param topic - What the inquiry is about, such as the title of a card. It follows the subject
 *   after a colon; without one the subject stands as it is.
 * @returns The `mailto:` link.
 */
function getMailHref(inquiry: Readonly<Inquiry>, topic?: string): string {
	const subject = topic ? `${inquiry.subject}: ${topic}` : inquiry.subject;

	return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}`;
}

export { getMailHref };
