import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { content, general } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/content';
import { defaultPageFields } from '@/shared/fields/general';

const newsArticlePage = defineType({
	title: 'Einzelner News-Artikel',
	name: 'news.article.page',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, content],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultPageFields,

		// content
		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Einzelner News-Artikel' }),
	},
});

export default newsArticlePage;
