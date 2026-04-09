import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';

import { chronicle, contactPersons, intro, stats, vision } from './_groups';
import { chronicleField } from './chronicle';
import { introField } from './intro';
import { visionField } from './vision';

const aboutUsPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('verein'),

		// General
		...defaultHeroFields,

		// Meta
		metaField,

		// Content
		defineField({
			fields: [introField, chronicleField, visionField, statsField, contactPersonsSectionField],
			group: 'content',
			groups: [intro, chronicle, vision, stats, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'aboutUs',
	preview: {
		prepare: () => ({ title: 'Über uns' }),
	},
	title: 'Über uns',
	type: 'document',
});

export default aboutUsPage;
