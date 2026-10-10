import { RiLinkM } from 'react-icons/ri';
import { defineType } from 'sanity';

import { navigationLinkFields, prepareNavigationLink } from './navigation-link';

/** A first-level entry that leads somewhere: a page or an external URL, without children. */
const mainNavigationLink = defineType({
	fields: navigationLinkFields,
	icon: RiLinkM,
	name: 'mainNavigationLink',
	preview: {
		prepare: prepareNavigationLink,
		select: { href: 'href', linkType: 'linkType', title: 'title' },
	},
	title: 'Link',
	type: 'object',
});

export default mainNavigationLink;
