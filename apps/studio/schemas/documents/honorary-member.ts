import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const honoraryMember = defineType({
	title: 'Ehrenmitglieder',
	name: 'honoraryMember',
	type: 'document',
	icon: RiUserSmileLine,
	groups: [personal, contact, additionalInformation],
	fields: [
		// personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		defineField({
			title: 'Mitglied seit',
			name: 'memberSince',
			type: 'string',
			group: 'personal',
			validation: Rule => [
				Rule.required().min(2).error('Der Nachname muss mindestens 2 Zeichen lang sein'),
				Rule.max(10).warning('Der Nachname sollte nicht länger als 10 Zeichen sein'),
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

export default honoraryMember;
