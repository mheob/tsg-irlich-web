import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const departmentsField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'departments',
	icon: RiLinksLine,
	name: 'departmentsSection',
	title: 'Sportangebote',
	type: 'object',
	validation: (Rule) => Rule.required(),
});
