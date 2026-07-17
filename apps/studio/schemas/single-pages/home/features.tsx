// oxlint-disable no-magic-numbers unicorn/max-nested-calls

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const featuresField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			description: "Merkmale (USP's), die auf der Homepage angezeigt werden.",
			name: 'features',
			// oxlint-disable-next-line no-warning-comments
			// TODO: add icon name (string) from https://... (see: /apps/studio/schemas/documents/group.tsx:63)
			of: [
				defineField({
					fields: [
						defineField({
							description: 'Der Titel des Merkmals.',
							name: 'title',
							title: 'Title',
							type: 'string',
							validation: (Rule) => [
								Rule.required().min(10).error('Der Titel muss mindestens 10 Zeichen lang sein'),
								Rule.max(65).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
							],
						}),

						defineField({
							description: 'Die Beschreibung des Merkmals.',
							name: 'intro',
							title: 'Intro',
							type: 'string',
							validation: (Rule) => [
								Rule.required().min(10).error('Das Intro muss mindestens 10 Zeichen lang sein'),
								Rule.max(120).warning('Das Intro sollte nicht länger als 120 Zeichen sein'),
							],
						}),

						defineField({
							description: (
								<>
									Name des Icons aus{' '}
									<a href="https://lucide.dev/icons/" rel="noreferrer noopener" target="_blank">
										lucide.dev/icons
									</a>
									.<br />
									In <kbd>CamelCase</kbd> geschrieben (z.B. <kbd>one-icon</kbd> --&gt;{' '}
									<kbd>OneIcon</kbd>).
								</>
							),
							name: 'icon',
							title: 'Icon',
							type: 'string',
							validation: (Rule) => [Rule.required().error('Das Icon ist erforderlich')],
						}),
					],
					name: 'feature',
					title: 'Merkmal',
					type: 'object',
				}),
			],
			title: 'Merkmale',
			type: 'array',
			validation: (Rule) => [
				Rule.custom((features) =>
					features?.length === 4 || features?.length === 6
						? true
						: 'Es müssen genau 4 oder 6 Merkmale gewählt werden',
				),
			],
		}),
	],
	group: 'features',
	icon: RiLinksLine,
	name: 'featureSection',
	title: 'Merkmale',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Merkmale sind erforderlich')],
});
