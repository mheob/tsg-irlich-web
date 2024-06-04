import { RiChatQuoteLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { firstNameField, lastNameField, portraitPictureField } from '../../shared/personal-fields';
import { personal } from '../../shared/roles';

const testimonial = defineType({
	title: 'Referenz',
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
				rule.required().min(5).error('Die Rolle muss mindestens 5 Zeichen lang sein.'),
				rule.max(64).warning('Die Rolle sollte maximal 64 Zeichen lang sein.'),
			],
		},

		// quote
		defineField({
			title: 'Zitat',
			name: 'quote',
			type: 'string',
			description: 'Das Zitat über die TSG.',
			group: 'quote',
			validation: rule => [
				rule.required().min(64).error('Das muss mindestens 64 Zeichen lang sein.'),
				rule.max(256).warning('Das sollte maximal 256 Zeichen lang sein.'),
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
