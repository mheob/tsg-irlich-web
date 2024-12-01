import { DEFAULT_LOCALE } from '@/constants/time';

/**
 * Formats a date into a localized string representation.
 *
 * @param date - The date to format
 * @param locale - The locale to use for formatting (defaults to 'de-DE')
 * @returns The formatted date string in the format DD.MMM.YYYY
 * @example
 * ```ts
 * getLocaleDate(new Date('2024-01-15')) // Returns "15. Januar 2024"
 * getLocaleDate(new Date('2024-01-15'), 'en-US') // Returns "January 15,2024"
 * ```
 */
export function getLocaleDate(date: Date | string, locale: string = DEFAULT_LOCALE): string {
	const dateObject = typeof date === 'string' ? new Date(date) : date;

	return new Intl.DateTimeFormat(locale, {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
	}).format(dateObject);
}
