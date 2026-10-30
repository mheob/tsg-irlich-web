import { defineQuery } from 'next-sanity';

import { contactPersons, finishedEchoIssue, internalLinkTarget } from '@/lib/sanity/queries';
import { WEIGHTS } from '@/lib/search/constants';

/**
 * The document types of the „Seiten“ group: everything the search finds except the news. FAQs and
 * persons have no page of their own and lead to the pages that show them. The search caches its
 * results under these types as tags, so a change to any of them expires the cache.
 */
const SEARCH_PAGE_TYPES = [
	'department',
	'group',
	'echo.issue',
	'faq',
	'person',
	'home',
	'aboutUs',
	'departmentsPage',
	'membership',
	'contact',
	'newsOverview',
	'echoOverview',
	'imprint',
	'privacy',
	'accessibility',
] as const;

/**
 * `SEARCH_PAGE_TYPES` as a GROQ array. Sanity TypeGen cannot read an array built at runtime, so the
 * list is spelled out a second time; a test keeps both in step.
 */
const searchPageTypeList = /* groq */ `['department', 'group', 'echo.issue', 'faq', 'person', 'home', 'aboutUs', 'departmentsPage', 'membership', 'contact', 'newsOverview', 'echoOverview', 'imprint', 'privacy', 'accessibility']`;

/** The pages that list a person in their contact persons section. Group pages list theirs by team. */
const contactPersonPageTypeList = /* groq */ `['department', 'home', 'aboutUs', 'departmentsPage', 'membership', 'contact', 'newsOverview', 'newsOverviewCategory']`;

/**
 * Everything a hit needs to become a link with a meta line and a thumbnail. The image is the one
 * the overviews show for the type. Home has none: its hero is a cut-out that does not work as a
 * thumbnail.
 */
const searchTarget = /* groq */ `
	_id,
	_type,
	title,
	"slug": slug.current,
	"department": department-> { title, "slug": slug.current },
	"category": categories[0]-> { title, "slug": slug.current },
	publishedAt,
	indexable,
	"image": select(
		_type == 'department' => cardImage,
		_type in ['group', 'news.article'] => featuredImage,
		_type == 'echo.issue' => pages[0],
		_type == 'home' => null,
		heroImage
	)
`;

/**
 * The score of a page: the weight of every field the search term matches, see `WEIGHTS`.
 *
 * - Only a department and the home page have an `intro` of plain text. Everywhere else it is
 *   portable text, and `match` would search such an object down to its `_type` and `style` values,
 *   so a search for „span“ or „block“ would find it. Its words are matched through their path.
 * - `score()` rejects a dereference. A role counts through `references()` to the roles whose title
 *   matches instead.
 * - `text::query()` wants every word in the one field it is matched against. The last two terms
 *   match all fields of a page at once, so a page whose words sit in different fields is still
 *   found. Each page type takes part in exactly one of them. A role title cannot be part of them.
 * - The text of a TSG-Echo issue only counts when the issue is indexable. Its `intro` does not count
 *   at all, nor does the issue take part in the terms over all fields: the spec searches an issue by
 *   its title and its text only.
 */
const pageScore = /* groq */ `
	boost(title match text::query($q), ${WEIGHTS.title}),
	boost(searchTerms[] match text::query($q), ${WEIGHTS.searchTerms}),
	boost(subtitle match text::query($q), ${WEIGHTS.lead}),
	boost(_type in ['department', 'home'] && intro match text::query($q), ${WEIGHTS.lead}),
	boost(intro.text[].children[].text match text::query($q), ${WEIGHTS.lead}),
	boost(introText.text[].children[].text match text::query($q), ${WEIGHTS.lead}),
	boost(content.introSection.intro.text[].children[].text match text::query($q), ${WEIGHTS.lead}),
	boost(description.text[].children[].text match text::query($q), ${WEIGHTS.lead}),
	boost(question match text::query($q), ${WEIGHTS.lead}),
	boost([firstName, lastName] match text::query($q), ${WEIGHTS.lead}),
	boost(answer[].children[].text match text::query($q), ${WEIGHTS.body}),
	boost(training.trainingDescription.text[].children[].text match text::query($q), ${WEIGHTS.body}),
	boost(content.text[].children[].text match text::query($q), ${WEIGHTS.body}),
	boost(content.visionSection.longVision.text[].children[].text match text::query($q), ${WEIGHTS.body}),
	boost(references(*[_type == 'role' && title match text::query($q)]._id), ${WEIGHTS.body}),
	boost(affiliations[].taskDescription match text::query($q), ${WEIGHTS.body}),
	boost(indexable != false && extractedText match text::query($q), ${WEIGHTS.body}),
	boost(_type in ['department', 'home'] && [title, searchTerms[], subtitle, intro] match text::query($q), ${WEIGHTS.body}),
	boost(!(_type in ['department', 'home', 'echo.issue']) && [
		title,
		searchTerms[],
		subtitle,
		intro.text[].children[].text,
		introText.text[].children[].text,
		content.introSection.intro.text[].children[].text,
		description.text[].children[].text,
		question,
		firstName,
		lastName,
		answer[].children[].text,
		training.trainingDescription.text[].children[].text,
		content.text[].children[].text,
		content.visionSection.longVision.text[].children[].text,
		affiliations[].taskDescription
	] match text::query($q), ${WEIGHTS.body})
`;

