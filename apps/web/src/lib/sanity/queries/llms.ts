import { defineQuery } from 'next-sanity';

/**
 * Query to get the content of the llms.txt file
 *
 * A department without a slug has no page and is left out, so the groups below it can always be
 * linked through the slug of their department.
 *
 * @returns The club description, the contact details, the descriptions of the club and membership
 * pages, the membership fees, and every department in the order the offer shows them, each with its
 * own meta description and its groups with theirs and their training times
 */
const llmsTxtQuery = defineQuery(`
	{
		"aboutUs": *[_type == 'aboutUs'][0].meta.metaDescription,
		"contact": *[_type == 'site-settings'][0].contact { email, phone, postalAddress },
		"departments": *[_type == 'department' && defined(slug.current)] | order(sortOrder asc) {
			title,
			"description": meta.metaDescription,
			"slug": slug.current,
			"groups": *[_type == 'group' && department._ref == ^._id] | order(sortOrder asc) {
				_type,
				"department": ^.slug.current,
				"description": meta.metaDescription,
				"slug": slug.current,
				title,
				"trainingTimes": training.trainingTimes[] {
					endTime,
					season,
					startTime,
					"venue": coalesce(venue->location.name, venue->title),
					weekday,
				},
			},
		},
		"description": *[_type == 'home'][0].meta.metaDescription,
		"membership": *[_type == 'membership'][0].meta.metaDescription,
		"prices": *[_type == 'home'][0].content.pricingSection {
			pricingAdult { price, subtitle, title },
			pricingFamily { price, subtitle, title },
			pricingYouth { price, subtitle, title },
		},
	}
`);

export { llmsTxtQuery };
