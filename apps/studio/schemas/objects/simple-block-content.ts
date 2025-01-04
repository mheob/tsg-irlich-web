import { RiFileTextLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const simpleBlockContent = defineField({
	title: 'Simple Block Content',
	name: 'simpleBlockContent',
	type: 'object',
	icon: RiFileTextLine,
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
						// annotations: [{ type: 'link' }],
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Italic', value: 'em' },
						],
					},
					styles: [{ title: 'Normal', value: 'normal' }],
				},
			],
		},
	],
});

export default simpleBlockContent;
