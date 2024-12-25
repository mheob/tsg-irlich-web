import { defineType } from '@sanity-typed/types';
import { RiBookletLine } from 'react-icons/ri';

import { general } from '@/shared/field-groups';
import { defaultPageFields } from '@/shared/fields/general';

const newsArticlePage = defineType({
	title: 'Einzelner News-Artikel',
	name: 'news-article-page',
	type: 'document',
	icon: RiBookletLine,
	groups: [general],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultPageFields,
	],
	preview: {
		prepare: () => ({ title: 'Einzelner News-Artikel' }),
	},
});

export default newsArticlePage;
