import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { statsField } from '@/shared/sections/stats';

import { contactPersons, groups, stats } from './_groups';
import { contactPersonsField } from './contact-persons';
import { groupsField } from './groups';

const groupsPage = defineType({
	title: 'Gruppen',
	name: 'groupsPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
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
			groups: [groups, stats, contactPersons],
			fields: [groupsField, statsField, contactPersonsField],
			validation: Rule => Rule.required(),
		}),
	],
	preview: {
		prepare: () => ({ title: 'Gruppen' }),
	},
});

export default groupsPage;
