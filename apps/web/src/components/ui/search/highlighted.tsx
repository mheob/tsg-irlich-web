import { Fragment } from 'react';

import { splitHighlights } from '@/lib/search/highlight';

/**
 * A title or snippet of a hit, with the places a search word starts a word wrapped in `<mark>`.
 *
 * @param props - The text and the words to look for.
 * @param props.text - The text.
 * @param props.words - The search words, lowercased, as `SearchResult.words` carries them.
 * @returns The text, its matches marked.
 */
function Highlighted({ text, words }: Readonly<HighlightedProps>) {
	const parts = splitHighlights(text, words);

	return parts.map((part, index) => {
		// Where a part starts in the text is unique, and the parts never change order.
		const key = parts.slice(0, index).reduce((offset, before) => offset + before.text.length, 0);

		return (
			<Fragment key={key}>
				{part.isMatch ? (
					<mark className="rounded-xs bg-secondary/70 text-inherit">{part.text}</mark>
				) : (
					part.text
				)}
			</Fragment>
		);
	});
}

interface HighlightedProps {
	text: string;
	words: string[];
}

export { Highlighted };
