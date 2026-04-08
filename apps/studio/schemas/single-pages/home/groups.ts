import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

export const groupsField = defineField({
	fields: [getFieldWithoutGroup(titleField), getFieldWithoutGroup(subTitleField)],
	group: 'groups',
	icon: RiLinksLine,
	name: 'groupsSection',
	title: 'Gruppen',
	type: 'object',
	validation: (Rule) => [Rule.required().error('Gruppen sind erforderlich')],
});
