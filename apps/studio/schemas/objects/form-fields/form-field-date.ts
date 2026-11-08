import { RiCalendarLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { createBaseFields, prepareFieldPreview, readParentValue } from './base';

const formFieldDate = defineType({
	fields: [
		...createBaseFields({ offersYearRetention: true }),
		defineField({
			name: 'minAge',
			title: 'Mindestalter',
			type: 'number',
			validation: (Rule) => Rule.integer().positive(),
		}),
		defineField({
			name: 'referenceDate',
			title: 'Stichtag',
			type: 'date',
			validation: (Rule) =>
				Rule.custom((value, context) =>
					readParentValue(context, 'minAge') && !value ? 'Bitte einen Stichtag angeben' : true,
				),
		}),
	],
	icon: RiCalendarLine,
	name: 'formFieldDate',
	preview: {
		prepare: prepareFieldPreview('Datum'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Datum',
	type: 'object',
});

export default formFieldDate;
