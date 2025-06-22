import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageSectionFieldsWithGroup } from '@/shared/fields/general';

export const newsField = defineField({
	title: 'News',
	name: 'newsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'news',
	fields: [...getDefaultPageSectionFieldsWithGroup()],
	validation: Rule => [Rule.required().error('News sind erforderlich')],
});
