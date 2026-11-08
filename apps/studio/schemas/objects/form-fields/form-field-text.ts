import { RiText } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { baseFieldDefinitions, hideInsideGroup, prepareFieldPreview } from './base';

const formFieldText = defineType({
	fields: [
		...baseFieldDefinitions,
		defineField({
			name: 'maxLength',
			title: 'Maximale Länge',
			type: 'number',
			validation: (Rule) => Rule.integer().positive(),
		}),
		defineField({
			description: 'Der Wert benennt den Eingang im Studio und im Export, z. B. der Teamname.',
			hidden: hideInsideGroup,
			name: 'isLabel',
			title: 'Bezeichnet den Eingang',
			type: 'boolean',
		}),
	],
	icon: RiText,
	name: 'formFieldText',
	preview: {
		prepare: prepareFieldPreview('Text'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Text',
	type: 'object',
});

export default formFieldText;
