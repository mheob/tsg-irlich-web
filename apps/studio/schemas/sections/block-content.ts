import { RiFileTextLine } from 'react-icons/ri';
import { defineField, type PortableTextSpan, type PortableTextTextBlock } from 'sanity';

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
				{
					title: 'Block',
					type: 'block',
					marks: {
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
				},
			],
		}),
	],
	preview: {
		select: {
			blocks: 'text',
		},
		// eslint-disable-next-line ts/no-explicit-any
		prepare(value: Record<string, any>) {
			const block: PortableTextTextBlock<PortableTextSpan> | undefined = value.blocks.find(
				(block: PortableTextTextBlock<PortableTextSpan>) => block._type === 'block',
			);
			return {
				title: block
					? `Text: ${block.children
							.filter(child => child._type === 'span')
							.map(span => span.text)
							.join('')}`
					: 'No title',
			};
		},
	},
});

export default blockContent;
