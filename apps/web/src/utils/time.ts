import { DEFAULT_LOCALE } from '@/constants/time';

function getDateFormat(variant: 'long' | 'short'): Intl.DateTimeFormatOptions {
	return variant === 'long'
		? { day: 'numeric', month: 'long', year: 'numeric' }
		: { day: '2-digit', month: '2-digit', year: 'numeric' };
}

/**
 * Formats a date into a localized string representation
 *
 * @param date - The date to format, can be a Date object or ISO string
 * @param variant - The format variant to use:
 *   - 'long': Day, month name, and year (e.g. "1. Januar 2024") DEFAULT
 *   - 'short': Numeric day, month, and year (e.g. "01.01.2024")
 * @param locale - The locale to use for formatting, defaults to `de-DE`
 * @returns The formatted date string
 * @example
 * ```ts
 * getLocaleDate(new Date()) // "1. Januar 2024"
 * getLocaleDate("2024-01-01", "short") // "01.01.2024"
 * ```
 */
export function getLocaleDate(
	date: Date | string,
	variant: 'long' | 'short' = 'long',
	locale: string = DEFAULT_LOCALE,
): string {
	const dateObject = typeof date === 'string' ? new Date(date) : date;
	return new Intl.DateTimeFormat(locale, getDateFormat(variant)).format(dateObject);
}

/**
 * Tells when a published document last changed.
 *
 * Editors often finish a document before its scheduled publication, so the `_updatedAt` Sanity
 * keeps can predate the publication — and a document is never modified before it is published.
 *
 * @param publishedAt - When the document was published.
 * @param updatedAt - When the document was last saved.
 * @returns The later of the two timestamps, unchanged.
 */
export function getLastModified(publishedAt: string, updatedAt: string): string {
	return new Date(updatedAt) > new Date(publishedAt) ? updatedAt : publishedAt;
}
