import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Query to get the volunteer page and every published open position, newest first
 *
 * @returns The volunteer page and the open positions
 */
export const volunteerPageQuery = defineQuery(`
	{
		"volunteerPage": *[_type == 'volunteerPage'][0] {
			...,
			content {
				...,
				voicesSection {
					...,
					testimonials[]-> { _id, firstName, lastName, image, quote, role }
				},
				contactPersonsSection {
					...,
					contactPersons[]-> {
						${contactPersons}
					}
				}
			}
		},
		"positions": *[_type == 'volunteer.position'] | order(_createdAt desc) {
			_id,
			title,
			area,
			effort,
			teaser,
			tasks,
			profile,
			offer
		}
	}
`);
