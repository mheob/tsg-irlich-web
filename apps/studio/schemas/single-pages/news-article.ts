import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { contactPersonsField } from '@/shared/content-fields';
import { content, general, meta } from '@/shared/field-groups';
import { introField, subTitleField, titleField } from '@/shared/general-fields';
import { metaField } from '@/shared/meta-fields';

const newsArticlePage = defineType({
	title: 'Einzelner News-Artikel',
	name: 'news.article',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// ?: ATTENTION: the "slug" comes from the news article itself; this page os rather the layout

		// general
		titleField,
		subTitleField,
		introField,

		// meta
		metaField,

		// content
		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'Einzelner News-Artikel' }),
	},
});

export default newsArticlePage;
