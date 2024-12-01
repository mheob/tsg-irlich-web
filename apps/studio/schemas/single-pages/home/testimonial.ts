import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';
import { maxLengthRule, minLengthRule, requiredRule } from '@/shared/validation-rules';

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
				minLengthRule(rule, 4, '', {
					message: 'Mindestens 4 "Zeugnis / Referenz" müssen vorhanden sein',
					type: 'error',
				}),
				maxLengthRule(rule, 8, '', {
					message: 'Maximal 8 "Zeugnis / Referenz" dürfen gesetzt werden',
					type: 'error',
				}),
			],
		}),
	],
	validation: rule => [requiredRule(rule, 'Zeugnis / Referenz')],
});
