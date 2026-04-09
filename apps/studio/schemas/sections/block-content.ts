import { RiFileTextLine } from 'react-icons/ri';
import { defineField } from 'sanity';
import type { PortableTextSpan, PortableTextTextBlock } from 'sanity';

import externalLink from '../objects/external-link';
import internalLink from '../objects/internal-link';

const blockContent = defineField({
	description: 'Text Block',
	fields: [
		defineField({
			name: 'text',
			of: [
				{
					marks: {
						annotations: [internalLink, externalLink],
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
					title: 'Block',
					type: 'block',
				},
			],
			title: 'Text',
			type: 'array',
		}),
	],
	icon: RiFileTextLine,
	name: 'blockContent',
	preview: {
		// oxlint-disable-next-line typescript/no-explicit-any
		prepare(value: Record<string, any>) {
			const block: PortableTextTextBlock<PortableTextSpan> | undefined = value.blocks.find(
				(currentBlock: PortableTextTextBlock<PortableTextSpan>) => currentBlock._type === 'block',
			);
			return {
				title: block
					? `Text: ${block.children
							.filter((child) => child._type === 'span')
							.map((span) => span.text)
							.join('')}`
					: 'No title',
			};
		},
		select: {
			blocks: 'text',
		},
	},
	title: 'Block Content',
	type: 'object',
});

export default blockContent;
