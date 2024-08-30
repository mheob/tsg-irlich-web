import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';
import { maxLengthRule } from '@/shared/validation-rules';

export const testimonialField = defineField({
	title: 'Zeugnis / Referenz',
	name: 'testimonialSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'testimonial',
	fields: [
		defineField({ ...titleField, group: undefined }),
		defineField({ ...subTitleField, group: undefined }),

		defineField({
			title: 'Zeugnis / Referenz',
			name: 'testimonials',
			type: 'array',
			of: [{ type: 'reference', to: { type: 'testimonial' } }],
			validation: rule => [
				// minLengthRule(rule, 4, 'Das Zeugnis bzw. die Referenz'),
				maxLengthRule(rule, 8, 'Das Zeugnis bzw. die Referenz'),
			],
		}),
	],
});
