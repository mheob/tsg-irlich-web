import { defineField, defineType } from '@sanity-typed/types';
import { RiUserSmileLine } from 'react-icons/ri';

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
			type: 'date',
			group: 'personal',
			validation: Rule => Rule.required().error('Mitglied seit ist erforderlich.'),
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
