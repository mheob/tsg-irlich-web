/** A subheading of an article body, addressed by the keys of its section and its block. */
interface BodyHeading {
	/** The `_key` of the block inside the section's `text`. */
	blockKey: string;
	/** The `_key` of the `blockContent` section inside `body`. */
	sectionKey: string;
	style: 'h2' | 'h3';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isHeadingStyle(style: unknown): style is BodyHeading['style'] {
	return style === 'h2' || style === 'h3';
}

/**
 * Lists the subheadings of an article body in the order the website renders them.
 *
 * Only the `blockContent` sections on the top level count. A `blockContent` inside a `grid` is no
 * heading on the page: the article page renders a grid's images and nothing else. A section or block
 * without a `_key` cannot be addressed by a patch or a validation marker, so it is left out.
 *
 * @param body - The `body` of a news article, as stored.
 * @returns Every H2 and H3 block, in order.
 */
function getBodyHeadings(body: unknown): BodyHeading[] {
	if (!Array.isArray(body)) {
		return [];
	}

	return body.flatMap((section: unknown) => {
		if (
			!isRecord(section) ||
			section._type !== 'blockContent' ||
			typeof section._key !== 'string' ||
			!Array.isArray(section.text)
		) {
			return [];
		}

		const sectionKey = section._key;

		return section.text.flatMap((block: unknown) =>
			isRecord(block) &&
			block._type === 'block' &&
			typeof block._key === 'string' &&
			isHeadingStyle(block.style)
				? [{ blockKey: block._key, sectionKey, style: block.style }]
				: [],
		);
	});
}

/**
 * Finds the subheadings that skip a level: every H3 before the first H2 of an article (WEB-301).
 *
 * The headline of an article is its `h1`, so an H3 with no H2 above it jumps from `h1` to `h3`.
 * Screen-reader users move through a page by its headings, and axe's `heading-order` reports the
 * gap. The editors only have H2 and H3, so an H3 after the first H2 is always in order.
 *
 * @param body - The `body` of a news article, as stored.
 * @returns The H3 blocks that have to become H2, in order; empty when nothing skips a level.
 */
function getSkippedHeadings(body: unknown): BodyHeading[] {
	const skipped: BodyHeading[] = [];

	for (const heading of getBodyHeadings(body)) {
		if (heading.style === 'h2') {
			break;
		}
		skipped.push(heading);
	}

	return skipped;
}

export { getSkippedHeadings };
