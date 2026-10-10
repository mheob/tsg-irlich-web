import { LinkIcon } from '@sanity/icons/Link';
import { defineField } from 'sanity';

/** Every document type a link inside the website may point to. */
const INTERNAL_LINK_TARGETS: { type: string }[] = [
	{ type: 'home' },
	{ type: 'aboutUs' },
	{ type: 'echoOverview' },
	{ type: 'contact' },
	{ type: 'departmentsPage' },
	{ type: 'group.children-gymnastics' },
	{ type: 'group.courses' },
	{ type: 'group.dance' },
	{ type: 'group.other-sports' },
	{ type: 'group.soccer' },
	{ type: 'group.taekwondo' },
	{ type: 'membership' },
	{ type: 'news.article' },
	{ type: 'news.category' },
	{ type: 'newsOverview' },
	{ type: 'accessibility' },
	{ type: 'privacy' },
	{ type: 'imprint' },
];

const internalLink = defineField({
	fields: [
		{
			description: 'Internen Link hinzufügen',
			name: 'link',
			title: 'Link',
			to: INTERNAL_LINK_TARGETS,
			type: 'reference',
			validation: (Rule) => Rule.required().error('Der Link ist erforderlich'),
		},
	],
	icon: LinkIcon,
	name: 'internalLink',
	title: 'Internal Link',
	type: 'object',
});

export default internalLink;
export { INTERNAL_LINK_TARGETS };
