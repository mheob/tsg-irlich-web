import type { PreviewValue } from 'sanity';
import { describe, expect, it } from 'vitest';

import testimonial from './testimonial';

interface TestimonialSelection {
	readonly firstName?: string;
	readonly lastName?: string;
	readonly media?: PreviewValue['media'];
	readonly role?: string;
}

function prepareTestimonial(selection: TestimonialSelection): PreviewValue {
	return (testimonial.preview.prepare as unknown as (value: TestimonialSelection) => PreviewValue)(
		selection,
	);
}

describe('testimonial preview', () => {
	it('assembles the title from the name and role', () => {
		const media = 'media-asset-abc';

		const result = prepareTestimonial({
			firstName: 'Lena',
			lastName: 'Fischer',
			media,
			role: 'Vereinsmitglied',
		});

		expect(result).toStrictEqual({ media, title: 'Fischer, Lena - Vereinsmitglied' });
	});

	it('stringifies a missing first name as the literal word "undefined"', () => {
		const result = prepareTestimonial({ lastName: 'Fischer', role: 'Vereinsmitglied' });

		expect(result.title).toBe('Fischer, undefined - Vereinsmitglied');
	});

	it('stringifies a missing last name as the literal word "undefined"', () => {
		const result = prepareTestimonial({ firstName: 'Lena', role: 'Vereinsmitglied' });

		expect(result.title).toBe('undefined, Lena - Vereinsmitglied');
	});

	it('stringifies a missing role as the literal word "undefined"', () => {
		const result = prepareTestimonial({ firstName: 'Lena', lastName: 'Fischer' });

		expect(result.title).toBe('Fischer, Lena - undefined');
	});

	it('passes the selected media through unchanged', () => {
		const media = 'media-asset-xyz';

		const result = prepareTestimonial({
			firstName: 'Lena',
			lastName: 'Fischer',
			media,
			role: 'Vereinsmitglied',
		});

		expect(result.media).toBe(media);
	});
});
