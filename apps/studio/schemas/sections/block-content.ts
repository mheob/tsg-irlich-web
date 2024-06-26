import { RiFileTextLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const blockContent = defineField({
	title: 'Block Content',
	name: 'blockContent',
	type: 'object',
	description: 'Text Block',
	icon: RiFileTextLine,
	hidden: false,
	fields: [
		{
			title: 'Text',
			name: 'text',
			type: 'array',
			of: [
				{
					title: 'Block',
					type: 'block',
					marks: {
						annotations: [{ type: 'link' }],
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Italic', value: 'em' },
							{ title: 'Underline', value: 'underline' },
							{ title: 'Code', value: 'code' },
						],
					},
					styles: [
						{ title: 'Normal', value: 'normal' },
						{ title: 'H1', value: 'h1' },
						{ title: 'H2', value: 'h2' },
						{ title: 'H3', value: 'h3' },
						{ title: 'H4', value: 'h4' },
						{ title: 'H5', value: 'h5' },
						{ title: 'H6', value: 'h6' },
						{
							title: 'Normal Center',
							value: 'normal+center',
						},
						{
							title: 'H1 Center',
							value: 'h1+center',
						},
						{
							title: 'H2 Center',
							value: 'h2+center',
						},
						{
							title: 'H3 Center',
							value: 'h3+center',
						},
						{
							title: 'H4 Center',
							value: 'h4+center',
						},
						{
							title: 'H5 Center',
							value: 'h5+center',
						},
						{
							title: 'H6 Center',
							value: 'h6+center',
						},
						{ title: 'Quote', value: 'blockquote' },
					],
				},
				{
					name: 'customImage',
					type: 'mainImage',
				},
			],
		},
	],
	preview: {
		prepare: () => ({ title: 'Text Section' }),
	},
});

export default blockContent;
