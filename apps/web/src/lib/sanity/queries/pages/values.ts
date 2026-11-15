import { defineQuery } from 'next-sanity';

import { internalLinkTarget } from '@/lib/sanity/queries';

/**
 * Query to get the values page `/verein/werte` (WEB-150), with the target of every closing button
 * resolved for `getInternalHref`.
 *
 * @returns The values page
 */
export const valuesPageQuery = defineQuery(`
	*[_type == 'valuesPage'][0] {
		...,
		content {
			...,
			joinSection {
				...,
				"links": coalesce(links[] {
					_key,
					title,
					linkType,
					href,
					"link": link-> { ${internalLinkTarget} }
				}, [])
			}
		}
	}
`);
