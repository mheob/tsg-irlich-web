// oxlint-disable no-magic-numbers

import { RiParentLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { emailField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const author = defineType({
	fields: [
		// Personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		// Contact
		emailField,

		// AdditionalInformation
		defineField({
			description: 'Der Jobtitel bzw. Rolle oder Funktion des Autors.',
			group: 'additionalInformation',
			name: 'jobTitle',
			title: 'Jobtitel',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				Rule.max(64).warning('Der Jobtitel sollte maximal 64 Zeichen lang sein.'),
			],
		}),
	],
	groups: [personal, contact, additionalInformation],
	icon: RiParentLine,
	name: 'author',
	preview: {
		prepare: ({ firstName, lastName, media }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
		},
	},
	title: 'Autor',
	type: 'document',
});

export default author;
