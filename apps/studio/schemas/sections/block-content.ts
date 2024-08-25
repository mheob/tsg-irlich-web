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
							{ title: 'Code', value: 'code' },
						],
					},
					styles: [
						{ title: 'Normal', value: 'normal' },
						{ title: 'H2', value: 'h2' },
						{ title: 'H3', value: 'h3' },
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
