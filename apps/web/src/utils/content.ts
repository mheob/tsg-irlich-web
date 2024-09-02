/**
 * Checks if the given content is an HTML string.
 *
 * @param content - The string to check.
 * @returns `true` if the content is an HTML string, `false` otherwise.
 */
export function isHTML(content: string): boolean {
	content = content.trim();
	return content.startsWith('<') && content.endsWith('>');
}
