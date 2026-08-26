import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import honoraryMember from './honorary-member';

interface HonoraryMemberSelection {
	readonly firstName?: string;
	readonly lastName?: string;
	readonly media?: PreviewValue['media'];
}

function prepareHonoraryMember(selection: HonoraryMemberSelection): PreviewValue {
	return (
		honoraryMember.preview.prepare as unknown as (value: HonoraryMemberSelection) => PreviewValue
	)(selection);
}

describe('honorary member preview', () => {
	it('assembles the title as "lastName, firstName" and passes the media through', () => {
		const media = 'media-asset-abc';

		const result = prepareHonoraryMember({ firstName: 'Karl', lastName: 'Weber', media });

		expect(result).toStrictEqual({ media, title: 'Weber, Karl' });
	});

	it('stringifies a missing first name as the literal word "undefined"', () => {
		const result = prepareHonoraryMember({ lastName: 'Weber' });

		expect(result.title).toBe('Weber, undefined');
	});

	it('stringifies a missing last name as the literal word "undefined"', () => {
		const result = prepareHonoraryMember({ firstName: 'Karl' });

		expect(result.title).toBe('undefined, Karl');
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareHonoraryMember({ firstName: 'Karl', lastName: 'Weber', media });

		expect(result.media).toBe(media);
	});
});
