import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';

const newsArticlePage = defineType({
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// General
		...defaultHeroFields,
	],
	groups: [general],
	icon: RiBookletLine,
	name: 'news-article-page',
	preview: {
		prepare: () => ({ title: 'Einzelner News-Artikel' }),
	},
	title: 'Einzelner News-Artikel',
	type: 'document',
});

export default newsArticlePage;
