import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import author from './author';

interface AuthorSelection {
	readonly firstName?: string;
	readonly lastName?: string;
	readonly media?: PreviewValue['media'];
}

function prepareAuthor(selection: AuthorSelection): PreviewValue {
	return (author.preview.prepare as unknown as (value: AuthorSelection) => PreviewValue)(selection);
}

describe('author preview', () => {
	it('assembles the title as "lastName, firstName" and passes the media through', () => {
		const media = 'media-asset-abc';

		const result = prepareAuthor({ firstName: 'Anna', lastName: 'Schmidt', media });

		expect(result).toStrictEqual({ media, title: 'Schmidt, Anna' });
	});

	// Regression case: `prepare` interpolates its selected fields straight into a template literal,
	// so an absent value renders as the literal string "undefined" in the desk list and in
	// reference search results. Every field involved carries a `Rule.required()`, but Sanity
	// validation gates publishing, not autosave — a document still being filled in, or a draft
	// with the field cleared again, is a state an editor really sees. Lower severity than the
	// `spacer`/`group` defects: this one heals as soon as the field is filled, whereas those two
	// leave pre-existing documents permanently stuck. Pinned rather than fixed, since production
	// code is out of scope here.
	it('stringifies a missing first name as the literal word "undefined"', () => {
		const result = prepareAuthor({ lastName: 'Schmidt' });

		expect(result.title).toBe('Schmidt, undefined');
	});

	it('stringifies a missing last name as the literal word "undefined"', () => {
		const result = prepareAuthor({ firstName: 'Anna' });

		expect(result.title).toBe('undefined, Anna');
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareAuthor({ firstName: 'Anna', lastName: 'Schmidt', media });

		expect(result.media).toBe(media);
	});
});
