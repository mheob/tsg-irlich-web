import { defineQuery } from 'next-sanity';

export const mainNavigationQuery = defineQuery(`
	*[_type == 'site-settings'][0] {
		mainNavigation[] {
			_key,
			"slug": link->slug.current,
			title
		}
	}
`);
