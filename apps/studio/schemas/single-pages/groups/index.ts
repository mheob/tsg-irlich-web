// cSpell:words angebot
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';

import { contactPersons, groups, stats, venues } from './_groups';
import { groupsField } from './groups';
import { venuesField } from './venues';

const groupsPage = defineType({
	title: 'Gruppen',
	name: 'groupsPage',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('angebot'),

		// general
		...defaultPageFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [groups, stats, venues, contactPersons],
			fields: [groupsField, statsField, venuesField, contactPersonsSectionField],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Gruppen' }),
	},
});

export default groupsPage;
