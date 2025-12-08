import { RiLinksLine } from 'react-icons/ri';
import { defineField } from 'sanity';

const internalLink = defineField({
	title: 'Internal Link',
	name: 'internalLink',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		{
			title: 'Title',
			name: 'title',
			type: 'string',
			validation: Rule => Rule.required(),
		},
		{
			title: 'Link',
			name: 'link',
			type: 'reference',
			to: [
				{ type: 'news.article' },
				// Single Pages
				{ type: 'home' },
				{ type: 'aboutUs' },
				{ type: 'contact' },
				{ type: 'departmentsPage' },
				{ type: 'membership' },
				{ type: 'newsOverview' },
				{ type: 'privacy' },
				{ type: 'imprint' },
			],
		},
	],
});

export default internalLink;
