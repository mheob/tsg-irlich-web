import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const visionField = defineField({
	title: 'Vision',
	name: 'visionSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'vision',
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		defineField({
			title: 'Button Text zum Öffnen der Lange Vision',
			name: 'ctaLongVision',
			type: 'string',
			description:
				'Text, der auf dem Call to Action Button angezeigt wird, um die Lange Vision zu öffnen.',
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
			title: 'Titel der Lange Vision',
			name: 'longVisionTitle',
			type: 'string',
			validation: (Rule) => [Rule.required().error('Der Titel der Lange Vision ist erforderlich')],
		}),

		defineField({
			title: 'Lange Vision',
			name: 'longVision',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Lange Vision ist erforderlich')],
		}),
	],
	validation: (Rule) => [Rule.required().error('Vision ist erforderlich')],
});
