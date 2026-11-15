import { at, defineMigration, set } from 'sanity/migrate';
import type { NodePatch } from 'sanity/migrate';

import { getSkippedHeadings } from '../../utils/heading-order';

/**
 * Lifts every H3 before the first H2 of an article to H2 (WEB-301).
 *
 * The editors used H3 for their subheadings, so most articles jumped from the `h1` of the headline
 * straight to `h3`. An H3 below an H2 stays, because it is in order.
 *
 * @param body - The `body` of a news article, as stored.
 * @returns One patch per heading to lift; none when nothing skips a level.
 */
function getHeadingLevelPatches(body: unknown): NodePatch[] {
	return getSkippedHeadings(body).map(({ blockKey, sectionKey }) =>
		at(['body', { _key: sectionKey }, 'text', { _key: blockKey }, 'style'], set('h2')),
	);
}

export default defineMigration({
	documentTypes: ['news.article'],
	migrate: {
		// A body that opens with an H2 gets no patch, which also makes a second run a no-op.
		document({ body }) {
			return getHeadingLevelPatches(body);
		},
	},
	title: 'Zwischenüberschriften der News-Artikel von H3 auf H2 heben, wenn davor keine H2 steht',
});

export { getHeadingLevelPatches };
