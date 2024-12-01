/**
 * Capitalizes the first letter of a string.
 *
 * @param text - The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeString(text: string): string {
	if (!text) return '';
	return text.charAt(0).toUpperCase() + text.slice(1);
}
