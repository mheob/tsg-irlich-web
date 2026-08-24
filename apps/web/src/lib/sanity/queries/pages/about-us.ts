import { defineQuery } from 'next-sanity';

import { blockContent, contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the about us page
 *
 * @returns The about us page
 */
export const aboutUsPageQuery = defineQuery(`
	*[_type == 'aboutUs'][0] {
		...,
		content {
			...,
			introSection {
				...,
				intro { ${blockContent} }
			},
			chronicleSection {
				...,
				chronicleCategories[] {
					...,
					description { ${blockContent} }
				}
			},
			visionSection {
				...,
				longVision { ${blockContent} }
			},
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		}
	}
`);
