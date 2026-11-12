import type { Inquiry } from './types';

// Builds the `mailto:` link of an inquiry, with the subject encoded for the URL.
function getMailHref(inquiry: Inquiry): string {
	return `mailto:${inquiry.email}?subject=${encodeURIComponent(inquiry.subject)}`;
}

export { getMailHref };
