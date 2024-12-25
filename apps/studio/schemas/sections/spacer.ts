import { defineField } from '@sanity-typed/types';
import { RiCheckboxIndeterminateLine } from 'react-icons/ri';

const spacer = defineField({
	title: 'Spacer',
	name: 'spacer',
	type: 'object',
	description: 'An empty block to create space between sections',
	icon: RiCheckboxIndeterminateLine,
	// hidden: true,
	fields: [
		defineField({
			title: 'Variant',
			name: 'variant',
			type: 'string',
			options: {
				layout: 'radio',
				list: [{ title: 'Default', value: 'default' }],
			},
			initialValue: 'default',
		}),
	],
	preview: {
		prepare: ({ title }) => ({ title: `Spacer (${title})` }),
		select: {
			title: 'variant',
		},
	},
});

export default spacer;
