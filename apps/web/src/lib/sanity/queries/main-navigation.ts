import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

/** The fields a first-level entry and each child of a menu share. */
const navigationLinkFields = /* groq */ `
	_key,
	title,
	linkType,
	href,
	"link": link-> { ${internalLinkTarget} }
`;

export const mainNavigationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		mainNavigation[] {
			_type,
			${navigationLinkFields},
			hasTwoColumns,
			"children": coalesce(children[] { ${navigationLinkFields}, description }, [])
		}
	}
`);
