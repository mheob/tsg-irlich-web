import { defineField, defineType } from '@sanity-typed/types';
import { RiUserSmileLine } from 'react-icons/ri';

import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { emailField, phoneField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';
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
			title: 'Zugehörigkeiten',
			name: 'affiliations',
			type: 'array',
			of: [
				defineField({
					title: 'Zugehörigkeit',
					name: 'affiliation',
					type: 'object',
					fields: [
						defineField({
							title: 'Abteilung, Gruppe etc.',
							name: 'department',
							type: 'reference',
							to: [{ type: 'group' }],
							description: 'Die Gruppe oder Abteilung der Person.',
							validation: Rule =>
								Rule.required().error('Die Gruppe oder Abteilung ist erforderlich.'),
						}),

						defineField({
							title: 'Rolle',
							name: 'role',
							type: 'reference',
							to: [{ type: 'role' }],
							description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
							validation: Rule => Rule.required().error('Die Rolle ist erforderlich.'),
						}),

						defineField({
							title: 'Aufgabenbeschreibung',
							name: 'taskDescription',
							type: 'text',
							description:
								'Kurze Aufgabenbeschreibung zum Posten der Person (ca. 32 bis 200 Zeichen).',
							validation: Rule => [
								Rule.required()
									.min(32)
									.error('Die Beschreibung muss mindestens 32 Zeichen lang sein.'),
								Rule.max(200).warning('Die Beschreibung sollte maximal 200 Zeichen lang sein.'),
							],
						}),

						defineField({
							title: 'Beschreibung (Vision)',
							name: 'description',
							type: 'text',
							description: 'Kurze Beschreibung als Vision der Person (ca. 32 bis 200 Zeichen).',
							validation: Rule => [
								Rule.required()
									.min(32)
									.error('Die Beschreibung muss mindestens 32 Zeichen lang sein.'),
								Rule.max(200).warning('Die Beschreibung sollte maximal 200 Zeichen lang sein.'),
							],
						}),
					],
				}),
			],
			group: 'additionalInformation',
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
