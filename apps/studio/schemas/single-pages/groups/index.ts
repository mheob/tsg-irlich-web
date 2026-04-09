// oxlint-disable no-magic-numbers

import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields } from '@/shared/fields/general';
import { statsField } from '@/shared/sections/stats';

import { contactPersons, groups, stats } from './_groups';
import { contactPersonsField } from './contact-persons';
import { groupsField } from './groups';

const groupsPage = defineType({
	fields: [
		// General
		...defaultHeroFields,

		// Meta
		defineField({
			group: 'meta',
			name: 'metaDescription',
			title: 'Meta-Beschreibung (überschreibt die Standardbeschreibung)',
			type: 'text',
			validation: (Rule) =>
				Rule.min(130)
					.max(160)
					.warning('Die Beschreibung sollte idealerweise von 130 bis 160 Zeichen lang sein.'),
		}),

		// Content
		defineField({
			fields: [groupsField, statsField, contactPersonsField],
			group: 'content',
			groups: [groups, stats, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => Rule.required(),
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'groupsPage',
	preview: {
		prepare: () => ({ title: 'Gruppen' }),
	},
	title: 'Gruppen',
	type: 'document',
});

export default groupsPage;
