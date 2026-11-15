// oxlint-disable no-magic-numbers

import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const visionField = defineField({
	fields: [
		...getDefaultPageSectionFieldsWithGroup(),

		// The field keeps its name from the time the button opened the long vision in a dialog. The
		// long vision itself moved to the values page (WEB-150), so renaming it would only cost a
		// migration and a release in lockstep.
		defineField({
			description: 'Text des Buttons, der zur Seite „Unsere Werte“ (/verein/werte) führt.',
			name: 'ctaLongVision',
			title: 'Button-Text',
			type: 'string',
			validation: (Rule) => [
				Rule.required().min(5).error('Der Button-Text muss mindestens 5 Zeichen lang sein'),
				Rule.max(25).warning('Der Button-Text sollte nicht länger als 25 Zeichen sein'),
			],
		}),
	],
	group: 'vision',
	icon: RiLinksLine,
	name: 'visionSection',
	title: 'Vision',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Vision ist erforderlich')],
});
