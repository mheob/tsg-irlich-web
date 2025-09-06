import { RiUserSmileLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import TextInput from '@/components/text-input';
import { DEPARTMENTS } from '@/constants/departments';
import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { contactAsField, phoneField } from '@/shared/fields/contact';
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
		contactAsField,

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
							title: 'Abteilung / Bereich',
							name: 'department',
							type: 'string',
							description: 'Die Abteilung bzw. der Bereich der Person.',

							options: {
								layout: 'dropdown',
								list: DEPARTMENTS.map(department => ({
									title: department.title,
									value: department.slug,
								})),
							},
							validation: Rule => [
								Rule.required().error('Die Gruppe oder Abteilung ist erforderlich'),
							],
						}),

						defineField({
							title: 'Gruppe / Team',
							name: 'team',
							type: 'reference',
							to: [
								{ type: 'group.admin' },
								{ type: 'group.children-gymnastics' },
								{ type: 'group.courses' },
								{ type: 'group.dance' },
								{ type: 'group.other-sports' },
								{ type: 'group.soccer' },
								{ type: 'group.taekwondo' },
							],
							description: 'Die Gruppe oder das Team der Person.',

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
							validation: Rule => [
								Rule.required().error('Die Gruppe oder das Team ist erforderlich'),
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
					],
					preview: {
						prepare: ({ team, role }) => ({
							title: `Gruppe: ${team} - Rolle: ${role}`,
						}),
						select: {
							team: 'team.title',
							role: 'role.title',
						},
					},
				}),
			],
			group: 'additionalInformation',
		}),
	],

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
			team1: 'affiliations.0.team.title',
			team2: 'affiliations.1.team.title',
			team3: 'affiliations.2.team.title',
			team4: 'affiliations.3.team.title',
			team5: 'affiliations.4.team.title',
			firstName: 'firstName',
			lastName: 'lastName',
			media: 'image.asset',
		},
	},
});

export default person;
