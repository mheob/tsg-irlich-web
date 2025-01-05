import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';

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
			validation: Rule => [
				Rule.min(4).error('Mindestens 4 "Zeugnis / Referenz" müssen vorhanden sein'),
				Rule.max(8).error('Maximal 8 "Zeugnis / Referenz" dürfen gesetzt werden'),
			],
		}),
	],
	validation: Rule => [Rule.required().error('Zeugnis / Referenz ist erforderlich')],
});
