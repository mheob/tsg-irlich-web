import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

export const homePageQuery = defineQuery(`*[_type == 'home'][0]`);

export const homePageGroupsQuery = defineQuery(`
	*[_type == 'group'][] {
		title,
		icon,
	}
`);

export const homePageTestimonialsQuery = defineQuery(`
	*[_type == 'home'][0].content.testimonialSection.testimonials[0..2]-> {
		firstName,
		lastName,
		image,
		quote,
		role,
		showAlways,
	}
`);

/** IMPORTANT: The param `department` is required for the contactPersons fragment. */
export const homePageContactPersonsQuery = defineQuery(`
	*[_type == 'home'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);
