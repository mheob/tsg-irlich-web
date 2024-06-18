import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/general-fields';
import { getMaxLengthRule, getMinLengthRule } from '@/shared/validation-rules';

const testimonialField = defineField({
	title: 'Zeugnis / Referenz',
	name: 'testimonialSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'testimonial',
	fields: [
		defineField({
			...titleField,
			group: undefined,
		}),
		defineField({
			...subTitleField,
			group: undefined,
		}),

		defineField({
			title: 'Zeugnis / Referenz',
			name: 'testimonials',
			type: 'array',
			of: [{ type: 'reference', to: { type: 'testimonial' } }],
			description: '',
			validation: rule => [
				getMinLengthRule(rule, 4, '"Zeugnis / Referenz"'),
				getMaxLengthRule(rule, 8, '"Zeugnis / Referenz"'),
			],
		}),
	],
});

export default testimonialField;
