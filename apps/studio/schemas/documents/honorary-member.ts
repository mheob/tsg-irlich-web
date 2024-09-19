import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';
import { maxLengthRule } from '@/shared/validation-rules';

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
			validation: rule => [
				// minLengthRule(rule, 2, 'Der Nachname'),
				maxLengthRule(rule, 10, 'Mitglied seit'),
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
