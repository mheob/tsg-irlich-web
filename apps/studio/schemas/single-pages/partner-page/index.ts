import { RiHandHeartLine, RiLinksLine, RiMailSendLine } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { content, general, meta } from '@/shared/field-groups';
import { defaultHeroFields, getHiddenSlugField } from '@/shared/fields/general';
import { getHeroImageField, LANDSCAPE_HERO_DESCRIPTION } from '@/shared/fields/hero-image';
import { metaField } from '@/shared/fields/meta';
import { contactPersonsSectionField } from '@/shared/sections/contact-persons';
import { getSinglePagePreview } from '@/utils/previews';

import { contactPersons, partners, ways, why } from './_groups';
import { partnersSection, waysSection, whySection } from './sections';

const inquiry = { name: 'inquiry', title: 'Anfragen' };

const partnerPage = defineType({
	fields: [
		// (hidden)
		getHiddenSlugField('partner'),

		// General
		...defaultHeroFields,
		getHeroImageField(LANDSCAPE_HERO_DESCRIPTION),

		// Content
		defineField({
			fields: [whySection, waysSection, partnersSection, contactPersonsSectionField],
			group: 'content',
			groups: [why, ways, partners, contactPersons],
			icon: RiLinksLine,
			name: 'content',
			title: 'Inhalte',
			type: 'object',
			validation: (Rule) => [Rule.required().error('Inhalte sind erforderlich')],
		}),

		// Inquiry
		defineField({
			description: 'Wohin die Buttons der Seite ihre Anfragen als E-Mail schicken.',
			fields: [
				defineField({
					initialValue: 'partner@tsg-irlich.de',
					name: 'email',
					title: 'E-Mail-Adresse',
					type: 'email',
					validation: (Rule) => [Rule.required().error('Die E-Mail-Adresse ist erforderlich')],
				}),
				defineField({
					description:
						'Der Betreff der Anfrage. Bei einer Karte folgt ihr Titel: „Betreff: Titel der Karte“.',
					initialValue: 'Sponsoring bei der TSG Irlich',
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
	icon: RiHandHeartLine,
	name: 'partnerPage',
	preview: getSinglePagePreview('Sponsoren & Partner'),
	title: 'Sponsoren & Partner',
	type: 'document',
});

export default partnerPage;
