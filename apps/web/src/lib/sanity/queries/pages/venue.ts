import { defineQuery } from 'next-sanity';

import { contactPersons } from '@/lib/sanity/queries';

/**
 * Everything the venue page shows of a venue, including the groups that train there.
 *
 * `^` is the group inside the filter of its training times, `^.^` the venue, so `weekdays` only
 * holds the days a group spends at this venue. A day can appear twice when a group trains there
 * twice a week; the page counts the days as a set.
 */
const venueFields = /* groq */ `
	_id,
	title,
	type,
	mainImage,
	location,
	features,
	openingHours,
	"description": description.text,
	"groups": *[_type == 'group' && references(^._id) && defined(slug.current)] | order(title asc) {
		_id,
		title,
		"slug": slug.current,
		"department": department->slug.current,
		"weekdays": training.trainingTimes[venue._ref == ^.^._id].weekday
	}
`;

/**
 * Query to get the venue page, every venue and the fallback image of the site settings
 *
 * The page picks its two home venues itself; every other venue appears below them as a hall or a
 * field, so the query reads them all.
 *
 * @returns The venue page, the venues and the fallback image
 */
export const venuePageQuery = defineQuery(`
	{
		"venuePage": *[_type == 'venuePage'][0] {
			...,
			content {
				...,
				homeSection {
					...,
					venues[]-> { ${venueFields} }
				},
				contactPersonsSection {
					...,
					contactPersons[]-> {
						${contactPersons}
					}
				}
			}
		},
		"venues": *[_type == 'venue'] | order(title asc) { ${venueFields} },
		"fallbackImage": *[_type == 'site-settings'][0].fallbackImage
	}
`);
