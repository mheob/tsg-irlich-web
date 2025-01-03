import { RiParentLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { emailField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const author = defineType({
	title: 'Autor',
	name: 'author',
	type: 'document',
	icon: RiParentLine,
	groups: [personal, contact, additionalInformation],
	fields: [
		// personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		// contact
		emailField,

		// additionalInformation
		defineField({
			title: 'Jobtitel',
			name: 'jobTitle',
			type: 'string',
			description: 'Der Jobtitel bzw. Rolle oder Funktion des Autors.',
			group: 'additionalInformation',
			validation: Rule => [
				Rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				Rule.max(64).warning('Der Jobtitel sollte maximal 64 Zeichen lang sein.'),
			],
		}),
	],
	preview: {
		prepare: ({ firstName, lastName, media }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
		},
	},
});

export default author;
