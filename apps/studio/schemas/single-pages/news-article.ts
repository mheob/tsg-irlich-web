import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { contactPersonsField } from '@/shared/content-fields';
import { content, general } from '@/shared/field-groups';
import { defaultPageFields } from '@/shared/general-fields';

const newsArticlePage = defineType({
	title: 'Einzelner News-Artikel',
	name: 'news.article.page',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, content],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page os rather the layout

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
