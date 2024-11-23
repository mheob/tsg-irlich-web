/**
 * Generates initials from a person's first and last name.
 *
 * @param firstName - The person's first name
 * @param lastName - The person's last name
 * @returns A string containing the first letter of each name in uppercase, or '?' for missing names
 *
 * @example
 * ```ts
 * getInitials('John', 'Doe') // Returns 'JD'
 * getInitials('Jane', '') // Returns 'J?'
 * getInitials('', '') // Returns '??'
 * ```
 */
export function getInitials(firstName: string, lastName: string): string {
	const sanitizedFirst = (firstName || '').trim();
	const sanitizedLast = (lastName || '').trim();

	if (!sanitizedFirst && !sanitizedLast) return '??';

	return `${sanitizedFirst.charAt(0) || '?'}${sanitizedLast.charAt(0) || '?'}`.toUpperCase();
}
