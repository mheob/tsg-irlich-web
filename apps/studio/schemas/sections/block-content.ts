import { defineArrayMember, defineField } from '@sanity-typed/types';
import { RiFileTextLine } from 'react-icons/ri';

const blockContent = defineField({
	title: 'Block Content',
	name: 'blockContent',
	type: 'object',
	description: 'Text Block',
	icon: RiFileTextLine,
	fields: [
		defineField({
			title: 'Text',
			name: 'text',
			type: 'array',
			of: [
				defineArrayMember({
					title: 'Block',
					type: 'block',
					marks: {
						annotations: [defineArrayMember({ type: 'link' })],
						decorators: [
							{ title: 'Strong', value: 'strong' },
							{ title: 'Italic', value: 'em' },
						],
					},
					styles: [
						{ title: 'Normal', value: 'normal' },
						{ title: 'H2', value: 'h2' },
						{ title: 'H3', value: 'h3' },
						{ title: 'Quote', value: 'blockquote' },
					],
				}),
				defineArrayMember({
					name: 'customImage',
					type: 'mainImage',
				}),
			],
		}),
	],
	// preview: {
	// 	select: {
	// 		blocks: 'text',
	// 	},
	// 	prepare(value: { blocks: Array<PortableTextTextBlock<PortableTextSpan>> }) {
	// 		const block = value.blocks.find(block => block._type === 'block');
	// 		return {
	// 			title: block
	// 				? `Text: ${block.children
	// 						.filter(child => child._type === 'span')
	// 						.map(span => span.text)
	// 						.join('')}`
	// 				: 'No title',
	// 		};
	// 	},
	// },
});

export default blockContent;
