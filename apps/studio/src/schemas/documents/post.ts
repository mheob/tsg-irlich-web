import { RiArticleLine } from 'react-icons/ri';
import { defineType } from 'sanity';
import slug from 'slugify';

const post = defineType({
	title: 'Posts',
	name: 'post',
	type: 'document',
	icon: RiArticleLine,
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
			title: 'Excerpt',
			name: 'excerpt',
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
			description: 'Title of the post',
			group: 'general',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Slug',
			name: 'slug',
			type: 'slug',
			description: 'A slug is required to be set to be able to show the post',
			group: 'general',
			options: {
				slugify: (input: string) => slug(input, { lower: true }),
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
			title: 'Author',
			name: 'author',
			type: 'reference',
			to: [{ type: 'person' }],
			description: 'Select author for post',
			group: 'meta',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Published at',
			name: 'publishedAt',
			type: 'datetime',
			description: 'You can use this field to schedule post where you show them',
			group: 'meta',
			validation: Rule => Rule.required(),
		},
		{
			description: 'Tags for your post',
			title: 'Keywords',
			name: 'keywords',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'meta',
			options: {
				layout: 'tags',
			},
			validation: Rule => Rule.unique(),
		},
		{
			title: 'Excerpt',
			name: 'excerpt',
			type: 'simpleBlockContent',
			description: 'This ends up on summary pages, when people share your post in social media.',
			group: 'excerpt',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Featured Image',
			name: 'featuredImage',
			type: 'mainImage',
			description: 'Image that is displayed in posts lists',
			group: 'excerpt',
		},
		{
			title: 'Content',
			name: 'content',
			type: 'array',
			of: [{ type: 'grid' }, { type: 'mainImage' }, { type: 'blockContent' }, { type: 'spacer' }],
			description: 'Add, edit, and reorder sections with content',
			group: 'content',
		},
	],
	initialValue: () => ({ publishedAt: new Date().toISOString() }),
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			publishedAt: 'publishedAt',
			title: 'title',
		},
	},
});

export default post;
