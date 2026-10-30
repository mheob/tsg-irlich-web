import { RiLinksLine, RiSearchLine } from 'react-icons/ri';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import {
	defaultHeroFields,
	getDefaultPageSectionFieldsWithGroup,
	getHiddenSlugField,
} from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

/** A longer placeholder no longer fits into the search field. */
const MAX_PLACEHOLDER_LENGTH = 60;

/** The empty state stays a short list of next steps. */
const MAX_NO_RESULTS_LINKS = 6;

const placeholderField = defineField({
	description: 'Erscheint im Suchfeld der Suchseite und des Such-Panels in der Navigation.',
	name: 'placeholder',
	title: 'Platzhalter im Suchfeld',
	type: 'string',
	validation: (Rule) => [
		Rule.required().error('Der Platzhalter ist erforderlich'),
		Rule.max(MAX_PLACEHOLDER_LENGTH).error(
			`Der Platzhalter darf höchstens ${MAX_PLACEHOLDER_LENGTH} Zeichen lang sein`,
		),
	],
});

const searchSectionField = defineField({
	fields: [...getDefaultPageSectionFieldsWithGroup(), placeholderField],
	group: 'searchSection',
	name: 'searchSection',
	title: 'Suchbereich',
	type: 'object',
});

const noResultsTitleField = defineField({
	name: 'title',
	title: 'Überschrift',
	type: 'string',
	validation: (Rule) => [Rule.required().error('Die Überschrift ist erforderlich')],
});

const noResultsTextField = defineField({
	name: 'text',
	title: 'Text',
	type: 'simpleBlockContent',
});

const noResultsLinksField = defineField({
	name: 'links',
	of: [defineArrayMember({ type: 'navigationLink' })],
	title: 'Links',
	type: 'array',
	validation: (Rule) => [
		Rule.max(MAX_NO_RESULTS_LINKS).error(`Es sind höchstens ${MAX_NO_RESULTS_LINKS} Links möglich`),
	],
});

const noResultsField = defineField({
	fields: [noResultsTitleField, noResultsTextField, noResultsLinksField],
	group: 'noResults',
	name: 'noResults',
	title: 'Keine Treffer',
	type: 'object',
});

const popularSearchesTitleField = defineField({
	initialValue: 'Häufig gesucht',
	name: 'title',
	title: 'Überschrift',
	type: 'string',
});

const pinnedTermsField = defineField({
	description:
		'Diese Begriffe stehen immer in der Liste „Häufig gesucht“, vor den automatisch ermittelten. Solange noch zu wenige Suchen gezählt sind, füllen sie die Liste allein.',
	name: 'pinnedTerms',
	of: [defineArrayMember({ type: 'string' })],
	options: { layout: 'tags' },
	title: 'Immer anzeigen',
	type: 'array',
});

const blockedTermsField = defineField({
	description:
		'Diese Begriffe erscheinen nie in „Häufig gesucht“, auch wenn sie oft gesucht werden.',
	name: 'blockedTerms',
	of: [defineArrayMember({ type: 'string' })],
	options: { layout: 'tags' },
	title: 'Nie anzeigen',
	type: 'array',
});

const popularSearchesField = defineField({
	fields: [popularSearchesTitleField, pinnedTermsField, blockedTermsField],
	group: 'popularSearches',
	name: 'popularSearches',
	title: 'Häufig gesucht',
	type: 'object',
});

const searchPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('suche'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Meta
		metaField,

		// Content
		defineField({
			fields: [
				searchSectionField,
				noResultsField,
				popularSearchesField,
				contactPersonsSectionField,
			],
			group: 'content',
			groups: [
				{ name: 'searchSection', title: 'Suchbereich' },
				{ name: 'noResults', title: 'Keine Treffer' },
				{ name: 'popularSearches', title: 'Häufig gesucht' },
				{ name: 'contactPersons', title: 'Ansprechpartner' },
			],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),
	],
	groups: [general, meta, content],
	icon: RiSearchLine,
	name: 'searchPage',
	preview: getSinglePagePreview('Suche'),
	title: 'Suche',
	type: 'document',
});

export default searchPage;
