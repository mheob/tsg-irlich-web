import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const departmentsField = defineField({
	title: 'Sportangebote',
	name: 'departmentsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'departments',
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	validation: (Rule) => Rule.required(),
});
