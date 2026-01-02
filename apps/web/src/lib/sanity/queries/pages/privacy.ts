import { defineQuery } from 'next-sanity';

/**
 * Query to get the privacy page
 *
 * @returns The privacy page with all fields
 */
export const privacyPageQuery = defineQuery(`
	*[_type == 'privacy'][0] {
		...,
		content {
			...,
			text[] {
				...,
				markDefs[] {
					...,
					_type == "internalLink" => {
						"link": link-> {
							_type,
							"slug": slug.current
						}
					}
				}
			}
		}
	}
`);
