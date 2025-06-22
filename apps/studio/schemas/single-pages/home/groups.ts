import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';
import { getFieldWithoutGroup } from '@/utils/fields';

export const groupsField = defineField({
	title: 'Gruppen',
	name: 'groupsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'groups',
	fields: [getFieldWithoutGroup(titleField), getFieldWithoutGroup(subTitleField)],
	validation: Rule => [Rule.required().error('Gruppen sind erforderlich')],
});
