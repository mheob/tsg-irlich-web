import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

export const offerPageQuery = defineQuery(`
	*[_type == 'groupsPage'][0] {
		...,
		content {
			...,
			contactPersonsSection {
				intro,
				subtitle,
				title,
			}
		}
	}
`);

export const offerPageContactPersonsQuery = defineQuery(`
	*[_type == 'groupsPage'][0].content.contactPersonsSection.contactPersons[]-> {
		${contactPersons}
	}
`);
