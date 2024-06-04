import { RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { titleField } from '../../shared/general-fields';
import { metaField } from '../../shared/meta-fields';

const siteSettings = defineType({
	title: 'Site Settings',
	name: 'siteSettings',
	type: 'document',
	icon: RiSettings5Line,
	groups: [
		{ name: 'meta', title: 'General Information' },
		{ name: 'navigation', title: 'Main Navigation' },
		{ name: 'social', title: 'Social' },
	],
	fields: [
		// meta
		{ ...titleField, group: 'meta' },
		defineField({
			title: 'Description',
			name: 'description',
			type: 'text',
			description: 'Description for search engines and social media.',
			group: 'meta',
			validation: rule => rule.required(),
		}),
		metaField,
		defineField({
			title: 'Navigation',
			name: 'navigation',
			type: 'array',
			of: [
				{ title: 'Internal Link', type: 'internalLink' },
				{ title: 'External Link', type: 'externalLink' },
			],
			description: 'Select pages or link for main navigation',
			group: 'navigation',
		}),
		defineField({
			title: 'Social Media',
			name: 'socialFields',
			type: 'socialFields',
			description: 'Social media',
			group: 'social',
		}),
	],
	preview: {
		prepare: () => ({ title: 'Global Settings' }),
		select: {},
	},
});

export default siteSettings;
