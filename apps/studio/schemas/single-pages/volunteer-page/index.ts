import { RiUserStarLine, RiLinksLine, RiMailSendLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

import { areas, contactPersons, positions, voices, why } from './_groups';
import { areasSection, positionsSection, voicesSection, whySection } from './sections';

const inquiry = { name: 'inquiry', title: 'Anfragen' };

/**
 * The volunteer page `/verein/ehrenamt` (WEB-190). It holds every text of the page; the open
 * positions are documents of their own (`volunteer.position`).
 */
const volunteerPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('ehrenamt'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Content
		defineField({
			fields: [
				whySection,
				voicesSection,
				areasSection,
				positionsSection,
				contactPersonsSectionField,
			],
			group: 'content',
			groups: [why, voices, areas, positions, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),

		// Inquiry
		defineField({
			description: 'Wohin die Buttons der Seite ihre Meldungen als E-Mail schicken.',
			fields: [
				defineField({
					initialValue: 'info@tsg-irlich.de',
					name: 'email',
					title: 'E-Mail-Adresse',
					type: 'email',
					validation: (Rule) => [Rule.required().error('Die E-Mail-Adresse ist erforderlich')],
				}),
				defineField({
					description:
						'Der Betreff der Meldung. Bei einer offenen Aufgabe folgt ihr Titel: „Betreff: Titel der Aufgabe“.',
					initialValue: 'Ehrenamt bei der TSG Irlich',
					name: 'subject',
					title: 'Betreff',
					type: 'string',
					validation: (Rule) => [Rule.required().error('Der Betreff ist erforderlich')],
				}),
			],
			group: 'inquiry',
			icon: RiMailSendLine,
			name: 'inquiry',
			title: 'Anfragen',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Die Anfrage-Einstellungen sind erforderlich')],
		}),

		// Meta
		metaField,
	],
	groups: [general, content, inquiry, meta],
	icon: RiUserStarLine,
	name: 'volunteerPage',
	preview: getSinglePagePreview('Ehrenamt'),
	title: 'Ehrenamt',
	type: 'document',
});

export default volunteerPage;
