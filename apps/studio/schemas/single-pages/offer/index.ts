// cSpell:words angebot
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
	title: 'Sportbereiche',
	name: 'departmentsPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('angebot'),

		// general
		...defaultHeroFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [departments, stats, contactPersons],
			fields: [departmentsField, statsField, contactPersonsSectionField],
			validation: Rule => Rule.required(),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Sportangebot' }),
	},
});

export default offerPage;
