import { defineQuery } from 'next-sanity';

import { finishedEchoIssue, meta } from '@/lib/sanity/queries';

/** What a card, the issue page and its download button need of an issue. */
const echoIssueCard = /* groq */ `
	_id,
	title,
	"slug": slug.current,
	releaseDate,
	intro,
	"cover": pages[0] { _type, asset },
	"pdf": pdf.asset-> { originalFilename, size, url }
`;

/** The archive's own page: hero, intro and meta. */
export const echoOverviewPageQuery = defineQuery(`
	*[_type == 'echoOverview'][0] {
		title,
		subtitle,
		intro,
		${meta}
	}
`);

/** How many finished issues there are, for the pagination. */
export const echoIssuesTotalQuery = defineQuery(`count(*[${finishedEchoIssue}])`);

/** A slice of the finished issues, newest first. `$end` is exclusive. */
export const echoIssuesQuery = defineQuery(`
	*[${finishedEchoIssue}] | order(releaseDate desc) [$start...$end] {
		${echoIssueCard}
	}
`);

/** One finished issue with every page, for its own page. */
export const echoIssueQuery = defineQuery(`
	*[${finishedEchoIssue} && slug.current == $slug][0] {
		${echoIssueCard},
		${meta},
		"pages": pages[] { _key, _type, asset },
		"pageSize": pages[0].asset->metadata.dimensions { height, width }
	}
`);

/** The slugs of every finished issue, for `generateStaticParams`. */
export const echoIssueSlugsQuery = defineQuery(`*[${finishedEchoIssue}].slug.current`);
