import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the home page
 *
 * @returns The home page
 */
export const homePageQuery = defineQuery(`
	*[_type == 'home'][0] {
		...,
		content {
			...,
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
 * Query to get the testimonials for the home page
 *
 * @returns The testimonials for the home page
 */
export const homePageTestimonialsQuery = defineQuery(`
	*[_type == 'home'][0].content.testimonialSection.testimonials[]-> {
		_id,
		firstName,
		lastName,
		image,
		quote,
		role,
	}
`);
