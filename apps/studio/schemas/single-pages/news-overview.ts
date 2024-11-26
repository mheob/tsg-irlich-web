import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { contactPersonsField } from '@/shared/fields/contact';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const newsOverviewPage = defineType({
	title: 'News Übersicht',
	name: 'news.overview',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('news'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		contactPersonsField,
	],
	preview: {
		prepare: () => ({ title: 'News Übersicht' }),
	},
});

export default newsOverviewPage;
