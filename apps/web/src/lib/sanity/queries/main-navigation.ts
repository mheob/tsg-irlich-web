import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

/** The fields a main navigation item and each of its children share. */
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
			${navigationLinkFields},
			"children": coalesce(children[] { ${navigationLinkFields} }, [])
		}
	}
`);
