import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const groupsField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'groups',
	icon: RiLinksLine,
	name: 'groupsSection',
	title: 'Gruppen',
	type: 'object',
	validation: (Rule) => Rule.required(),
});
