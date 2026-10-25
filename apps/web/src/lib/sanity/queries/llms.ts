import { defineQuery } from 'next-sanity';

/**
 * Query to get the content of the llms.txt file
 *
 * A department without a slug has no page and is left out, so the groups below it can always be
 * linked through the slug of their department.
 *
 * @returns The club description, the contact details, the descriptions of the club and membership
 * pages, and every department in the order the offer shows them, each with its groups and their
 * meta descriptions
 */
const llmsTxtQuery = defineQuery(`
	{
		"aboutUs": *[_type == 'aboutUs'][0].meta.metaDescription,
		"contact": *[_type == 'site-settings'][0].contact { email, phone, postalAddress },
		"departments": *[_type == 'department' && defined(slug.current)] | order(sortOrder asc) {
			title,
			"slug": slug.current,
			"groups": *[_type == 'group' && department._ref == ^._id] | order(sortOrder asc) {
				_type,
				"department": ^.slug.current,
				"description": meta.metaDescription,
				"slug": slug.current,
				title,
			},
		},
		"description": *[_type == 'home'][0].meta.metaDescription,
		"membership": *[_type == 'membership'][0].meta.metaDescription,
	}
`);

export { llmsTxtQuery };
