import { RiLayoutColumnLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const columns = defineField({
	description: 'Items per row',
	fields: [
		{
			description: 'Items per row for phone',
			name: 'small',
			options: {
				list: [
					{ title: '1 columns', value: '1' },
					{ title: '2 columns', value: '2' },
					{ title: '3 columns', value: '3' },
					{ title: '4 columns', value: '4' },
				],
			},
			title: 'Small screens',
			type: 'string',
		},
		{
			description: 'Items per row for tablet',
			name: 'medium',
			options: {
				list: [
					{ title: '1 columns', value: '1' },
					{ title: '2 columns', value: '2' },
					{ title: '3 columns', value: '3' },
					{ title: '4 columns', value: '4' },
				],
			},
			title: 'Medium screens',
			type: 'string',
		},
		{
			description: 'Items per row for desktop',
			name: 'large',
			options: {
				list: [
					{ title: '1 columns', value: '1' },
					{ title: '2 columns', value: '2' },
					{ title: '3 columns', value: '3' },
					{ title: '4 columns', value: '4' },
				],
			},
			title: 'Large screens',
			type: 'string',
		},
	],
	icon: RiLayoutColumnLine,
	name: 'columns',
	title: 'Columns',
	type: 'object',
	validation: (Rule) => Rule.required(),
});

export default columns;
