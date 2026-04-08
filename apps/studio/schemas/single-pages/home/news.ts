import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const newsField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	group: 'news',
	icon: RiLinksLine,
	name: 'newsSection',
	title: 'News',
	type: 'object',
	validation: (Rule) => [Rule.required().error('News sind erforderlich')],
});
