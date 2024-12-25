import { defineField } from '@sanity-typed/types';
import { RiLinksLine } from 'react-icons/ri';

const internalLink = defineField({
	title: 'Internal Link',
	name: 'internalLink',
	type: 'object',
	icon: RiLinksLine,
	fields: [
		defineField({
			title: 'Title',
			name: 'title',
			type: 'string',
			// validation: rule => rule.required(),
		}),
		defineField({
			title: 'Link',
			name: 'link',
			type: 'reference',
			to: [
				{ type: 'news.article' },
				// Single Pages
				{ type: 'home' },
				{ type: 'aboutUs' },
				{ type: 'contact' },
				{ type: 'groupsPage' },
				{ type: 'imprint' },
				{ type: 'membership' },
				{ type: 'newsOverview' },
				{ type: 'privacy' },
				{ type: 'singleGroupPage' },
			],
		}),
	],
});

export default internalLink;
