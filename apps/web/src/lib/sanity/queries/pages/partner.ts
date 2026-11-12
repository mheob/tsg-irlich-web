import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the partner page and every sponsor, sorted by name
 *
 * @returns The partner page and the sponsors
 */
export const partnerPageQuery = defineQuery(`
	{
		"partnerPage": *[_type == 'partnerPage'][0] {
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
		},
		"sponsors": *[_type == 'sponsors'] { _id, name, website, logo } | order(name asc)
	}
`);
