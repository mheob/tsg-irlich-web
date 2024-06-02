import { RiCheckboxIndeterminateLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const spacer = defineField({
	title: 'Spacer',
	name: 'spacer',
	type: 'object',
	description: 'An empty block to create space between sections',
	icon: RiCheckboxIndeterminateLine,
	hidden: true,
	fields: [
		{
			title: 'Size',
			name: 'size',
			type: 'string',
			options: {
				layout: 'radio',
				list: [
					{ title: 'Small', value: 'small' },
					{ title: 'Medium', value: 'medium' },
					{ title: 'Large', value: 'large' },
					{ title: 'X-Large', value: 'xlarge' },
				],
			},
		},
	],
	preview: {
		prepare: ({ title }) => ({ title: `Spacer ${title.charAt(0).toUpperCase() + title.slice(1)}` }),
		select: {
			title: 'size',
		},
	},
});

export default spacer;
