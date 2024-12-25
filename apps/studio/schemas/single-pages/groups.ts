// cSpell:words angebot
import { defineArrayMember, defineField, defineType } from '@sanity-typed/types';
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';

import { content, general, meta } from '@/shared/field-groups';
import {
	defaultPageFields,
	getDefaultPageFieldsWithGroup,
	getHiddenSlugField,
} from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';

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
			title: 'Gruppen',
			name: 'groupsSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'groups',
			fields: [...getDefaultPageFieldsWithGroup()],
		}),

		statsField,

		defineField({
			title: 'Gruppen',
			name: 'venuesSection',
			type: 'object',
			icon: RiLinksLine,
			group: 'venues',
			fields: [
				...getDefaultPageFieldsWithGroup(),

				defineField({
					title: 'Sportstätten',
					name: 'venues',
					type: 'array',
					of: [defineArrayMember({ type: 'reference', to: [{ type: 'venue' }] })],
					description:
						'Diese gewählten Sportstätten werden in der gewünschten Reihenfolge angezeigt.',
				}),
			],
		}),

		contactPersonsSectionField,
	],
	preview: {
		prepare: () => ({ title: 'Gruppen' }),
	},
});

export default groupsPage;
