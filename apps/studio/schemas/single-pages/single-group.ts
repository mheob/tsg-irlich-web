import { RiBookletLine } from 'react-icons/ri';
import { defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const singleGroupPage = defineType({
	title: 'Einzel-Gruppe',
	name: 'singleGroupPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta],
	fields: [
		// ?: the "slug" and `meta` comes from the news article itself; this page is rather the layout

		// general
		...defaultHeroFields,

		// meta
		metaField,
	],
	preview: {
		prepare: () => ({ title: 'Einzel-Gruppe' }),
	},
});

export default singleGroupPage;
