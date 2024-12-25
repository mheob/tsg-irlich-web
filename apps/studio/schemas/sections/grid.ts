import { defineArrayMember, defineField } from '@sanity-typed/types';
import { RiLayoutGridLine } from 'react-icons/ri';

const grid = defineField({
	title: 'Grid',
	name: 'grid',
	type: 'object',
	description: 'This is a simple grid component, all items are going to be equally wide',
	icon: RiLayoutGridLine,
	groups: [
		{
			title: 'Columns',
			name: 'columns',
		},
		{
			title: 'Items',
			name: 'items',
		},
	],
	fields: [
		defineField({
			title: 'Title',
			name: 'title',
			type: 'string',
		}),
		defineField({
			title: 'Columns',
			name: 'columns',
			type: 'columns',
			group: 'columns',
		}),
		defineField({
			title: 'Items',
			name: 'items',
			type: 'array',
			of: [defineArrayMember({ type: 'mainImage' }), defineArrayMember({ type: 'blockContent' })],
			group: 'items',
			options: {
				layout: 'grid',
			},
		}),
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			title: 'title',
		},
	},
});

export default grid;
