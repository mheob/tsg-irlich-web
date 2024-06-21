import { RiBookletLine, RiLinksLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultPageFields, getHiddenSlugField } from '@/shared/fields/general';
import { metaField } from '@/shared/fields/meta';

import {
	contactPersons,
	features,
	groups,
	news,
	pricing,
	stats,
	testimonial,
	vision,
} from './_utils';
import contactPersonsSectionField from './contact-persons';
import featuresField from './features';
import groupsField from './groups';
import newsField from './news';
import pricingField from './pricing';
import statsField from './stats';
import testimonialField from './testimonial';
import visionField from './vision';

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
		}),
	],
	preview: {
		prepare: () => ({ title: 'Home' }),
	},
});

export default homePage;
