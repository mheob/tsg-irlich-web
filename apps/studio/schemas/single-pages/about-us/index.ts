// cSpell:words verein
import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';
import { visionField } from '@/shared/sections/vision';
import { requiredRule } from '@/shared/validation-rules';

import { chronicle, contactPersons, gallery, stats, vision } from './_groups';
import { chronicleField } from './chronicle';
import { galleryField } from './gallery';

const aboutUsPage = defineType({
	title: 'Über uns',
	name: 'aboutUs',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('verein'),

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
			groups: [gallery, chronicle, vision, stats, contactPersons],
			fields: [galleryField, chronicleField, visionField, statsField, contactPersonsSectionField],
			validation: rule => [requiredRule(rule, 'Inhalte')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Über uns' }),
	},
});

export default aboutUsPage;
