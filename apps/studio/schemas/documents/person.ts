import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { emailField, phoneField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';
import { getMaxLengthRule, getMinLengthRule, getRequiredRole } from '@/shared/validation-rules';

const person = defineType({
	title: 'Ansprechpartner',
	name: 'person',
	type: 'document',
	icon: RiUserSmileLine,
	groups: [personal, contact, additionalInformation],
	fields: [
		// personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		// contact
		emailField,
		phoneField,

		// additionalInformation
		defineField({
			title: 'Abteilung, Gruppe etc.',
			name: 'department',
			type: 'string',
			description: 'Die Gruppe oder Abteilung der Person.',
			group: 'additionalInformation',
			validation: rule => [
				getMinLengthRule(rule, 2, 'Die Gruppe oder Abteilung'),
				getMaxLengthRule(rule, 64, 'Die Gruppe oder Abteilung'),
			],
		}),
		defineField({
			title: 'Rolle',
			name: 'role',
			type: 'reference',
			to: [{ type: 'group' }],
			description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
			group: 'additionalInformation',
			validation: rule => [getRequiredRole(rule, 'Rolle oder Funktion')],
		}),
		defineField({
			title: 'Beschreibung (Vision)',
			name: 'description',
			type: 'text',
			description: 'Eine kurze Beschreibung der Person.',
			group: 'additionalInformation',
			validation: rule => [
				getMinLengthRule(rule, 32, 'Die Beschreibung (Vision)'),
				getMaxLengthRule(rule, 200, 'Die Beschreibung (Vision)'),
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

export default person;
