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

export const homePageNewsQuery = defineQuery(`
	*[_type == 'news.article'][0..2] | order(_updatedAt desc) {
			title,
			"slug": slug.current,
			excerpt,
			categories[]->{ title, "slug": slug.current },
			featuredImage,
			author->{ firstName, lastName, image },
			_updatedAt,
		}
`);
