import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

export const mainNavigationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		mainNavigation[] {
			_key,
			"link": link-> { ${internalLinkTarget} },
			title
		}
	}
`);
