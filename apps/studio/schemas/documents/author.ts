// oxlint-disable no-magic-numbers

import { RiQuillPenLine } from 'react-icons/ri';
import type { PreviewValue } from 'sanity';
import { defineField, defineType } from 'sanity';

import { emailField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';
import { getFieldWithoutGroup } from '@/utils/fields';

const author = defineType({
	fields: [
		// Personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		// Contact
		getFieldWithoutGroup(emailField),

		// AdditionalInformation
		defineField({
			description: 'Der Jobtitel bzw. Rolle oder Funktion des Autors.',
			name: 'jobTitle',
			title: 'Jobtitel',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(5).error('Der Jobtitel muss mindestens 5 Zeichen lang sein.'),
				Rule.max(64).warning('Der Jobtitel sollte maximal 64 Zeichen lang sein.'),
			],
		}),
	],
	icon: RiQuillPenLine,
	name: 'author',
	preview: {
		prepare: ({
			firstName,
			lastName,
			media,
		}: {
			firstName?: string;
			lastName?: string;
			media?: PreviewValue['media'];
		}) => ({ media, title: `${lastName}, ${firstName}` }),
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
