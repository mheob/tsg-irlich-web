import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const internalLink = defineField({
	title: 'Internal Link',
	name: 'internalLink',
	type: 'object',
	icon: RiLinksLine,
	hidden: true,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			// validation: rule => rule.required(),
		},
		{
			title: 'Link',
			name: 'link',
			type: 'reference',
			to: [{ type: 'news.article' }],
		},
	],
});

export default internalLink;
