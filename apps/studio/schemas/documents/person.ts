import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import TextInput from '@/components/text-input';
import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { phoneField } from '@/shared/fields/contact';
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
							validation: Rule => [
								Rule.required().error('Die Gruppe oder Abteilung ist erforderlich'),
							],
						}),

						defineField({
							title: 'Rolle',
							name: 'role',
							type: 'reference',
							to: [{ type: 'role' }],
							description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
							validation: Rule => [
								Rule.required().error('Die Rolle oder Funktion ist erforderlich'),
							],
						}),

						defineField({
							title: 'Aufgabenbeschreibung',
							name: 'taskDescription',
							type: 'text',
							description:
								'Kurze Aufgabenbeschreibung zum Posten der Person (ca. 270 bis 330 Zeichen).',
							components: { input: TextInput },
							validation: Rule => [
								Rule.required()
									.min(128)
									.error('Die Aufgabenbeschreibung muss mindestens 128 Zeichen lang sein.'),
								Rule.max(330).warning(
									'Die Aufgabenbeschreibung sollte maximal 330 Zeichen lang sein.',
								),
							],
						}),

						defineField({
							title: 'Beschreibung (Vision)',
							name: 'description',
							type: 'text',
							description: 'Kurze Beschreibung als Vision der Person (ca. 270 bis 330 Zeichen).',
							components: { input: TextInput },
							validation: Rule => [
								Rule.required()
									.min(128)
									.error('Die Beschreibung (Vision) muss mindestens 128 Zeichen lang sein.'),
								Rule.max(330).warning(
									'Die Beschreibung (Vision) sollte maximal 330 Zeichen lang sein.',
								),
							],
						}),
					],
					preview: {
						prepare: ({ department, role }) => ({
							title: `Gruppe: ${department} - Rolle: ${role}`,
						}),
						select: {
							department: 'department.title',
							role: 'role.title',
						},
					},
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
