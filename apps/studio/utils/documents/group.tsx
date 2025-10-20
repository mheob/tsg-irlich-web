import { DOSB_ICONS } from '@tsgi-web/shared';
import type { IconType } from 'react-icons/lib';
import { defineField, defineType } from 'sanity';

import { emailField } from '@/shared/fields/contact';
import { slugField } from '@/shared/fields/general';

import { getFieldWithoutGroup } from '../fields';

interface GroupDocumentProps {
	icon: IconType;
	isSportGroup?: boolean;
	name: string;
	title: string;
}

/**
 * Creates a Sanity document type for a group.
 *
 * @param props - The properties for the group document.
 * @param props.icon - The icon to represent the group.
 * @param [props.isSportGroup] - Whether the group is a sports group (default: true).
 * @param props.name - The name of the document type.
 * @param props.title - The title of the document type.
 * @returns The Sanity document type definition.
 */
export function getGroupDocument({ icon, isSportGroup = true, name, title }: GroupDocumentProps) {
	return defineType({
		title,
		name,
		type: 'document',
		icon,
		fields: [
			defineField({
				name: 'title',
				title: 'Name',
				type: 'string',
				validation: Rule => [
					Rule.required().min(2).error('Name muss mindestens 2 Zeichen lang sein'),
					Rule.max(64).warning('Name sollte nicht länger als 64 Zeichen sein'),
				],
			}),

			getFieldWithoutGroup(slugField),

			getFieldWithoutGroup(emailField),

			defineField({
				description: 'Optional, Fallback: Name. Wird für die Gruppen-Übersicht verwendet.',
				name: 'overviewTitle',
				title: 'Übersichts-Titel',
				type: 'string',
				validation: Rule => [
					Rule.min(2).warning('Übersichts-Titel muss mindestens 2 Zeichen lang sein'),
					Rule.max(64).warning('Übersichts-Titel sollte nicht länger als 64 Zeichen sein'),
				],
			}),

			defineField({
				description: 'Die Sortierreihenfolge wird für die Gruppen-Übersicht verwendet.',
				name: 'sortOrder',
				title: 'Sortierreihenfolge',
				type: 'number',
				validation: Rule => Rule.required().error('Sortierreihenfolge ist erforderlich'),
			}),

			defineField({
				description: 'Eine Beschreibung der Gruppe / Mannschaft.',
				name: 'description',
				title: 'Beschreibung',
				type: 'simpleBlockContent',
				validation: Rule => [Rule.required().error('Beschreibung ist erforderlich')],
			}),

			defineField({
				description: (
					<>
						Wir nutzen die{' '}
						<a
							href="https://www.dosb.de/service/piktogramme/piktogramme-downloads"
							rel="noreferrer noopener"
							target="_blank"
						>
							Sportdeutschland-Piktogramme
						</a>
						.<br />
						Sollte ein Icon in der Liste fehlen, kontaktiere bitte den Webmaster, damit er es
						hinzufügen kann.
					</>
				),
				name: 'icon',
				options: {
					list: DOSB_ICONS.map(icon => ({ title: icon, value: icon })),
				},
				title: 'Icon',
				type: 'string',
				hidden: !isSportGroup,
				validation: Rule => [Rule.required().error('Icon ist erforderlich')],
			}),

			defineField({
				description:
					'Das Hintergrundbild wird z.B. auf der Gruppen-Übersicht angezeigt, wenn man über eine Gruppe hovered.',
				name: 'featuredImage',
				title: 'Hintergrundbild',
				type: 'extendedImage',
				hidden: !isSportGroup,
				validation: Rule => [Rule.required().error('Bild ist erforderlich')],
			}),

			defineField({
				description: 'Es können bis zu drei Bilder ausgewählt werden.',
				name: 'images',
				of: [{ type: 'extendedImage' }],
				title: 'Bildergalerie',
				type: 'array',
				hidden: !isSportGroup,
				validation: Rule => [Rule.max(3).error('Es dürfen maximal drei Bilder ausgewählt werden.')],
			}),

			defineField({
				description: 'Beschreibung zu den Trainingszeiten und -orten.',
				name: 'training',
				title: 'Trainingszeiten und -orte',
				type: 'object',
				fields: [
					defineField({
						name: 'trainingDescription',
						title: 'Beschreibung zu den Trainingszeiten und -orten',
						type: 'simpleBlockContent',
					}),
					defineField({
						name: 'trainingTimes',
						of: [{ type: 'trainingTime' }],
						title: 'Trainingszeiten und -orte',
						type: 'array',
					}),
				],
				hidden: ({ document }) =>
					(document?.title as string)?.toLowerCase() === 'schiedsrichter' || !isSportGroup,
				validation: Rule => [
					Rule.custom((value, context) => {
						if (
							isSportGroup &&
							(context.document?.title as string)?.toLowerCase() !== 'schiedsrichter' &&
							!value
						) {
							return 'Trainingszeiten und -orte sind erforderlich';
						}
						return true;
					}),
				],
			}),

			defineField({
				description: 'Ist diese Gruppe eine Sportgruppe?',
				initialValue: isSportGroup,
				name: 'isSportGroup',
				title: 'Ist Sportgruppe',
				type: 'boolean',
				hidden: true,
				validation: Rule => [Rule.required().error('"Ist Sportgruppe" ist erforderlich')],
			}),
		],

		preview: {
			prepare: ({ sortOrder, title }) => ({
				subtitle: `Sortierreihenfolge: ${sortOrder}`,
				title,
			}),
			select: {
				sortOrder: 'sortOrder',
				title: 'title',
			},
		},

		orderings: [
			{
				by: [{ direction: 'asc', field: 'title' }],
				name: 'titleAsc',
				title: 'nach Name - aufsteigend',
			},
			{
				by: [{ direction: 'desc', field: 'title' }],
				name: 'titleDesc',
				title: 'nach Name - absteigend',
			},
			{
				by: [{ direction: 'asc', field: 'sortOrder' }],
				name: 'sortOrderAsc',
				title: 'nach Sortierreihenfolge - aufsteigend',
			},
			{
				by: [{ direction: 'desc', field: 'sortOrder' }],
				name: 'sortOrderDesc',
				title: 'nach Sortierreihenfolge - absteigend',
			},
		],
		validation: Rule => [Rule.required().error('Gruppe ist erforderlich')],
	});
}
