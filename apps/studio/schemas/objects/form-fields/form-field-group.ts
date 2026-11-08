import { RiGroupLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { createBaseFields, prepareFieldPreview, readParentValue } from './base';

/** The kinds of fields a group entry can hold: every type of the form except a group. */
const GROUP_FIELD_TYPES = [
	'formFieldText',
	'formFieldTextarea',
	'formFieldEmail',
	'formFieldPhone',
	'formFieldNumber',
	'formFieldDate',
	'formFieldChoice',
	'formFieldConsent',
	'formFieldNote',
] as const;

const formFieldGroup = defineType({
	fields: [
		...createBaseFields({ hidden: ['retention'] }),
		defineField({
			name: 'itemLabel',
			title: 'Bezeichnung eines Eintrags',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'minItems',
			title: 'Mindestanzahl Einträge',
			type: 'number',
			validation: (Rule) => Rule.integer().min(0),
		}),
		defineField({
			name: 'maxItems',
			title: 'Höchstanzahl Einträge',
			type: 'number',
			validation: (Rule) => [
				Rule.custom((value, context) => {
					const minItems = readParentValue(context, 'minItems');
					return typeof value === 'number' && typeof minItems === 'number' && value < minItems
						? 'Das Maximum darf nicht kleiner als das Minimum sein'
						: true;
				}),
			],
		}),
		defineField({
			name: 'fields',
			of: GROUP_FIELD_TYPES.map((type) => defineArrayMember({ type })),
			title: 'Felder',
			type: 'array',
			validation: (Rule) => Rule.required().min(1),
		}),
	],
	icon: RiGroupLine,
	name: 'formFieldGroup',
	preview: {
		prepare: prepareFieldPreview('Wiederholbare Gruppe'),
		select: { isRequired: 'isRequired', label: 'label' },
	},
	title: 'Wiederholbare Gruppe',
	type: 'object',
});

export default formFieldGroup;
