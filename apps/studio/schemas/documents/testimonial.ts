// oxlint-disable no-magic-numbers

import { RiChatQuoteLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineField, defineType } from 'sanity';

import { personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const testimonial = defineType({
	fields: [
		// Personal
		firstNameField,
		lastNameField,
		portraitPictureField,
		{
			description: 'Die Rolle oder Funktion des Zitierenden.',
			group: 'personal',
			name: 'role',
			title: 'Rolle',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(3).error('Die Rolle muss mindestens 3 Zeichen lang sein'),
				Rule.max(64).warning('Die Rolle sollte nicht länger als 64 Zeichen sein'),
			],
		},

		// Quote
		defineField({
			description: 'Das Zitat über die TSG.',
			group: 'quote',
			name: 'quote',
			title: 'Zitat',
			type: 'text',
			validation: (Rule) => [
				Rule.required().min(64).error('Das Zitat muss mindestens 64 Zeichen lang sein'),
				Rule.max(350).warning('Das Zitat sollte nicht länger als 350 Zeichen sein'),
			],
		}),
	],
	groups: [personal, { name: 'quote', title: 'Zitat' }],
	icon: RiChatQuoteLine,
	name: 'testimonial',
	preview: {
		prepare: ({
			media,
			firstName,
			lastName,
			role,
		}: {
			media?: PreviewValue['media'];
			firstName?: string;
			lastName?: string;
			role?: string;
		}) => ({
			media,
			title: `${lastName}, ${firstName} - ${role}`,
		}),
		select: {
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
			role: 'role',
		},
	},
	title: 'Zeugnis / Referenz',
	type: 'document',
});

export default testimonial;
