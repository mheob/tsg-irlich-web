import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

export const testimonialField = defineField({
	fields: [
		getFieldWithoutGroup(titleField),
		getFieldWithoutGroup(subTitleField),

		defineField({
			name: 'testimonials',
			of: [{ to: { type: 'testimonial' }, type: 'reference' }],
			title: 'Zeugnis / Referenz',
			type: 'array',
			validation: (Rule) => [
				Rule.min(4).error('Mindestens 4 "Zeugnis / Referenz" müssen vorhanden sein'),
				Rule.max(8).error('Maximal 8 "Zeugnis / Referenz" dürfen gesetzt werden'),
			],
		}),
	],
	group: 'testimonial',
	icon: RiLinksLine,
	name: 'testimonialSection',
	title: 'Zeugnis / Referenz',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Zeugnis / Referenz ist erforderlich')],
});
