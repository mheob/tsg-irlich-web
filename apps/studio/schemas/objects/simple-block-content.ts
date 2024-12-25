import { defineArrayMember, defineField } from '@sanity-typed/types';
import { RiFileTextLine } from 'react-icons/ri';

const simpleBlockContent = defineField({
	title: 'Simple Block Content',
	name: 'simpleBlockContent',
	type: 'object',
	description: 'Simple text block',
	icon: RiFileTextLine,
	fields: [
		{
			title: 'Text',
			name: 'text',
			type: 'array',
			of: [
				defineArrayMember({
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
				}),
			],
		},
	],
});

export default simpleBlockContent;
