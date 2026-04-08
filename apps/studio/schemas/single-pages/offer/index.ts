import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';

import { contactPersons, departments, stats } from './_groups';
import { departmentsField } from './departments';

const offerPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('angebot'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			fields: [departmentsField, statsField, contactPersonsSectionField],
			group: 'content',
			groups: [departments, stats, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => Rule.required(),
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'departmentsPage',
	preview: {
		prepare: () => ({ title: 'Sportangebot' }),
	},
	title: 'Sportbereiche',
	type: 'document',
});

export default offerPage;
