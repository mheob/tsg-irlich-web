// oxlint-disable no-magic-numbers

import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const honoraryMember = defineType({
	fields: [
		// Personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		defineField({
			group: 'personal',
			name: 'memberSince',
			title: 'Mitglied seit',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(2).error('Der Eintrag muss mindestens 2 Zeichen lang sein'),
				Rule.max(10).warning('Der Eintrag sollte nicht länger als 10 Zeichen sein'),
			],
		}),
	],
	groups: [personal, contact, additionalInformation],
	icon: RiUserSmileLine,
	name: 'honoraryMember',
	preview: {
		prepare: ({ media, firstName, lastName }) => ({ media, title: `${lastName}, ${firstName}` }),
		select: {
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
		},
	},
	title: 'Ehrenmitglieder',

	type: 'document',
});

export default honoraryMember;
