import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/fields/general';

export const groupsField = defineField({
	title: 'Gruppen',
	name: 'groupsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'groups',
	fields: [
		defineField({ ...titleField, group: undefined }),
		defineField({ ...subTitleField, group: undefined }),
	],
	validation: Rule => [Rule.required().error('Gruppen sind erforderlich')],
});
