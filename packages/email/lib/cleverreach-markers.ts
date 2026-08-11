// CleverReach marks editable regions with HTML comments (`<!--#html#-->`). React cannot
// render comments, so the `Cr*` components in `cleverreach-tags.tsx` emit plain-text
// markers that `toCleverReachTemplate` turns into comments after rendering.
//
// Markers avoid `<`, `>` and `&` so React does not escape them. Attribute values must not
// contain spaces or `|`.
//
// See https://eddytor.cleverreach.com/assets/docs/howto-templates.htm

const MARKER_PREFIX = '@@CR|';
const MARKER_SUFFIX = '@@';
// Matched without a capture group: the web app type-checks this package with
// `target: ES2017`, which rejects named groups, and unnamed groups are linted against.
const MARKER_PATTERN = /@@CR\|[^@]+@@/gu;
// React inserts these between adjacent text and element children.
const REACT_TEXT_SEPARATOR_PATTERN = /<!-- -->/gu;

type Attributes = Record<string, string | undefined>;

function toComment(body: string): string {
	const [tag, ...attributes] = body.split('|');
	const rendered = attributes
		.map((attribute) => {
			const [key, value] = attribute.split('=');
			return ` ${key}="${value}"`;
		})
		.join('');

	return `<!--#${tag}${rendered}#-->`;
}

export function marker(tag: string, attributes: Attributes = {}): string {
	const parts = Object.entries(attributes)
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => `|${key}=${value}`)
		.join('');

	return `${MARKER_PREFIX}${tag}${parts}${MARKER_SUFFIX}`;
}

// Turns the markers of a rendered e-mail into CleverReach template comments.
export function toCleverReachTemplate(html: string): string {
	return html
		.replaceAll(REACT_TEXT_SEPARATOR_PATTERN, '')
		.replaceAll(MARKER_PATTERN, (match) =>
			toComment(match.slice(MARKER_PREFIX.length, -MARKER_SUFFIX.length)),
		);
}

// Removes all markers, for HTML that is sent as-is instead of imported as a template.
export function stripCleverReachMarkers(html: string): string {
	return html.replaceAll(MARKER_PATTERN, '');
}
