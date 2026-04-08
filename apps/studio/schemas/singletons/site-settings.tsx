// oxlint-disable no-magic-numbers

import { RiLinksLine, RiSettings5Line } from 'react-icons/ri';
import { defineField, defineType } from 'sanity';

import { phoneFieldRegex } from '@/constants/regex';
import { meta } from '@/shared/field-groups';
import { metaField } from '@/shared/fields/meta';

const siteSettings = defineType({
	fields: [
		// Meta
		metaField,

		defineField({
			description: (
				<a
					href="https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadatabase"
					rel="noreferrer noopener"
					target="_blank"
				>
					Mehr Informationen
				</a>
			),
			group: 'meta',
			name: 'metadataBase',
			title: 'Metadata Base',
			type: 'url',
		}),

		// Contact
		defineField({
			fields: [
				defineField({
					description: 'Adresse (Straße Hausnummer, Postleitzahl Ort)',
					name: 'address',
					title: 'Adresse',
					type: 'string',
					validation: (Rule) => [Rule.required().error('Die Adresse ist erforderlich')],
				}),

				defineField({
					description: 'Telefonnummer',
					name: 'phone',
					title: 'Telefonnummer',
					type: 'string',
					validation: (Rule) => [
						Rule.required().error('Die Telefonnummer ist erforderlich'),
						Rule.regex(phoneFieldRegex).error(
							'Telefonnummer ist ungültig, sie muss wie folgt aussehen: +49 123 456789',
						),
					],
				}),

				defineField({
					description: 'E-Mail',
					name: 'email',
					title: 'E-Mail',
					type: 'string',
					validation: (Rule) => [Rule.required().error('Die E-Mail ist erforderlich')],
				}),
			],
			group: 'contact',
			name: 'contact',
			title: 'Kontakt',
			type: 'object',
		}),

		// Misc
		defineField({
			fields: [
				defineField({
					description: 'Titel des Newsletters',
					name: 'title',
					title: 'Titel',
					type: 'string',
					validation: (Rule) => [Rule.required().error('Der "Newsletter Titel" ist erforderlich')],
				}),

				defineField({
					description: 'Text für den Newsletter Absende-Button',
					name: 'cta',
					title: 'Button Text',
					type: 'string',
					validation: (Rule) => [
						Rule.required()
							.min(3)
							.error('Der "Newsletter Button Text" muss mindestens 3 Zeichen lang sein'),
						Rule.max(18).warning(
							'Der "Newsletter Button Text" sollte nicht länger als 18 Zeichen sein',
						),
					],
				}),
			],
			group: 'misc',
			icon: RiLinksLine,
			name: 'newsletter',
			title: 'Newsletter',
			type: 'object',
		}),

		// Navigation
		defineField({
			description: 'Seiten und/oder Links für die Hauptnavigation hinzufügen',
			group: 'navigation',
			name: 'mainNavigation',
			of: [
				{ title: 'Internal Link', type: 'internalLink' },
				{ title: 'External Link', type: 'externalLink' },
			],
			title: 'Hauptmenü',
			type: 'array',
			validation: (Rule) => Rule.required().error('Das Hauptmenü ist erforderlich'),
		}),

		defineField({
			description: 'Seiten für das rechtliches Menü hinzufügen',
			group: 'navigation',
			name: 'legalNavigation',
			of: [{ title: 'Internal Link', type: 'internalLink' }],
			title: 'Rechtliches Menü',
			type: 'array',
		}),

		// Social
		defineField({
			description: 'Social media',
			group: 'social',
			name: 'socialFields',
			title: 'Social Media',
			type: 'socialFields',
		}),
	],
	groups: [
		meta,
		{ name: 'contact', title: 'Kontakt' },
		{ name: 'misc', title: 'Misc' },
		{ name: 'navigation', title: 'Navigation' },
		{ name: 'social', title: 'Social' },
	],
	icon: RiSettings5Line,
	name: 'site-settings',
	preview: {
		prepare: () => ({ title: 'Generelle Einstellungen' }),
	},
	title: 'Generelle Einstellungen',
	type: 'document',
	validation: (Rule) => Rule.required().error('Die generellen Einstellungen sind erforderlich'),
});

export default siteSettings;
