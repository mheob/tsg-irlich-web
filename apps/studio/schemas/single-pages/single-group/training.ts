import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { removeGroupFromField, titleField } from '@/shared/fields/general';

export const trainingsField = defineField({
	title: 'Trainingszeiten und -orte',
	name: 'trainingSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'trainings',
	fields: [removeGroupFromField(titleField)],
	validation: Rule => [Rule.required().error('Trainingszeiten und -orte sind erforderlich')],
});
