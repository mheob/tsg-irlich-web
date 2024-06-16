import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { contactPersonsField } from '@/shared/content-fields';
import { content, general, meta } from '@/shared/field-groups';
import { getHiddenSlugField, introField, subTitleField, titleField } from '@/shared/general-fields';
import { metaField } from '@/shared/meta-fields';

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
		titleField,
		subTitleField,
		introField,

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
