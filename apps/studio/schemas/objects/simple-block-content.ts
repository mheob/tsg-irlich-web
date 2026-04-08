import { RiFileTextLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const simpleBlockContent = defineField({
	fields: [
		{
			name: 'text',
			of: [
				{
					marks: {
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Italic', value: 'em' },
						],
					},
					styles: [{ title: 'Normal', value: 'normal' }],
					title: 'Block',
					type: 'block',
				},
			],
			title: 'Text',
			type: 'array',
		},
	],
	icon: RiFileTextLine,
	name: 'simpleBlockContent',
	title: 'Simple Block Content',
	type: 'object',
});

export default simpleBlockContent;
