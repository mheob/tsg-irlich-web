import { RiCheckboxIndeterminateLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const spacer = defineField({
	description: 'An empty block to create space between sections',
	fields: [
		defineField({
			initialValue: 'default',
			name: 'variant',
			options: {
				layout: 'radio',
				list: [{ title: 'Default', value: 'default' }],
			},
			title: 'Variant',
			type: 'string',
		}),
	],
	icon: RiCheckboxIndeterminateLine,
	name: 'spacer',
	preview: {
		prepare: ({ title }) => ({ title: `Spacer (${title})` }),
		select: {
			title: 'variant',
		},
	},
	title: 'Spacer',
	type: 'object',
});

export default spacer;
