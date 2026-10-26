import { stegaEncodeSourceMap } from '@sanity/client/stega';

const FAQ_DOCUMENT = { _id: 'faq-trial', _type: 'faq' };

/**
 * Encodes a text the way `sanityFetch` does in draft mode: the text followed by invisible characters
 * that point the presentation tool at its source. Those characters are no whitespace, so `trim()`
 * keeps them, which is what makes a blank draft value look filled.
 *
 * @param text - The visible text.
 * @param document - The document the text is said to come from.
 * @param document._id - Its id.
 * @param document._type - Its type.
 * @returns The text followed by its stega encoding.
 */
function encodeLikeDraftMode(
	text: string,
	document: { _id: string; _type: string } = FAQ_DOCUMENT,
): string {
	const { value } = stegaEncodeSourceMap(
		{ value: text },
		{
			documents: [document],
			mappings: {
				"$['value']": { source: { document: 0, path: 0, type: 'documentValue' }, type: 'value' },
			},
			paths: ["$['value']"],
		},
		{ enabled: true, studioUrl: 'https://studio.test' },
	);

	return value;
}

export { encodeLikeDraftMode };
