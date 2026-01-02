import { defineQuery } from 'next-sanity';

/**
 * Query to get the accessibility page
 *
 * @returns The accessibility page with all fields
 */
export const accessibilityPageQuery = defineQuery(`
	*[_type == 'accessibility'][0] {
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
