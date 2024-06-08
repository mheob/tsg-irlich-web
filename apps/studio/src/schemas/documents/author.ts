import { RiParentLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { emailField } from '../../shared/contact-fields';
import { firstNameField, lastNameField, portraitPictureField } from '../../shared/personal-fields';
import { additionalInformation, contact, personal } from '../../shared/roles';

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
			description: 'Der Jobtitel bzw. Rolle oder Funktion des Autors.',
			group: 'additionalInformation',
			name: 'jobTitle',
			title: 'Jobtitel',
			type: 'string',
			validation: rule => [
				rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				rule.max(64).warning('Der Jobtitel sollte maximal 64 Zeichen lang sein.'),
			],
		}),
	],
	preview: {
		prepare: ({ media, firstName, lastName }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			media: 'image.asset',
			firstName: 'firstName',
			lastName: 'lastName',
		},
	},
});

export default author;
