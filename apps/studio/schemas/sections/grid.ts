import { RiLayoutGridLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const grid = defineField({
	title: 'Grid',
	name: 'grid',
	type: 'object',
	description: 'This is a simple grid component, all items are going to be equally wide',
	icon: RiLayoutGridLine,
	hidden: true,
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
		{
			title: 'Title',
			name: 'title',
			type: 'string',
		},
		{
			title: 'Columns',
			name: 'columns',
			type: 'columns',
			group: 'columns',
		},
		{
			title: 'Items',
			name: 'items',
			type: 'array',
			of: [{ type: 'mainImage' }, { type: 'blockContent' }],
			group: 'items',
			options: {
				layout: 'grid',
			},
		},
	],
	preview: {
		prepare: ({ title }) => ({ title }),
		select: {
			title: 'title',
		},
	},
});

export default grid;
