import { RiWheelchairLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const accessibilityPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('barrierefreiheit'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			group: 'content',
			name: 'content',
			title: 'Barrierefreiheit',
			type: 'blockContent',
			validation: (Rule) => [Rule.required().error('Barrierefreiheit ist erforderlich')],
		}),
	],
	groups: [general, meta, { name: 'content', title: 'Barrierefreiheit' }],
	icon: RiWheelchairLine,
	name: 'accessibility',
	preview: {
		prepare: () => ({ title: 'Barrierefreiheit' }),
	},
	title: 'Barrierefreiheit',
	type: 'document',
});

export default accessibilityPage;
