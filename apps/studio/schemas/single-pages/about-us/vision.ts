// oxlint-disable no-magic-numbers

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const visionField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			description:
				'Text, der auf dem Call to Action Button angezeigt wird, um die Lange Vision zu öffnen.',
			name: 'ctaLongVision',
			title: 'Button Text zum Öffnen der Lange Vision',
			type: 'string',
			validation: (Rule) => [
				Rule.required()
					.min(5)
					.error(
						'Der "Button Text zum Öffnen der Lange Vision" muss mindestens 5 Zeichen lang sein',
					),
				Rule.max(25).warning(
					'Der "Button Text zum Öffnen der Lange Vision" sollte nicht länger als 25 Zeichen sein',
				),
			],
		}),

		defineField({
			name: 'longVisionTitle',
			title: 'Titel der Lange Vision',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der Titel der Lange Vision ist erforderlich')],
		}),

		defineField({
			name: 'longVision',
			title: 'Lange Vision',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Lange Vision ist erforderlich')],
		}),
	],
	group: 'vision',
	icon: RiLinksLine,
	name: 'visionSection',
	title: 'Vision',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Vision ist erforderlich')],
});
