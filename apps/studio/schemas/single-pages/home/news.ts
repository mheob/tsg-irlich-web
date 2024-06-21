import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

import { getDefaultPageFieldsWithGroup } from '@/shared/fields/general';

export const newsField = defineField({
	title: 'News',
	name: 'newsSection',
	type: 'object',
	icon: RiLinksLine,
	group: 'news',
	fields: [...getDefaultPageFieldsWithGroup()],
});
