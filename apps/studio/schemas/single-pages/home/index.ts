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
	title: 'Home',
	name: 'home',
	type: 'document',
	icon: RiBookletLine,
	groups: [general, meta, content],
	fields: [
		// (hidden)
		getHiddenSlugField('home'),

		// general
		...defaultPageSectionFields,

		// meta
		metaField,

		// content
		defineField({
			title: 'Inhalte',
			name: 'content',
			type: 'object',
			icon: RiLinksLine,
			group: 'content',
			groups: [features, vision, groups, stats, pricing, testimonial, contactPersons, news],
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
			validation: Rule => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	preview: {
		prepare: () => ({ title: 'Home' }),
	},
});

export default homePage;
