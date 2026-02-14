import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const groupsField = defineField({
	title: 'Gruppen',
	name: 'groupsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'groups',
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	validation: (Rule) => Rule.required(),
});
