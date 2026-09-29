import { defineQuery } from 'next-sanity';

/**
 * Query to get the content of the llms.txt file
 *
 * @returns The club description, the contact details, the descriptions of the club and membership
 * pages, and every group with its meta description
 */
const llmsTxtQuery = defineQuery(`
	{
		"aboutUs": *[_type == 'aboutUs'][0].meta.metaDescription,
		"contact": *[_type == 'site-settings'][0].contact { email, phone, postalAddress },
		"description": *[_type == 'home'][0].meta.metaDescription,
		"groups": *[_type in [
			'group.soccer',
			'group.children-gymnastics',
			'group.courses',
			'group.taekwondo',
			'group.dance',
			'group.other-sports',
		]] | order(sortOrder asc) {
			_type,
			"description": meta.metaDescription,
			"slug": slug.current,
			title,
		},
		"membership": *[_type == 'membership'][0].meta.metaDescription,
	}
`);

export { llmsTxtQuery };
