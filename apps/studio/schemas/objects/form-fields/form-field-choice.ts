import { RiListCheck2 } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { baseFieldDefinitions, prepareFieldPreview, readParentValue } from './base';

const formFieldChoice = defineType({
	fields: [
		...baseFieldDefinitions,
		defineField({
			name: 'options',
			of: [defineArrayMember({ type: 'string' })],
			title: 'Optionen',
			type: 'array',
			validation: (Rule) => Rule.required().min(2).unique(),
		}),
		defineField({
			initialValue: false,
			name: 'isMultiple',
			title: 'Mehrfachauswahl',
			type: 'boolean',
		}),
		defineField({
			hidden: ({ parent }) => Boolean(readParentValue({ parent }, 'isMultiple')),
			initialValue: 'buttons',
			name: 'display',
			options: {
				layout: 'radio',
				list: [
					{ title: 'Schaltflächen', value: 'buttons' },
					{ title: 'Liste', value: 'select' },
				],
			},
			title: 'Darstellung',
			type: 'string',
		}),
	],
	icon: RiListCheck2,
	name: 'formFieldChoice',
	preview: {
		prepare: prepareFieldPreview('Auswahl'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Auswahl',
	type: 'object',
});

export default formFieldChoice;
