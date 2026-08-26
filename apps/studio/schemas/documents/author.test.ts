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
