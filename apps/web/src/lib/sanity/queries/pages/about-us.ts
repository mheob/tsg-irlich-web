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

/**
 * Query to get the hero image of the about page, which the TSG-Echo pages show as well
 *
 * @returns The hero image of the about page
 */
export const aboutUsHeroImageQuery = defineQuery(`*[_type == 'aboutUs'][0].heroImage`);
