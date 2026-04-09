import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { removeGroupFromField, titleField } from '@/shared/fields/general';

export const trainingsField = defineField({
	fields: [removeGroupFromField(titleField)],
	group: 'trainings',
	icon: RiLinksLine,
	name: 'trainingSection',
	title: 'Trainingszeiten und -orte',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Trainingszeiten und -orte sind erforderlich')],
});
