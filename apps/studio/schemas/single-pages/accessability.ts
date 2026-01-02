// cSpell:words barrierefreiheit

import { RiWheelchairLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

const accessabilityPage = defineType({
	title: 'Barrierefreiheit',
	name: 'accessability',
	type: 'document',
	icon: RiWheelchairLine,
	groups: [general, meta, { name: 'content', title: 'Barrierefreiheit' }],
	fields: [
		// (hidden)
		getHiddenSlugField('barrierefreiheit'),

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Barrierefreiheit',
			name: 'content',
			type: 'blockContent',
			group: 'content',
			validation: Rule => [Rule.required().error('Barrierefreiheit ist erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Barrierefreiheit' }),
	},
});

export default accessabilityPage;
