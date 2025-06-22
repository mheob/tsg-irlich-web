import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the news overview page
 *
 * @returns The news overview page
 */
export const newsOverviewPageQuery = defineQuery(`
	*[_type == 'newsOverview'][0] {
		...,
		content {
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		}
	}
`);
