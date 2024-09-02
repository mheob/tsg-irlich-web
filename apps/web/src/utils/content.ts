/**
 * Checks if the given content is valid HTML.
 *
 * @param content - The content to check.
 * @returns `true` if the content is valid HTML, `false` otherwise.
 */
export function isHTML(content?: string): boolean {
	if (!content) return false;
	content = content.trim();
	return content.startsWith('<') && content.endsWith('>');
}
