// oxlint-disable no-magic-numbers

import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import TextInput from '@/components/text-input';
import { DEPARTMENTS } from '@/constants/departments';
import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { contactAsField, phoneField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const person = defineType({
	fields: [
		// Personal
		firstNameField,
		lastNameField,
		portraitPictureField,

		// Contact
		phoneField,
		contactAsField,

		// AdditionalInformation
		defineField({
			group: 'additionalInformation',
			name: 'affiliations',
			of: [
				defineField({
					fields: [
						defineField({
							description: 'Die Abteilung bzw. der Bereich der Person.',
							name: 'department',
							options: {
								layout: 'dropdown',
								list: DEPARTMENTS.map((department) => ({
									title: department.title,
									value: department.slug,
								})),
							},
							title: 'Abteilung / Bereich',

							type: 'string',
							validation: (Rule) => [
								Rule.required().error('Die Gruppe oder Abteilung ist erforderlich'),
							],
						}),

						defineField({
							description: 'Die Gruppe oder das Team der Person.',
							name: 'team',
							options: {
								filter: ({ parent }) => {
									const type = (parent as { department?: string })?.department;

									switch (type) {
										case 'admin': {
											return { filter: '_type == $type', params: { type: 'group.admin' } };
										}
										case 'children-gymnastics': {
											return {
												filter: '_type == $type',
												params: { type: 'group.children-gymnastics' },
											};
										}
										case 'courses': {
											return { filter: '_type == $type', params: { type: 'group.courses' } };
										}
										case 'dance': {
											return { filter: '_type == $type', params: { type: 'group.dance' } };
										}
										case 'other-sports': {
											return { filter: '_type == $type', params: { type: 'group.other-sports' } };
										}
										case 'soccer': {
											return { filter: '_type == $type', params: { type: 'group.soccer' } };
										}
										case 'taekwondo': {
											return { filter: '_type == $type', params: { type: 'group.taekwondo' } };
										}
										default: {
											return {};
										}
									}
								},
							},
							title: 'Gruppe / Team',
							to: [
								{ type: 'group.admin' },
								{ type: 'group.children-gymnastics' },
								{ type: 'group.courses' },
								{ type: 'group.dance' },
								{ type: 'group.other-sports' },
								{ type: 'group.soccer' },
								{ type: 'group.taekwondo' },
							],

							type: 'reference',
							validation: (Rule) => [
								Rule.required().error('Die Gruppe oder das Team ist erforderlich'),
							],
						}),

						defineField({
							description: 'Die Rolle oder Funktion der Person (z.B. Vorstand Finanzen).',
							name: 'role',
							title: 'Rolle',
							to: [{ type: 'role' }],
							type: 'reference',
							validation: (Rule) => [
								Rule.required().error('Die Rolle oder Funktion ist erforderlich'),
							],
						}),

						defineField({
							components: { input: TextInput },
							description:
								'Kurze Aufgabenbeschreibung zum Posten der Person (ca. 270 bis 330 Zeichen).',
							name: 'taskDescription',
							title: 'Aufgabenbeschreibung',
							type: 'text',
							validation: (Rule) => [
								Rule.required()
									.min(128)
									.error('Die Aufgabenbeschreibung muss mindestens 128 Zeichen lang sein.'),
								Rule.max(330).warning(
									'Die Aufgabenbeschreibung sollte maximal 330 Zeichen lang sein.',
								),
							],
						}),

						defineField({
							description:
								'Die optionale Sortierreihenfolge kann für die Ansprechpartner-Sortierung notwendig sein. Im Zweifel einfach leer lassen.',
							name: 'sortOrder',
							title: 'Sortierreihenfolge',
							type: 'number',
						}),
					],
					name: 'affiliation',
					preview: {
						prepare: ({ team, role }) => ({
							title: `Gruppe: ${team} - Rolle: ${role}`,
						}),
						select: {
							role: 'role.title',
							team: 'team.title',
						},
					},
					title: 'Zugehörigkeit',
					type: 'object',
				}),
			],
			title: 'Zugehörigkeiten',
			type: 'array',
		}),
	],
	groups: [personal, contact, additionalInformation],
	icon: RiUserSmileLine,
	name: 'person',
	preview: {
		prepare: ({ firstName, lastName, media, team1, team2, team3, team4, team5 }) => {
			const teamNames = [team1, team2, team3, team4, team5].filter(Boolean);
			const subtitle = teamNames.length > 0 ? teamNames.join(', ') : '';

			return {
				media,
				subtitle,
				title: `${lastName}, ${firstName}`,
			};
		},
		select: {
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
			team1: 'affiliations.0.team.title',
			team2: 'affiliations.1.team.title',
			team3: 'affiliations.2.team.title',
			team4: 'affiliations.3.team.title',
			team5: 'affiliations.4.team.title',
		},
	},
	title: 'Ansprechpartner',

	type: 'document',
});

export default person;
