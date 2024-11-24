import { RiChatQuoteLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';
import { maxLengthRule, minLengthRule } from '@/shared/validation-rules';

const testimonial = defineType({
	title: 'Zeugnis / Referenz',
	name: 'testimonial',
	type: 'document',
	icon: RiChatQuoteLine,
	groups: [personal, { name: 'quote', title: 'Zitat' }],
	fields: [
		// personal
		firstNameField,
		lastNameField,
		portraitPictureField,
		{
			title: 'Rolle',
			name: 'role',
			type: 'string',
			description: 'Die Rolle oder Funktion des Zitierenden.',
			group: 'personal',
			validation: rule => [
				minLengthRule(rule, 5, 'Die Rolle'),
				maxLengthRule(rule, 64, 'Die Rolle'),
			],
		},

		// quote
		defineField({
			title: 'Zitat',
			name: 'quote',
			type: 'text',
			description: 'Das Zitat über die TSG.',
			group: 'quote',
			validation: rule => [
				minLengthRule(rule, 64, 'Das Zitat'),
				maxLengthRule(rule, 256, 'Das Zitat'),
			],
		}),
		defineField({
			title: 'Zitat immer anzeigen',
			name: 'showAlways',
			type: 'boolean',
			description: 'Das Zitat soll immer angezeigt werden.',
			group: 'quote',
			initialValue: false,
		}),
	],
	preview: {
		prepare: ({ media, firstName, lastName, role }) => ({
			media,
			title: `${lastName}, ${firstName} - ${role}`,
		}),
		select: {
			media: 'image.asset',
			firstName: 'firstName',
			lastName: 'lastName',
			role: 'role',
		},
	},
});

export default testimonial;
