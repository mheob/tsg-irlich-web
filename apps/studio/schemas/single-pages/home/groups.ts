import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { subTitleField, titleField } from '@/shared/general-fields';

const groupsField = defineField({
	title: 'Gruppen',
	name: 'groupsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'groups',
	fields: [
		defineField({ ...titleField, group: undefined }),
		defineField({ ...subTitleField, group: undefined }),
	],
});

export default groupsField;
