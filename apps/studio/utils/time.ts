/**
 * Formats a date into an ISO-like date string (YYYY-MM-DD)
 *
 * @param date - The date to format, can be a Date object or ISO string
 * @returns The formatted date string
 * @example
 * ```ts
 * formatDate(new Date()) // "2024-01-01"
 * formatDate("2024-01-01") // "2024-01-01"
 * ```
 */
export function formatDate(date: Date | string): string {
	const dateObject = typeof date === 'string' ? new Date(date) : date;
	return dateObject.toISOString().slice(2).split('T')[0];
}
