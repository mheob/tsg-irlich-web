import { RiPagesLine } from 'react-icons/ri';
import { defineType } from 'sanity';
import slug from 'slugify';

const page = defineType({
	title: 'Pages',
	name: 'page',
	type: 'document',
	icon: RiPagesLine,
	groups: [
		{
			title: 'General',
			name: 'general',
		},
		{
			title: 'Meta information',
			name: 'meta',
		},
		{
			title: 'Content',
			name: 'content',
		},
	],
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			description: 'Title of the page',
			group: 'general',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			description: 'A slug is required to be set to be able to show the page',
			group: 'general',
			options: {
				slugify: (input: string) => slug(input, { lower: true, trim: true }),
				source: 'title',
			},
			validation: Rule => Rule.required(),
		},
		{
			title: 'Meta',
			name: 'meta',
			type: 'metaFields',
			group: 'meta',
		},
		{
			title: 'Page sections',
			name: 'content',
			type: 'array',
			of: [
				// TODO: Create Label with Text/Images etc. components to use here
				{ type: 'grid' },
				{ type: 'mainImage' },
				{ type: 'blockContent' },
				{ type: 'spacer' },
			],
			description: 'Add, edit, and reorder sections',
			group: 'content',
		},
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			title: 'title',
		},
	},
});

export default page;
