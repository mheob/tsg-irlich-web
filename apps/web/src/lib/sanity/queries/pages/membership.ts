import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the membership page
 *
 * @returns The membership page
 */
export const membershipPageQuery = defineQuery(`
	{
		"membership": *[_type == 'membership'][0] {
			...,
			downloadsSection {
				...,
				downloads[] {
					...,
					document {
						...,
						asset->
					}
				}
			},
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		},
		"pricingSection": *[_type == 'home'][0].content.pricingSection
	}
`);
