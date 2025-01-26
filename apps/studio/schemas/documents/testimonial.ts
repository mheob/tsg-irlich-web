import { RiChatQuoteLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

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
			validation: Rule => [
				Rule.required().min(3).error('Die Rolle muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Die Rolle sollte nicht länger als 64 Zeichen sein'),
			],
		},

		// quote
		defineField({
			title: 'Zitat',
			name: 'quote',
			type: 'text',
			description: 'Das Zitat über die TSG.',
			group: 'quote',
			validation: Rule => [
				Rule.required().min(64).error('Das Zitat muss mindestens 64 Zeichen lang sein'),
				Rule.max(350).warning('Das Zitat sollte nicht länger als 350 Zeichen sein'),
			],
		}),
		defineField({
			title: 'Zitat anzeigen',
			name: 'show',
			type: 'boolean',
			description: 'Das Zitat soll aktuell angezeigt werden.',
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
