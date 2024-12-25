/**
 * Capitalizes the first letter of a string.
 *
 * @param input - The string to capitalize
 * @returns The capitalized string
 */
export function capitalizeString(input: string): string {
	if (!input) return '';
	return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Capitalizes the first letter of each word in a string.
 *
 * @param input - The string to capitalize
 * @param separator - The separator to use to split the string into words
 * @returns The capitalized string
 */
export function capitalizeWords(input: string, separator: string = '-'): string {
	if (!input) return '';
	return input
		.split(separator)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}
