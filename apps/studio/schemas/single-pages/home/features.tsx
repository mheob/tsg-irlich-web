import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';
import { maxLengthRule, minLengthRule, requiredRule } from '@/shared/validation-rules';

export const featuresField = defineField({
	title: 'Merkmale',
	name: 'featureSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'features',
	fields: [
		...getDefaultPageFieldsWithGroup(),

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
							validation: rule => [
								minLengthRule(rule, 10, 'Der Titel'),
								maxLengthRule(rule, 65, 'Der Titel'),
							],
						}),

						defineField({
							title: 'Intro',
							name: 'intro',
							type: 'string',
							description: 'Die Beschreibung des Merkmals.',
							validation: rule => [
								minLengthRule(rule, 10, 'Das Intro'),
								maxLengthRule(rule, 120, 'Das Intro'),
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
							validation: rule => [requiredRule(rule, 'Das Icon')],
						}),
					],
				}),
			],
			description: "Merkmale (USP's), die auf der Homepage angezeigt werden.",
			validation: rule => [
				minLengthRule(rule, 4, 'Merkmale', {
					message: 'Es müssen zwischen 4 und 6 Merkmale gewählt werden',
				}),
				maxLengthRule(rule, 6, 'Merkmale', {
					message: 'Es müssen zwischen 4 und 6 Merkmale gewählt werden',
				}),
			],
		}),
	],
	validation: rule => [requiredRule(rule, 'Merkmale')],
});
