import { RiLayoutGridLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const grid = defineField({
	description: 'This is a simple grid component, all items are going to be equally wide',
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
		},
		{
			group: 'columns',
			name: 'columns',
			title: 'Columns',
			type: 'columns',
		},
		{
			group: 'items',
			name: 'items',
			of: [{ type: 'mainImage' }, { type: 'blockContent' }],
			options: {
				layout: 'grid',
			},
			title: 'Items',
			type: 'array',
		},
	],
	groups: [
		{
			name: 'columns',
			title: 'Columns',
		},
		{
			name: 'items',
			title: 'Items',
		},
	],
	icon: RiLayoutGridLine,
	name: 'grid',
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			title: 'title',
		},
	},
	title: 'Grid',
	type: 'object',
});

export default grid;
