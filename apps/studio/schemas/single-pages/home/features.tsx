import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const featuresField = defineField({
	title: 'Merkmale',
	name: 'featureSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'features',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Merkmale',
			name: 'features',
			type: 'array',
			// TODO: add icon name (string) from https://... (see: /apps/studio/schemas/documents/group.tsx:63)
			of: [
				defineField({
					title: 'Merkmal',
					name: 'feature',
					type: 'object',
					fields: [
						defineField({
							title: 'Title',
							name: 'title',
							type: 'string',
							description: 'Der Titel des Merkmals.',
							validation: Rule => [
								Rule.required().min(10).error('Der Titel muss mindestens 10 Zeichen lang sein'),
								Rule.max(65).warning('Der Titel sollte nicht länger als 65 Zeichen sein'),
							],
						}),

						defineField({
							title: 'Intro',
							name: 'intro',
							type: 'string',
							description: 'Die Beschreibung des Merkmals.',
							validation: Rule => [
								Rule.required().min(10).error('Das Intro muss mindestens 10 Zeichen lang sein'),
								Rule.max(120).warning('Das Intro sollte nicht länger als 120 Zeichen sein'),
							],
						}),

						defineField({
							title: 'Icon',
							name: 'icon',
							type: 'string',
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
							validation: Rule => [Rule.required().error('Das Icon ist erforderlich')],
						}),
					],
				}),
			],
			description: "Merkmale (USP's), die auf der Homepage angezeigt werden.",
			validation: Rule => [
				Rule.custom(features => {
					return features?.length === 4 || features?.length === 6
						? true
						: 'Es müssen genau 4 oder 6 Merkmale gewählt werden';
				}),
			],
		}),
	],
	validation: Rule => [Rule.required().error('Merkmale sind erforderlich')],
});
