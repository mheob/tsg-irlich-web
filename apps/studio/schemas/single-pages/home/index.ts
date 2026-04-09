import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageSectionFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { statsField } from '@/shared/sections/stats';
import { visionField } from '@/shared/sections/vision';

import {
	contactPersons,
	features,
	groups,
	news,
	pricing,
	stats,
	testimonial,
	vision,
} from './_groups';
import { featuresField } from './features';
import { groupsField } from './groups';
import { newsField } from './news';
import { pricingField } from './pricing';
import { testimonialField } from './testimonial';

const homePage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('home'),

		// General
		...defaultPageSectionFields,

		// Meta
		metaField,

		// Content
		defineField({
			fields: [
				featuresField,
				visionField,
				groupsField,
				statsField,
				pricingField,
				testimonialField,
				contactPersonsSectionField,
				newsField,
			],
			group: 'content',
			groups: [features, vision, groups, stats, pricing, testimonial, contactPersons, news],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiBookletLine,
	name: 'home',
	preview: {
		prepare: () => ({ title: 'Home' }),
	},
	title: 'Home',
	type: 'document',
});

export default homePage;
