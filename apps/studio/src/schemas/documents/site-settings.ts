import { RiSettings5Line } from 'react-icons/ri';
import { defineType } from 'sanity';

const siteSettings = defineType({
	title: 'Site Settings',
	name: 'siteSettings',
	type: 'document',
	icon: RiSettings5Line,
	groups: [
		{
			title: 'General Information',
			name: 'meta',
		},
		{
			title: 'Main Navigation',
			name: 'navigation',
		},
		{
			title: 'Social',
			name: 'social',
		},
	],
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			description: 'Title of the page',
			group: 'meta',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Description',
			name: 'description',
			type: 'text',
			description: 'Description for search engines and social media.',
			group: 'meta',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Meta',
			name: 'meta',
			type: 'metaFields',
			group: 'meta',
		},
		{
			title: 'Navigation',
			name: 'navigation',
			type: 'array',
			of: [
				{
					title: 'Internal Link',
					type: 'internalLink',
				},
				{
					title: 'External Link',
					type: 'externalLink',
				},
			],
			description: 'Select pages or link for main navigation',
			group: 'navigation',
		},
		{
			title: 'Social Media',
			name: 'socialFields',
			type: 'socialFields',
			description: 'Social media',
			group: 'social',
		},
	],
	preview: {
		prepare: () => ({ title: 'Global Settings' }),
		select: {},
	},
});

export default siteSettings;
