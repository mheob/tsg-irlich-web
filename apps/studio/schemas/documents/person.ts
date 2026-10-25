// oxlint-disable no-magic-numbers max-nested-calls

import { RiUserSmileLine } from 'react-icons/ri';
import type { PreviewValue, Reference, ValidationContext } from 'sanity';
import { defineField, defineType } from 'sanity';

import TextInput from '@/components/text-input';
import { additionalInformation, contact, personal } from '@/shared/field-groups';
import { contactAsField, phoneField } from '@/shared/fields/contact';
import { firstNameField, lastNameField, portraitPictureField } from '@/shared/fields/personal';

const PERSON_API_VERSION = '2026-10-01';

/**
 * Reads the department an affiliation points to.
 *
 * @param affiliation - The affiliation object, or whatever the form hands over while it is empty.
 * @returns The id of the department document, or `undefined` when none is chosen.
 */
function getDepartmentId(affiliation: unknown): string | undefined {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion
	return (affiliation as { department?: Reference } | undefined)?.department?._ref;
}

/**
 * Limits the groups an affiliation offers to those of its department.
 *
 * @param context - The reference filter context, whose `parent` is the affiliation.
 * @param context.parent - The affiliation the group is chosen in.
 * @returns The filter for the group picker; empty without a department, so every group is offered.
 */
function getTeamFilter({ parent }: { parent?: unknown }): {
	filter?: string;
	params?: Record<string, string>;
} {
	const departmentId = getDepartmentId(parent);

	return departmentId
		? { filter: 'department._ref == $departmentId', params: { departmentId } }
		: {};
}

/**
 * Warns when the chosen group belongs to another department than the affiliation. The group picker
 * is filtered, but a group chosen earlier stays when the editor then picks another department.
 *
 * @param team - The reference to the chosen group.
 * @param context - The validation context, whose `parent` is the affiliation.
 * @returns `true`, or the warning shown to the editor.
 */
async function validateTeamMatchesDepartment(
	team: Reference | undefined,
	context: ValidationContext,
): Promise<true | string> {
	const departmentId = getDepartmentId(context.parent);
	if (!team?._ref || !departmentId) {
		// Without a group or a department there is nothing to compare.
		return true;
	}

	const teamDepartmentId = await context
		.getClient({ apiVersion: PERSON_API_VERSION })
		.fetch<string | null>('*[_id == $id][0].department._ref', { id: team._ref });

	return teamDepartmentId === departmentId
		? true
		: 'Die Gruppe gehört nicht zur gewählten Abteilung.';
}

/**
 * Builds the list preview of an affiliation from the parts it has. An affiliation may have only a
 * role (a board member) or, while it is being filled in, only a team or nothing at all.
 *
 * @param selection - The selected titles of the group and the role.
 * @param selection.role - The title of the role.
 * @param selection.team - The title of the group.
 * @returns The title naming the group and the role that exist.
 */
function prepareAffiliationPreview({ role, team }: { role?: string; team?: string }): {
	title: string;
} {
	const parts = [team && `Gruppe: ${team}`, role && `Rolle: ${role}`].filter(Boolean);

	return { title: parts.length > 0 ? parts.join(' - ') : 'Zugehörigkeit ohne Gruppe und Rolle' };
}

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
							description: 'Optional. Die Abteilung der Person.',
							name: 'department',
							title: 'Abteilung',
							to: [{ type: 'department' }],
							type: 'reference',
						}),

						defineField({
							description:
								'Optional. Die Gruppe oder das Team der Person. Zur Auswahl stehen die Gruppen der gewählten Abteilung.',
							name: 'team',
							options: { filter: getTeamFilter },
							title: 'Gruppe / Team',
							to: [{ type: 'group' }],
							type: 'reference',
							validation: (Rule) => Rule.custom(validateTeamMatchesDepartment).warning(),
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
						prepare: prepareAffiliationPreview,
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
		prepare: ({
			firstName,
			lastName,
			media,
			team1,
			team2,
			team3,
			team4,
			team5,
		}: {
			firstName?: string;
			lastName?: string;
			media?: PreviewValue['media'];
			team1?: string;
			team2?: string;
			team3?: string;
			team4?: string;
			team5?: string;
		}) => {
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

export { getTeamFilter, validateTeamMatchesDepartment };
export default person;
