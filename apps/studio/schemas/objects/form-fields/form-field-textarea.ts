import { RiFileTextLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { baseFieldDefinitions, prepareFieldPreview } from './base';

const formFieldTextarea = defineType({
	fields: [
		...baseFieldDefinitions,
		defineField({
			name: 'maxLength',
			title: 'Maximale Länge',
			type: 'number',
			validation: (Rule) => Rule.integer().positive(),
		}),
	],
	icon: RiFileTextLine,
	name: 'formFieldTextarea',
	preview: {
		prepare: prepareFieldPreview('Text (mehrzeilig)'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Text (mehrzeilig)',
	type: 'object',
});

export default formFieldTextarea;
