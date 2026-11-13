import { RiLinksLine, RiMailSendLine, RiMapPin2Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

import { contactPersons, home, others } from './_groups';
import { homeSection, othersSection } from './sections';

const inquiry = { name: 'inquiry', title: 'Anfragen' };

/**
 * The venue page `/verein/sportstaetten` (WEB-149). It holds the texts of the page and picks the
 * two home venues; every other venue appears on the page on its own.
 */
const venuePage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('sportstaetten'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Content
		defineField({
			fields: [homeSection, othersSection, contactPersonsSectionField],
			group: 'content',
			groups: [home, others, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),

		// Inquiry
		defineField({
			description: 'Wohin der Link des Kastens unter „Heimat“ seine Fragen als E-Mail schickt.',
			fields: [
				defineField({
					initialValue: 'info@tsg-irlich.de',
					name: 'email',
					title: 'E-Mail-Adresse',
					type: 'email',
					validation: (Rule) => [Rule.required().error('Die E-Mail-Adresse ist erforderlich')],
				}),
				defineField({
					initialValue: 'Frage zu den Sportstätten der TSG Irlich',
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
	icon: RiMapPin2Line,
	name: 'venuePage',
	preview: getSinglePagePreview('Sportstätten'),
	title: 'Sportstätten',
	type: 'document',
});

export default venuePage;
