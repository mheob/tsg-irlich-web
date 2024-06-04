import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { emailField, phoneField } from '../../shared/contact-fields';
import { firstNameField, lastNameField, portraitPictureField } from '../../shared/personal-fields';
import { additionalInformation, contact, personal } from '../../shared/roles';

const person = defineType({
	title: 'Person',
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
			description: 'Die Gruppe oder Abteilung der Person.',
			group: 'additionalInformation',
			name: 'department',
			title: 'Abteilung, Gruppe etc.',
			type: 'string',
			validation: rule => [
				rule
					.required()
					.min(2)
					.error('Die Gruppe oder Abteilung muss mindestens 2 Zeichen lang sein.'),
				rule.max(64).warning('Die Gruppe oder Abteilung sollte maximal 64 Zeichen lang sein.'),
			],
		}),
		defineField({
			description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
			group: 'additionalInformation',
			name: 'role',
			title: 'Rolle',
			to: [{ type: 'group' }],
			type: 'reference',
			validation: rule => [rule.required().error('Die Rolle oder Funktion ist erforderlich.')],
		}),
		defineField({
			title: 'Beschreibung (Vision)',
			name: 'description',
			type: 'string',
			description: 'Eine kurze Beschreibung der Person.',
			group: 'additionalInformation',
			validation: rule => [
				rule.required().min(32).error('Die Beschreibung muss mindestens 32 Zeichen lang sein.'),
				rule.max(64).warning('Die Beschreibung sollte maximal 64 Zeichen lang sein.'),
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