/**
 * The scored candidates of the „Seiten“ group, best first. A TSG-Echo issue only takes part once it
 * is finished, like everywhere else on the website.
 *
 * A FAQ comes with the departments that show it. A person comes with the pages that list them and
 * with the group of every affiliation, plus whether the search term matched the name and the role
 * or task of each affiliation. `searchSite` turns both into hits on those pages.
 *
 * TypeGen does not know `score()`. It types `_score` as `null`, so it would drop every candidate
 * from the result type for `[_score > 0]`, and the score would be typed `null`. Scores are never
 * negative, so `!= 0` keeps the same candidates, and `math::sum()` of the one score is typed as a
 * number.
 *
 * @param q - The text query, as `toTextQuery` builds it
 * @param limit - How many candidates to return at most
 * @returns The candidates with a positive score
 */
const searchCandidatesQuery = defineQuery(`
	*[_type in ${searchPageTypeList} && (_type != 'echo.issue' || (${finishedEchoIssue}))]
	| score(${pageScore})
	| order(_score desc) [_score != 0] [0...$limit] {
		${searchTarget},
		"_score": math::sum([_score]),
		_type == 'faq' => {
			question,
			"targets": departments[]-> { ${searchTarget} }
		},
		_type == 'person' => {
			firstName,
			lastName,
			"nameMatches": [firstName, lastName] match text::query($q),
			"affiliations": affiliations[] {
				"role": role->title,
				"roleMatches": [role->title, taskDescription] match text::query($q),
				"team": team-> { ${searchTarget} }
			},
			"listedOn": *[_type in ${contactPersonPageTypeList} && references(^._id)] { ${searchTarget} }
		}
	}
`);

/**
 * The news articles the search term matches, by title or text. The array matches whenever the title
 * or the text alone would, and also when the words are spread over both.
 */
const newsFilter = /* groq */ `_type == 'news.article' && [title, body[].text[].children[].text] match text::query($q)`;

/**
 * One page of news hits, best first. A title hit weighs more than a text hit; between two articles
 * with the same score the newer one comes first. The score goes through `math::sum()` for TypeGen,
 * as in `searchCandidatesQuery`.
 *
 * @param q - The text query, as `toTextQuery` builds it
 * @param start - The index of the first hit
 * @param end - The index after the last hit (exclusive)
 * @returns The news hits of the page
 */
const searchNewsQuery = defineQuery(`
	*[${newsFilter}]
	| score(
		boost(title match text::query($q), ${WEIGHTS.title}),
		boost(body[].text[].children[].text match text::query($q), ${WEIGHTS.body}),
		boost([title, body[].text[].children[].text] match text::query($q), ${WEIGHTS.body})
	)
	| order(_score desc, publishedAt desc) [$start...$end] {
		${searchTarget},
		"_score": math::sum([_score])
	}
`);

/**
 * How many news articles the search term matches.
 *
 * @param q - The text query, as `toTextQuery` builds it
 * @returns The number of news hits
 */
const searchNewsCountQuery = defineQuery(`count(*[${newsFilter}])`);

/**
 * The plain text of every hit a snippet is cut from. Two parts are joined with `coalesce()`,
 * because a missing part would make the whole string `null`. A TSG-Echo issue only gives its text
 * when it is indexable.
 *
 * @param ids - The ids of the hits that need a snippet
 * @returns The id and the text of every hit
 */
const searchTextsQuery = defineQuery(`
	*[_id in $ids] {
		_id,
		"text": select(
			_type == 'news.article' => pt::text(body[_type == 'blockContent'].text[]),
			_type == 'department' => intro,
			_type == 'group' => coalesce(pt::text(description.text), '') + ' ' + coalesce(pt::text(training.trainingDescription.text), ''),
			_type in ['membership', 'echoOverview'] => pt::text(intro.text),
			_type == 'privacy' => coalesce(pt::text(introText.text), '') + ' ' + coalesce(pt::text(content.text), ''),
			_type == 'accessibility' => pt::text(content.text),
			_type == 'aboutUs' => coalesce(pt::text(content.introSection.intro.text), '') + ' ' + coalesce(pt::text(content.visionSection.longVision.text), ''),
			_type == 'echo.issue' => select(indexable != false => extractedText),
			subtitle
		)
	}
`);

/**
 * The search page. The links of „Keine Treffer“ carry the same fields as the links of the main
 * navigation, so `getInternalHref` can resolve them.
 *
 * @returns The search page with its contact persons
 */
const searchPageQuery = defineQuery(`
	*[_type == 'searchPage'][0] {
		...,
		content {
			...,
			noResults {
				...,
				"links": coalesce(links[] {
					_key,
					title,
					linkType,
					href,
					"link": link-> { ${internalLinkTarget} }
				}, [])
			},
			contactPersonsSection {
				...,
				contactPersons[]-> {
					${contactPersons}
				}
			}
		}
	}
`);

/** The placeholder of the search field, for the panel in the navigation. */
const searchPlaceholderQuery = defineQuery(
	`*[_type == 'searchPage'][0].content.searchSection.placeholder`,
);

/** The heading of „Häufig gesucht“ and the terms the editors pin or block there. */
const searchPopularSettingsQuery = defineQuery(`
	*[_type == 'searchPage'][0].content.popularSearches { title, pinnedTerms, blockedTerms }
`);

export {
	SEARCH_PAGE_TYPES,
	searchCandidatesQuery,
	searchNewsCountQuery,
	searchNewsQuery,
	searchPageQuery,
	searchPlaceholderQuery,
	searchPopularSettingsQuery,
	searchTextsQuery,
};
