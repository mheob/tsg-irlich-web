import type { Inquiry } from './types';

// Builds the `mailto:` link of an inquiry. With a topic (the title of a card) the subject reads
// `<subject>: <topic>`.
function getMailHref(inquiry: Inquiry, topic?: string): string {
	const subject = topic ? `${inquiry.subject}: ${topic}` : inquiry.subject;

	return `mailto:${inquiry.email}?subject=${encodeURIComponent(subject)}`;
}

export { getMailHref };
