import { defineQuery } from 'next-sanity';

export const getHomePage = defineQuery(`*[_type == 'home'][0]`);

export const getHomePageGroups = defineQuery(`
	*[_type == 'group'][] {
		title,
		icon
	}
`);

export const getHomePageTestimonials = defineQuery(`
	*[_type == 'home'][0] {
		'values': content.testimonialSection.testimonials[0..2]-> {
			firstName,
			lastName,
			image,
			quote,
			role,
			showAlways,
		},
	}
`);

export const getHomePageContactPersons = defineQuery(`
	*[_type == 'home'][0] {
		'values': content.contactPersonsSection.contactPersons[]-> {
			firstName,
			lastName,
			phone,
			image,
			"email": affiliations[department->title == 'Vorstand'][0].role->email,
			"role": affiliations[department->title == 'Vorstand'][0].role->title,
			"vision": affiliations[department->title == 'Vorstand'][0].description,
		}
	}
`);

export const getHomePageNews = defineQuery(`
	*[_type == 'news.article'][0..2] {
			title,
			"slug": slug.current,
			excerpt,
			categories[]->{ title, "slug": slug.current },
			featuredImage,
			author->{ firstName, lastName, image },
			_updatedAt,
		} | order(_updatedAt desc)
`);
