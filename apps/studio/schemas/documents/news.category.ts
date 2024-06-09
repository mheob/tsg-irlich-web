import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general } from '@/shared/field-groups';
import { slugField, titleField } from '@/shared/general-fields';

const newsCategory = defineType({
	title: 'News-Kategorie',
	name: 'news.category',
	type: 'document',
	icon: RiBookletLine,
	groups: [general],
	fields: [
		// general
		titleField,
		slugField,
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default newsCategory;
