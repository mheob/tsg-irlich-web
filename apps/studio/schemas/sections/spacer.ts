import { RiCheckboxIndeterminateLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const spacer = defineField({
	title: 'Spacer',
	name: 'spacer',
	type: 'object',
	description: 'An empty block to create space between sections',
	icon: RiCheckboxIndeterminateLine,
	// hidden: true,
	fields: [
		defineField({
			title: 'Size',
			name: 'size',
			type: 'string',
			options: {
				layout: 'radio',
				list: [
					{ title: 'Schmal', value: 'small' },
					{ title: 'Mittel', value: 'medium' },
					{ title: 'Breit', value: 'large' },
				],
			},
		}),
	],
	preview: {
		prepare: ({ title }) => ({ title: `Spacer (${title})` }),
		select: {
			title: 'size',
		},
	},
});

export default spacer;
